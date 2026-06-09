import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { JSONDB } from './src/server/db.js';
import { initializeAttendanceSocket, SocketNotifier } from './src/server/socket/attendanceSocket.js';
import { generateSessionPDF } from './src/server/services/pdfService.js';
import { generateSessionExcel } from './src/server/services/excelService.js';
import { Notification } from './src/types.js';

const db = JSONDB.getInstance();
const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'university-attendance-secret-2026';

// Create a combined HTTP server for REST and Socket.io operations
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Configure Socket.io listeners
initializeAttendanceSocket(io);

// SECURITY ENHANCEMENTS: Helmet, CORS, and JSON parser
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP for dev in-iframe visualization
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support larger base64 face snapshots

// Rate Limiter Rules for endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // max logins
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

const scanLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 mins
  max: 60, // max scans
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Scan speed limit reached. Please retry in some minutes.' }
});

// Log incoming API requests for debugging
app.use((req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.url}`);
  next();
});

// Middleware to verify JWT token
const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as any;
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const admin = db.getAdminByEmail(email);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check credentials
  const hashedPw = db.getAdminCredentials(email);
  if (!hashedPw) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  import('bcryptjs').then((bcryptModule) => {
    const bcrypt = bcryptModule.default;
    const isPwValid = bcrypt.compareSync(password, hashedPw);
    if (!isPwValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, fullName: admin.fullName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName
      }
    });
  }).catch((err) => {
    console.error('Bcrypt loading failed:', err);
    res.status(500).json({ error: 'Internal cryptography library error' });
  });
});

// Get current user details (Admin, Teacher or Student)
app.get('/api/auth/me', authenticateJWT, (req: any, res) => {
  if (req.user.role === 'teacher') {
    const teacher = db.getTeacherByEmail(req.user.email);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher user not found' });
    }
    return res.json({ teacher, role: 'teacher' });
  }

  if (req.user.role === 'student') {
    const student = db.getStudents().find(s => s.id === req.user.id);
    if (!student) {
      return res.status(404).json({ error: 'Student user not found' });
    }
    return res.json({ student, role: 'student' });
  }

  // Default to admin for backwards compatibility
  const admin = db.getAdminByEmail(req.user.email);
  if (!admin) {
    return res.status(404).json({ error: 'Admin user not found' });
  }
  res.json({ admin, role: 'admin' });
});

// ==========================================
// 2. DASHBOARD STATS ENDPOINT
// ==========================================
app.get('/api/dashboard/stats', authenticateJWT, (req, res) => {
  res.json(db.getDashboardStats());
});

// ==========================================
// 3. STUDENT ENDPOINTS (CRUD)
// ==========================================
app.get('/api/students', authenticateJWT, (req, res) => {
  let list = db.getStudents();
  
  // Apply Search
  const query = req.query.q as string;
  if (query) {
    const qLower = query.toLowerCase();
    list = list.filter(s => 
      s.fullName.toLowerCase().includes(qLower) || 
      s.rollNumber.toLowerCase().includes(qLower) ||
      s.email.toLowerCase().includes(qLower) ||
      s.department.toLowerCase().includes(qLower)
    );
  }

  // Apply Filters
  const department = req.query.department as string;
  if (department && department !== 'All') {
    list = list.filter(s => s.department === department);
  }

  const year = req.query.year as string;
  if (year && year !== 'All') {
    list = list.filter(s => s.year === year);
  }

  res.json(list);
});

app.post('/api/students', authenticateJWT, (req, res) => {
  const { fullName, rollNumber, email, department, year, division, profilePhoto } = req.body;
  if (!fullName || !rollNumber || !email || !department || !year || !division) {
    return res.status(400).json({ error: 'Missing required student fields' });
  }

  try {
    const defaultPhoto = profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;
    const newStudent = db.createStudent({
      fullName,
      rollNumber,
      email,
      department,
      year,
      division,
      profilePhoto: defaultPhoto
    });
    res.status(201).json(newStudent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id', authenticateJWT, (req, res) => {
  try {
    const updated = db.updateStudent(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/students/:id', authenticateJWT, (req, res) => {
  try {
    db.deleteStudent(req.params.id);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});


// ==========================================
// 4. TEACHER ENDPOINTS (CRUD)
// ==========================================
app.get('/api/teachers', authenticateJWT, (req, res) => {
  let list = db.getTeachers();

  // Apply Search
  const query = req.query.q as string;
  if (query) {
    const qLower = query.toLowerCase();
    list = list.filter(t => 
      t.fullName.toLowerCase().includes(qLower) || 
      t.employeeId.toLowerCase().includes(qLower) ||
      t.email.toLowerCase().includes(qLower) ||
      t.department.toLowerCase().includes(qLower)
    );
  }

  // Filter department
  const department = req.query.department as string;
  if (department && department !== 'All') {
    list = list.filter(t => t.department === department);
  }

  res.json(list);
});

app.post('/api/teachers', authenticateJWT, (req, res) => {
  const { fullName, employeeId, email, department, phoneNumber, profilePhoto } = req.body;
  if (!fullName || !employeeId || !email || !department || !phoneNumber) {
    return res.status(400).json({ error: 'Missing required teacher fields' });
  }

  try {
    const defaultPhoto = profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;
    const newTeacher = db.createTeacher({
      fullName,
      employeeId,
      email,
      department,
      phoneNumber,
      profilePhoto: defaultPhoto
    });
    res.status(201).json(newTeacher);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/teachers/:id', authenticateJWT, (req, res) => {
  try {
    const updated = db.updateTeacher(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/teachers/:id', authenticateJWT, (req, res) => {
  try {
    db.deleteTeacher(req.params.id);
    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});


// ==========================================
// 5. SUBJECT ENDPOINTS (CRUD)
// ==========================================
app.get('/api/subjects', authenticateJWT, (req, res) => {
  let list = db.getSubjects();

  // Apply Search
  const query = req.query.q as string;
  if (query) {
    const qLower = query.toLowerCase();
    list = list.filter(s => 
      s.name.toLowerCase().includes(qLower) || 
      s.code.toLowerCase().includes(qLower) ||
      s.department.toLowerCase().includes(qLower)
    );
  }

  // Filter department
  const department = req.query.department as string;
  if (department && department !== 'All') {
    list = list.filter(s => s.department === department);
  }

  res.json(list);
});

app.post('/api/subjects', authenticateJWT, (req, res) => {
  const { name, code, department, semester, teacherId } = req.body;
  if (!name || !code || !department || !semester) {
    return res.status(400).json({ error: 'Missing required subject fields' });
  }

  try {
    const newSubject = db.createSubject({
      name,
      code,
      department,
      semester,
      teacherId: teacherId || ''
    });
    res.status(201).json(newSubject);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/subjects/:id', authenticateJWT, (req, res) => {
  try {
    const updated = db.updateSubject(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/subjects/:id', authenticateJWT, (req, res) => {
  try {
    db.deleteSubject(req.params.id);
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});


// ==========================================
// 6. ATTENDANCE ENDPOINTS
// ==========================================
app.get('/api/attendance', authenticateJWT, (req, res) => {
  let list = db.getAttendance();

  // Filter Date (YYYY-MM-DD)
  const date = req.query.date as string;
  if (date) {
    list = list.filter(a => a.date === date);
  }

  // Filter Subject
  const subjectId = req.query.subjectId as string;
  if (subjectId && subjectId !== 'All') {
    list = list.filter(a => a.subjectId === subjectId);
  }

  // Filter Student
  const studentId = req.query.studentId as string;
  if (studentId && studentId !== 'All') {
    list = list.filter(a => a.studentId === studentId);
  }

  // Filter Teacher
  const teacherId = req.query.teacherId as string;
  if (teacherId && teacherId !== 'All') {
    list = list.filter(a => a.teacherId === teacherId);
  }

  // Search by Roll Number or Name
  const search = req.query.q as string;
  if (search) {
    const sLower = search.toLowerCase();
    list = list.filter(a => 
      a.studentName.toLowerCase().includes(sLower) ||
      a.rollNumber.toLowerCase().includes(sLower)
    );
  }

  res.json(list);
});

// Create attendance logs manually by Admin
app.post('/api/attendance', authenticateJWT, (req, res) => {
  const { studentId, subjectId, date, time, status } = req.body;
  if (!studentId || !subjectId || !date || !time || !status) {
    return res.status(400).json({ error: 'Missing required attendance fields' });
  }

  const student = db.getStudents().find(s => s.id === studentId);
  const subject = db.getSubjects().find(sub => sub.id === subjectId);
  
  if (!student) return res.status(404).json({ error: 'Student not found' });
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const teacher = db.getTeachers().find(t => t.id === subject.teacherId);
  const teacherName = teacher ? teacher.fullName : 'Not Assigned';
  const teacherId = teacher ? teacher.id : '';

  const newRecord = db.addAttendance({
    studentId,
    studentName: student.fullName,
    rollNumber: student.rollNumber,
    subjectId,
    subjectName: subject.name,
    date,
    time,
    status,
    teacherId,
    teacherName
  });

  res.status(201).json(newRecord);
});


// ==========================================
// 7. QR SESSIONS ENDPOINTS
// ==========================================
app.get('/api/qr-sessions', authenticateJWT, (req, res) => {
  res.json(db.getQRSessions());
});

app.post('/api/qr-sessions', authenticateJWT, (req, res) => {
  const { subjectId, durationMinutes } = req.body;
  if (!subjectId || !durationMinutes) {
    return res.status(400).json({ error: 'Subject and duration are required' });
  }

  const subject = db.getSubjects().find(s => s.id === subjectId);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const teacher = db.getTeachers().find(t => t.id === subject.teacherId);
  const teacherName = teacher ? teacher.fullName : 'Not Assigned';
  const teacherId = teacher ? teacher.id : '';

  const generatedTime = new Date();
  const expiryTime = new Date(generatedTime.getTime() + durationMinutes * 60 * 1000);
  const sessionCode = `QR_ATT_${subject.code}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const newSession = db.createQRSession({
    subjectId,
    subjectName: subject.name,
    teacherId,
    teacherName,
    generatedTime: generatedTime.toISOString(),
    expiryTime: expiryTime.toISOString(),
    status: 'Active',
    sessionCode
  });

  res.status(201).json(newSession);
});

// Create the dedicated /api/attendance/create-session route
app.post('/api/attendance/create-session', authenticateJWT, (req: any, res) => {
  const { subjectId, durationMinutes } = req.body;
  if (!subjectId || !durationMinutes) {
    return res.status(400).json({ error: 'subjectId and durationMinutes are required' });
  }

  const subject = db.getSubjects().find(s => s.id === subjectId);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  // Get active teacher details
  const teacher = db.getTeachers().find(t => t.id === subject.teacherId) || db.getTeacherByEmail(req.user.email);
  if (!teacher) return res.status(404).json({ error: 'Teacher registration not found' });

  const generatedTime = new Date();
  const expiryTime = new Date(generatedTime.getTime() + durationMinutes * 60 * 1000);
  const sessionCode = `QR_ATT_${subject.code}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const newSession = db.createQRSession({
    subjectId,
    subjectName: subject.name,
    teacherId: teacher.id,
    teacherName: teacher.fullName,
    generatedTime: generatedTime.toISOString(),
    expiryTime: expiryTime.toISOString(),
    status: 'Active',
    sessionCode
  });

  // Post systemic broadcast notification to notify all students
  db.createNotification({
    userId: 'all', // global notification
    title: 'Attendance Gate Opened',
    message: `${teacher.fullName} started check-ins for "${subject.name}". Scan to verify attendance before timeout.`,
    type: 'info'
  });

  // Broadcast through Socket.io
  SocketNotifier.notifySessionStarted(newSession);

  res.status(201).json(newSession);
});

app.put('/api/qr-sessions/:id/expire', authenticateJWT, (req, res) => {
  try {
    const session = db.expireQRSession(req.params.id);
    res.json(session);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});


// ==========================================
// 7.5 SCAN SIMULATOR: ADD ENTRY BY QR CODE
// ==========================================
app.post('/api/qr-sessions/scan', authenticateJWT, (req, res) => {
  const { sessionCode, studentId } = req.body;

  if (!sessionCode || !studentId) {
    return res.status(400).json({ error: 'sessionCode and studentId are required' });
  }

  // Find active session
  const session = db.getQRSessions().find(s => s.sessionCode === sessionCode);
  if (!session) {
    return res.status(404).json({ error: 'Invalid attendance session code' });
  }

  if (session.status === 'Expired' || new Date(session.expiryTime) < new Date()) {
    return res.status(400).json({ error: 'This QR Code Session has expired' });
  }

  // Find student
  const student = db.getStudents().find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student registration not found' });
  }

  // Check if student already has attendance log for this session today
  const todayStr = new Date().toISOString().split('T')[0];
  const alreadyLogged = db.getAttendance().some(
    a => a.studentId === studentId && 
         a.subjectId === session.subjectId && 
         a.date === todayStr
  );

  if (alreadyLogged) {
    return res.status(400).json({ error: 'Attendance already recorded for this subject today.' });
  }

  // Calculate status (Present or Late)
  const generatedTimeObj = new Date(session.generatedTime);
  const minsDiff = (new Date().getTime() - generatedTimeObj.getTime()) / (1000 * 60);
  
  // Late if exceeds 5 minutes of creation
  const status = (minsDiff > 5) ? 'Late' : 'Present';
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

  const record = db.addAttendance({
    studentId,
    studentName: student.fullName,
    rollNumber: student.rollNumber,
    subjectId: session.subjectId,
    subjectName: session.subjectName,
    date: todayStr,
    time: timeStr,
    status,
    teacherId: session.teacherId,
    teacherName: session.teacherName
  });

  res.status(201).json({
    success: true,
    message: `Successfully marked ${student.fullName} as ${status}!`,
    record
  });
});


// ==========================================
// 8. SETTINGS & PROFILE MANAGEMENT
// ==========================================
app.get('/api/settings', authenticateJWT, (req, res) => {
  res.json(db.getSystemSettings());
});

app.put('/api/settings', authenticateJWT, (req, res) => {
  const updated = db.updateSystemSettings(req.body);
  res.json(updated);
});

// Update profile details
app.put('/api/auth/profile', authenticateJWT, (req: any, res) => {
  const { fullName, email, currentPassword, newPassword } = req.body;
  if (!fullName || !email) {
    return res.status(400).json({ error: 'Full Name and Email are required' });
  }

  const oldEmail = req.user.email;
  const admin = db.getAdminByEmail(oldEmail);
  if (!admin) {
    return res.status(404).json({ error: 'Admin not found' });
  }

  try {
    // If Admin is updating password
    if (newPassword && currentPassword) {
      const hashedPw = db.getAdminCredentials(oldEmail);
      if (hashedPw) {
        import('bcryptjs').then((bcryptModule) => {
          const bcrypt = bcryptModule.default;
          if (!bcrypt.compareSync(currentPassword, hashedPw)) {
            return res.status(400).json({ error: 'Existing password does not match' });
          }
          db.updateAdminPassword(email, newPassword);
          const updated = db.updateAdminProfile(admin.id, fullName, email);
          res.json({ admin: updated, message: 'Profile and password updated successfully' });
        });
        return;
      }
    }

    const updated = db.updateAdminProfile(admin.id, fullName, email);
    res.json({ admin: updated, message: 'Profile updated successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});


// ==========================================
// 9. TEACHER MODULE SPECIAL ENDPOINTS
// ==========================================

// Teacher Login
app.post('/api/teacher/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const teacher = db.getTeacherByEmail(email);
  if (!teacher) {
    return res.status(401).json({ error: 'Invalid teacher email or password' });
  }

  const hashedPw = db.getTeacherCredentials(email);
  if (!hashedPw) {
    return res.status(401).json({ error: 'Invalid teacher email or password' });
  }

  import('bcryptjs').then((bcryptModule) => {
    const bcrypt = bcryptModule.default;
    const isPwValid = bcrypt.compareSync(password, hashedPw);
    if (!isPwValid) {
      return res.status(401).json({ error: 'Invalid teacher password' });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: teacher.id, email: teacher.email, fullName: teacher.fullName, role: 'teacher' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      teacher,
      role: 'teacher'
    });
  }).catch((err) => {
    console.error('Bcrypt loading failed:', err);
    res.status(500).json({ error: 'Internal cryptography library error' });
  });
});

// Teacher Logout
app.post('/api/teacher/logout', (req, res) => {
  res.json({ success: true, message: 'Teacher logged out successfully' });
});

// Get current teacher profile
app.get('/api/teacher/profile', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Teachers only.' });
  }
  const teacher = db.getTeacherByEmail(req.user.email);
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher profile not found' });
  }
  res.json({ teacher });
});

// Edit teacher profile / change password
app.put('/api/teacher/profile', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Teachers only.' });
  }
  
  const { fullName, email, phoneNumber, currentPassword, newPassword } = req.body;
  if (!fullName || !email) {
    return res.status(400).json({ error: 'Full Name and Email are required' });
  }

  const oldEmail = req.user.email;
  const teacher = db.getTeacherByEmail(oldEmail);
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found' });
  }

  try {
    const handleProfileUpdate = () => {
      const updated = db.updateTeacher(teacher.id, { fullName, email, phoneNumber });
      res.json({ teacher: updated, message: 'Profile updated successfully' });
    };

    if (newPassword && currentPassword) {
      const hashedPw = db.getTeacherCredentials(oldEmail);
      if (hashedPw) {
        import('bcryptjs').then((bcryptModule) => {
          const bcrypt = bcryptModule.default;
          if (!bcrypt.compareSync(currentPassword, hashedPw)) {
            return res.status(400).json({ error: 'Existing password does not match' });
          }
          db.updateTeacherPassword(email, newPassword);
          handleProfileUpdate();
        });
        return;
      }
    }

    handleProfileUpdate();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get assigned subjects
app.get('/api/teacher/subjects', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const teacher = db.getTeacherByEmail(req.user.email);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  const list = db.getSubjects().filter(s => s.teacherId === teacher.id);
  res.json(list);
});

// Get subject details with enrolled students list
app.get('/api/teacher/subjects/:id', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const subject = db.getSubjects().find(s => s.id === req.params.id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  // Get enrolled students by matching department
  const students = db.getStudents().filter(s => s.department.toLowerCase() === subject.department.toLowerCase());
  
  res.json({ subject, students });
});

// Create attendance session
app.post('/api/teacher/attendance/session', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { subjectId, durationMinutes } = req.body;
  if (!subjectId || !durationMinutes) {
    return res.status(400).json({ error: 'subjectId and durationMinutes are required' });
  }

  const subject = db.getSubjects().find(s => s.id === subjectId);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const teacher = db.getTeacherByEmail(req.user.email);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  const generatedTime = new Date();
  const expiryTime = new Date(generatedTime.getTime() + durationMinutes * 60 * 1000);
  const sessionCode = `QR_ATT_${subject.code}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const newSession = db.createQRSession({
    subjectId,
    subjectName: subject.name,
    teacherId: teacher.id,
    teacherName: teacher.fullName,
    generatedTime: generatedTime.toISOString(),
    expiryTime: expiryTime.toISOString(),
    status: 'Active',
    sessionCode
  });

  // Post systemic broadcast notification to notify all students
  db.createNotification({
    userId: 'all', // global notification
    title: 'Attendance Gate Opened',
    message: `${teacher.fullName} started check-ins for "${subject.name}". Scan to verify attendance before timeout.`,
    type: 'info'
  });

  // Broadcast through Socket.io
  SocketNotifier.notifySessionStarted(newSession);

  res.status(201).json(newSession);
});

// Get target session info
app.get('/api/teacher/attendance/session/:id', authenticateJWT, (req: any, res) => {
  const session = db.getQRSessions().find(s => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// End active QR session
app.put('/api/teacher/attendance/session/end', authenticateJWT, (req: any, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  try {
    const expired = db.expireQRSession(sessionId);
    // Broadcast end session websocket event
    SocketNotifier.notifySessionEnded(sessionId);
    res.json(expired);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// Get live attendance list for current session or general student-wise
app.get('/api/teacher/attendance', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(455).json({ error: 'Access denied' });
  }
  
  const teacher = db.getTeacherByEmail(req.user.email);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  let list = db.getAttendance().filter(a => a.teacherId === teacher.id);

  // Filter by subject
  const subjectId = req.query.subjectId as string;
  if (subjectId) {
    list = list.filter(a => a.subjectId === subjectId);
  }

  // Filter by dynamic code or date
  const dateObj = req.query.date as string;
  if (dateObj) {
    list = list.filter(a => a.date === dateObj);
  }

  res.json(list);
});

// Get previous attendance records
app.get('/api/teacher/attendance/history', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const teacher = db.getTeacherByEmail(req.user.email);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  const list = db.getAttendance().filter(a => a.teacherId === teacher.id);
  res.json(list);
});

// Get attendance report data
app.get('/api/teacher/attendance/report', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const teacher = db.getTeacherByEmail(req.user.email);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  const attendanceList = db.getAttendance().filter(a => a.teacherId === teacher.id);
  const subjectsList = db.getSubjects().filter(s => s.teacherId === teacher.id);
  const studentsList = db.getStudents();

  res.json({ attendance: attendanceList, subjects: subjectsList, students: studentsList });
});


// ==========================================
// 10. STUDENT MODULE ENDPOINTS
// ==========================================

// Student Login (rollNumber, password)
app.post('/api/student/login', (req, res) => {
  const { rollNumber, password } = req.body;

  if (!rollNumber || !password) {
    return res.status(400).json({ error: 'Roll number and password are required' });
  }

  const student = db.getStudentByRollNumber(rollNumber);
  if (!student) {
    return res.status(401).json({ error: 'Invalid roll number or password' });
  }

  const hashedPw = db.getStudentCredentials(rollNumber);
  if (!hashedPw) {
    return res.status(401).json({ error: 'Invalid roll number or password' });
  }

  import('bcryptjs').then((bcryptModule) => {
    const bcrypt = bcryptModule.default;
    const isPwValid = bcrypt.compareSync(password, hashedPw);
    if (!isPwValid) {
      return res.status(401).json({ error: 'Invalid roll number or password' });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: student.id, email: student.email, fullName: student.fullName, rollNumber: student.rollNumber, role: 'student' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      student,
      role: 'student'
    });
  }).catch((err) => {
    console.error('Bcrypt loading failed:', err);
    res.status(500).json({ error: 'Internal cryptography library error' });
  });
});

// Student Logout
app.post('/api/student/logout', (req, res) => {
  res.json({ success: true, message: 'Student logged out successfully' });
});

// Get student profile
app.get('/api/student/profile', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }
  const student = db.getStudents().find(s => s.id === req.user.id);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found' });
  }
  res.json({ student });
});

// Update student profile (email, profile photo)
app.put('/api/student/profile', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }
  const student = db.getStudents().find(s => s.id === req.user.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  const { email, profilePhoto } = req.body;
  
  try {
    const updated = db.updateStudent(student.id, {
      email: email || student.email,
      profilePhoto: profilePhoto || student.profilePhoto
    });
    res.json({ student: updated, message: 'Profile updated successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Student Change Password
app.put('/api/student/change-password', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  const student = db.getStudents().find(s => s.id === req.user.id);
  if (!student) {
    return res.status(404).json({ error: 'Student user not found' });
  }

  const hashedPw = db.getStudentCredentials(student.rollNumber);
  if (!hashedPw) {
    return res.status(401).json({ error: 'Student credentials not found' });
  }

  import('bcryptjs').then((bcryptModule) => {
    const bcrypt = bcryptModule.default;
    if (!bcrypt.compareSync(currentPassword, hashedPw)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    db.updateStudentPassword(student.rollNumber, newPassword);
    res.json({ message: 'Password changed successfully' });
  }).catch((err) => {
    console.error('Bcrypt loading failed:', err);
    res.status(500).json({ error: 'Internal cryptography library error' });
  });
});

// Get active subjects enrolled by the student
app.get('/api/student/subjects', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }
  const student = db.getStudents().find(s => s.id === req.user.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Filter subjects belonging to student's department
  const list = db.getSubjects().filter(s => s.department.toLowerCase() === student.department.toLowerCase());

  // Enrich with teacher info and attendance totals
  const attendanceList = db.getAttendance().filter(a => a.studentId === student.id);
  const enrichedList = list.map(subject => {
    const teacher = db.getTeachers().find(t => t.id === subject.teacherId);
    
    // Calculate student attendance for this subject
    const subjectAttendance = attendanceList.filter(a => a.subjectId === subject.id);
    const attendedCount = subjectAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    
    // Simulated total available classes
    const totalLectureCount = 10;
    const percentage = Math.round((attendedCount / totalLectureCount) * 100);

    return {
      ...subject,
      teacherName: teacher ? teacher.fullName : 'Not Assigned',
      teacherPhoto: teacher ? teacher.profilePhoto : '',
      analytics: {
        attended: attendedCount,
        total: totalLectureCount,
        percentage
      }
    };
  });

  res.json(enrichedList);
});

// Get individual subject statistics & details
app.get('/api/student/subjects/:id', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }
  const student = db.getStudents().find(s => s.id === req.user.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const subject = db.getSubjects().find(s => s.id === req.params.id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const teacher = db.getTeachers().find(t => t.id === subject.teacherId);
  const teacherName = teacher ? teacher.fullName : 'Not Assigned';

  const studentAttendance = db.getAttendance().filter(
    a => a.studentId === student.id && a.subjectId === subject.id
  );

  res.json({
    subject: {
      ...subject,
      teacherName
    },
    attendance: studentAttendance
  });
});

// Auxiliary helper for biometric vector verification (Euclidean Distance calculation)
function calculateEuclideanDistance(v1: number[], v2: number[]): number {
  if (!v1 || !v2 || v1.length !== v2.length) return 1.0;
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    sum += Math.pow(v1[i] - v2[i], 2);
  }
  return Math.sqrt(sum);
}

// Haversine formula helper for geodesic campus coordinates distance
function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Campus center benchmark and verification threshold radius
const CAMPUS_LAT = 18.5204;
const CAMPUS_LNG = 73.8567;
const MAX_RADIUS_METERS = 200; // 200 meters geo boundary fence

// Geofencing Middleware: Verify student is on campus using Haversine formula
const verifyCampusLocation = (req: any, res: any, next: any) => {
  const { latitude, longitude } = req.body;
  
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'GPS verification required. Please enable Geolocation on your device.' });
  }

  // Calculate geodesic distance from benchmark campus coordinates
  const distance = calculateDistanceInMeters(
    Number(latitude), 
    Number(longitude), 
    CAMPUS_LAT, 
    CAMPUS_LNG
  );

  if (distance > MAX_RADIUS_METERS) {
    return res.status(400).json({ 
      error: `GPS Bounds Mismatch. Campus presence not confirmed. Distance: ${Math.round(distance)}m from campus centre. (Fence: ${MAX_RADIUS_METERS}m)` 
    });
  }

  // Inject computed distance into req object for downstream use
  req.campusDistance = distance;
  next();
};

// Scan and record attendance using live QR code session validation
app.post('/api/student/scan-attendance', authenticateJWT, scanLimiter, verifyCampusLocation, (req: any, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }
  
  const { sessionCode, latitude, longitude, faceDescriptor, selfieImage } = req.body;
  if (!sessionCode) {
    return res.status(400).json({ error: 'sessionCode has not been fetched.' });
  }

  // Support splitting complex token formatted qr code: "sessionId|qrToken"
  const scanParts = sessionCode.split('|');
  const targetSessionId = scanParts[0];
  const targetQrToken = scanParts[1];

  // Find active session by id or code
  const session = db.getQRSessions().find(s => s.id === targetSessionId || s.sessionCode === targetSessionId);
  if (!session) {
    return res.status(404).json({ error: 'Invalid attendance session code or expired QR code.' });
  }

  const now = new Date();
  if (session.status === 'Expired' || new Date(session.expiryTime) < now) {
    return res.status(400).json({ error: 'This QR Code Session has expired' });
  }

  // Validate ROTATING TOKEN if provided
  if (targetQrToken && session.qrToken && session.qrToken !== targetQrToken) {
    return res.status(400).json({ 
      error: 'Expired dynamic token. Point your camera at the updated live QR code on the teacher screen.' 
    });
  }

  const student = db.getStudents().find(s => s.id === req.user.id);
  if (!student) {
    return res.status(404).json({ error: 'Student registration not found' });
  }

  // 1. GEOLOCATION GPS VERIFICATION (ALREADY VERIFIED VIA MIDDLEWARE)

  // 2. FACE BIOMETRICS VERIFICATION
  if (student.faceDescriptor && student.faceDescriptor.length > 0) {
    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ error: 'Facial Biometric mapping is required for validation.' });
    }

    const biometricDist = calculateEuclideanDistance(student.faceDescriptor, faceDescriptor);
    if (biometricDist > 0.6) {
      return res.status(400).json({ 
        error: `Biometric matching criteria failed (distance: ${biometricDist.toFixed(3)}). Proxy protection blocked other checkout.` 
      });
    }
  }

  // Check enrollment integrity
  const subject = db.getSubjects().find(sub => sub.id === session.subjectId);
  if (subject && subject.department.toLowerCase() !== student.department.toLowerCase()) {
    return res.status(400).json({ error: 'You are not enrolled in this department/course' });
  }

  // Check if attendance already logged today
  const todayStr = now.toISOString().split('T')[0];
  const alreadyLogged = db.getAttendance().some(
    a => a.studentId === student.id && 
         a.subjectId === session.subjectId && 
         a.date === todayStr
  );

  if (alreadyLogged) {
    return res.status(400).json({ error: 'Attendance already recorded for this subject today.' });
  }

  const generatedTimeObj = new Date(session.generatedTime);
  const minsDiff = (now.getTime() - generatedTimeObj.getTime()) / (1000 * 60);
  
  // Mark 'Late' if scan succeeds after 5 minutes of QR generation
  const status = (minsDiff > 5) ? 'Late' : 'Present';
  const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

  // Record Attendance with GPS Coordinates 
  const record = db.addAttendance({
    studentId: student.id,
    studentName: student.fullName,
    rollNumber: student.rollNumber,
    subjectId: session.subjectId,
    subjectName: session.subjectName,
    date: todayStr,
    time: timeStr,
    status,
    teacherId: session.teacherId,
    teacherName: session.teacherName,
    latitude,
    longitude,
    attendanceTime: now.toISOString(),
    selfieImage: selfieImage || ''
  });

  // Create Student Notification pushing immediately
  db.createNotification({
    userId: student.id,
    title: 'Attendance Checked-In',
    message: `Your presence has been successfully filed for "${session.subjectName}" as "${status}" with verified GPS & biometrics!`,
    type: 'success'
  });

  // Emit websocket update so the teacher panel updates automatically in real-time
  SocketNotifier.notifyAttendanceMarked(session.id, {
    studentId: student.id,
    studentName: student.fullName,
    rollNumber: student.rollNumber,
    status,
    time: timeStr,
    latitude,
    longitude
  });

  res.status(201).json({
    success: true,
    message: `Successfully marked ${student.fullName} as ${status}!`,
    record
  });
});

// Get list of overall attendance logs for current student
app.get('/api/student/attendance', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }
  const list = db.getAttendance().filter(a => a.studentId === req.user.id);
  res.json(list);
});

// Get attendance history logs for current student with filtering
app.get('/api/student/attendance/history', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }
  let list = db.getAttendance().filter(a => a.studentId === req.user.id);
  
  // Search query (subject or lecturer name)
  const q = req.query.q as string;
  if (q) {
    const qLower = q.toLowerCase();
    list = list.filter(a => 
      a.subjectName.toLowerCase().includes(qLower) ||
      a.teacherName.toLowerCase().includes(qLower)
    );
  }

  // Status Filter
  const status = req.query.status as string;
  if (status && status !== 'All') {
    list = list.filter(a => a.status.toLowerCase() === status.toLowerCase());
  }

  res.json(list);
});

// Get advanced student attendance analytics
app.get('/api/student/attendance/analytics', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }
  const student = db.getStudents().find(s => s.id === req.user.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const attendanceList = db.getAttendance().filter(a => a.studentId === student.id);
  const studentSubjects = db.getSubjects().filter(s => s.department.toLowerCase() === student.department.toLowerCase());

  let present = 0;
  let late = 0;
  let absent = 0;

  attendanceList.forEach(a => {
    if (a.status === 'Present') present++;
    else if (a.status === 'Late') late++;
    else if (a.status === 'Absent') absent++;
  });

  const subjectBreakdown = studentSubjects.map(sub => {
    const totalSubjectClasses = 10; // Constant class limit
    const subjectAttendance = attendanceList.filter(a => a.subjectId === sub.id);
    const attended = subjectAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    
    return {
      subjectId: sub.id,
      subjectName: sub.name,
      subjectCode: sub.code,
      attended,
      total: totalSubjectClasses,
      percentage: Math.round((attended / totalSubjectClasses) * 100)
    };
  });

  const totalClassesCount = studentSubjects.length * 10;
  const totalAttendedCount = present + late;
  const overallPercentage = totalClassesCount > 0 ? Math.round((totalAttendedCount / totalClassesCount) * 100) : 0;

  res.json({
    present,
    late,
    absent,
    overallPercentage,
    totalClassesCount,
    totalAttendedCount,
    subjectBreakdown
  });
});

// Get student reports list
app.get('/api/student/reports', authenticateJWT, (req: any, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }
  const student = db.getStudents().find(s => s.id === req.user.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const attendanceList = db.getAttendance().filter(a => a.studentId === student.id);
  const subjectsList = db.getSubjects().filter(s => s.department.toLowerCase() === student.department.toLowerCase());

  res.json({
    student,
    attendance: attendanceList,
    subjects: subjectsList
  });
});

// REAL PDF / Excel and SYSTEM NOTIFICATIONS API ENDPOINTS
app.get('/api/notifications', authenticateJWT, (req: any, res) => {
  try {
    const list = db.getNotifications(req.user.id);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', authenticateJWT, (req: any, res) => {
  try {
    const updated = db.markNotificationAsRead(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.get('/api/reports/pdf/:sessionId', authenticateJWT, async (req: any, res) => {
  const { sessionId } = req.params;
  try {
    const pdfBuffer = await generateSessionPDF(sessionId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_session_${sessionId}.pdf`);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('PDF compilation failure:', err);
    res.status(500).send(`Failed to build PDF report: ${err.message}`);
  }
});

app.get('/api/reports/excel/:sessionId', authenticateJWT, async (req: any, res) => {
  const { sessionId } = req.params;
  try {
    const excelBuffer = await generateSessionExcel(sessionId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_session_${sessionId}.xlsx`);
    res.send(excelBuffer);
  } catch (err: any) {
    console.error('Excel compilation failure:', err);
    res.status(500).send(`Failed to compile Excel sheet: ${err.message}`);
  }
});


// ==========================================
// VITE CLIENT INTEGRATION
// ==========================================

async function startViteServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[VITE] Middleware enabled for hot reloading simulation');
  } else {
    // Direct static folder serving for production deployments
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[PRODUCTION] Static build server mounting to port 3000');
  }

  // Bind Combined httpServer supporting Express Routes and WebSockets to Port 3000
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[ERP ATTENDANCE SERVER WITH SOCKETS] Full-stack hub listening on port ${PORT}`);
  });
}

startViteServer().catch((err) => {
  console.error('[CRITICAL] Webserver initiation crashed:', err);
});
