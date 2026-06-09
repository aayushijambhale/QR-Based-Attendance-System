import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Student, Teacher, Subject, Attendance, QRSession, Admin, DashboardStats, Notification } from '../types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface Schema {
  admins: Admin[];
  // Store authentication credentials separately & securely
  adminCredentials: Record<string, string>; // email -> hashedPassword
  teacherCredentials: Record<string, string>; // teacher email -> hashedPassword
  studentCredentials: Record<string, string>; // student rollNumber -> hashedPassword
  students: Student[];
  teachers: Teacher[];
  subjects: Subject[];
  attendance: Attendance[];
  qrSessions: QRSession[];
  notifications: Notification[];
  systemSettings: {
    collegeName: string;
    academicYear: string;
    refreshIntervalSeconds: number;
    allowLateAttendance: boolean;
  };
}

// Default initial state with robust, realistic ERP sample data
const createInitialState = (): Schema => {
  const salt = bcrypt.genSaltSync(10);
  const hashedDefaultPassword = bcrypt.hashSync('password123', salt);

  const teacherIds = ['t1', 't2', 't3', 't4'];
  const subjectIds = ['sub1', 'sub2', 'sub3', 'sub4', 'sub5'];
  const studentIds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];

  const teachers: Teacher[] = [
    {
      id: 't1',
      fullName: 'Dr. Aris Thorne',
      employeeId: 'EMP-CS-001',
      email: 'aris.thorne@college.edu',
      department: 'Computer Science',
      phoneNumber: '+1 (555) 0192',
      profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 't2',
      fullName: 'Prof. Clara Vance',
      employeeId: 'EMP-EC-005',
      email: 'clara.vance@college.edu',
      department: 'Electronics',
      phoneNumber: '+1 (555) 0184',
      profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 't3',
      fullName: 'Dr. Evelyn Foster',
      employeeId: 'EMP-CS-009',
      email: 'evelyn.foster@college.edu',
      department: 'Computer Science',
      phoneNumber: '+1 (555) 0177',
      profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 't4',
      fullName: 'Prof. Julian Cruz',
      employeeId: 'EMP-ME-012',
      email: 'julian.cruz@college.edu',
      department: 'Mechanical',
      phoneNumber: '+1 (555) 0145',
      profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const students: Student[] = [
    {
      id: 's1',
      fullName: 'Aiden Mitchell',
      rollNumber: 'CS-2023-04',
      email: 'aiden.mitchell@student.edu',
      department: 'Computer Science',
      year: 'TE',
      division: 'A',
      profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=faces',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 's2',
      fullName: 'Sophia Patel',
      rollNumber: 'CS-2023-18',
      email: 'sophia.patel@student.edu',
      department: 'Computer Science',
      year: 'TE',
      division: 'A',
      profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 's3',
      fullName: 'Marcus Vance',
      rollNumber: 'CS-2023-32',
      email: 'marcus.vance@student.edu',
      department: 'Computer Science',
      year: 'TE',
      division: 'B',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 's4',
      fullName: 'Lily Evans',
      rollNumber: 'EC-2023-08',
      email: 'lily.evans@student.edu',
      department: 'Electronics',
      year: 'SE',
      division: 'A',
      profilePhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 's5',
      fullName: 'Xavier Jordan',
      rollNumber: 'CS-2024-11',
      email: 'xavier.jordan@student.edu',
      department: 'Computer Science',
      year: 'SE',
      division: 'A',
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 's6',
      fullName: 'Chloe Zhang',
      rollNumber: 'EC-2023-22',
      email: 'chloe.zhang@student.edu',
      department: 'Electronics',
      year: 'TE',
      division: 'B',
      profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 's7',
      fullName: 'Oliver Bennett',
      rollNumber: 'ME-2022-19',
      email: 'oliver.bennett@student.edu',
      department: 'Mechanical',
      year: 'BE',
      division: 'A',
      profilePhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=faces',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 's8',
      fullName: 'Emma Watson',
      rollNumber: 'CS-2022-01',
      email: 'emma.watson@student.edu',
      department: 'Computer Science',
      year: 'BE',
      division: 'A',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const subjects: Subject[] = [
    {
      id: 'sub1',
      name: 'Advanced Database Systems',
      code: 'CS-401',
      department: 'Computer Science',
      semester: 'Semester 7',
      teacherId: 't1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sub2',
      name: 'Theory of Computation',
      code: 'CS-302',
      department: 'Computer Science',
      semester: 'Semester 5',
      teacherId: 't3',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sub3',
      name: 'Digital Signal Processing',
      code: 'EC-301',
      department: 'Electronics',
      semester: 'Semester 5',
      teacherId: 't2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sub4',
      name: 'Microprocessors & Controllers',
      code: 'EC-203',
      department: 'Electronics',
      semester: 'Semester 3',
      teacherId: 't2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sub5',
      name: 'Thermodynamics & Fluid Flow',
      code: 'ME-402',
      department: 'Mechanical',
      semester: 'Semester 7',
      teacherId: 't4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Helper date generators for past relative dates
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const twoDaysAgoStr = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const attendance: Attendance[] = [
    // Two Days ago records
    {
      id: 'a1',
      studentId: 's1',
      studentName: 'Aiden Mitchell',
      rollNumber: 'CS-2023-04',
      subjectId: 'sub1',
      subjectName: 'Advanced Database Systems',
      date: twoDaysAgoStr,
      time: '09:05:12',
      status: 'Present',
      teacherId: 't1',
      teacherName: 'Dr. Aris Thorne',
      createdAt: new Date(twoDaysAgoStr + 'T09:05:12Z').toISOString()
    },
    {
      id: 'a2',
      studentId: 's2',
      studentName: 'Sophia Patel',
      rollNumber: 'CS-2023-18',
      subjectId: 'sub1',
      subjectName: 'Advanced Database Systems',
      date: twoDaysAgoStr,
      time: '09:12:44',
      status: 'Late',
      teacherId: 't1',
      teacherName: 'Dr. Aris Thorne',
      createdAt: new Date(twoDaysAgoStr + 'T09:12:44Z').toISOString()
    },
    {
      id: 'a3',
      studentId: 's3',
      studentName: 'Marcus Vance',
      rollNumber: 'CS-2023-32',
      subjectId: 'sub1',
      subjectName: 'Advanced Database Systems',
      date: twoDaysAgoStr,
      time: '00:00:00',
      status: 'Absent',
      teacherId: 't1',
      teacherName: 'Dr. Aris Thorne',
      createdAt: new Date(twoDaysAgoStr + 'T10:00:00Z').toISOString()
    },
    // Yesterday records
    {
      id: 'a4',
      studentId: 's4',
      studentName: 'Lily Evans',
      rollNumber: 'EC-2023-08',
      subjectId: 'sub3',
      subjectName: 'Digital Signal Processing',
      date: yesterdayStr,
      time: '11:02:15',
      status: 'Present',
      teacherId: 't2',
      teacherName: 'Prof. Clara Vance',
      createdAt: new Date(yesterdayStr + 'T11:02:15Z').toISOString()
    },
    {
      id: 'a5',
      studentId: 's6',
      studentName: 'Chloe Zhang',
      rollNumber: 'EC-2023-22',
      subjectId: 'sub3',
      subjectName: 'Digital Signal Processing',
      date: yesterdayStr,
      time: '11:04:30',
      status: 'Present',
      teacherId: 't2',
      teacherName: 'Prof. Clara Vance',
      createdAt: new Date(yesterdayStr + 'T11:04:30Z').toISOString()
    },
    // Today's early attendance records
    {
      id: 'a6',
      studentId: 's1',
      studentName: 'Aiden Mitchell',
      rollNumber: 'CS-2023-04',
      subjectId: 'sub2',
      subjectName: 'Theory of Computation',
      date: todayStr,
      time: '10:01:45',
      status: 'Present',
      teacherId: 't3',
      teacherName: 'Dr. Evelyn Foster',
      createdAt: new Date(todayStr + 'T10:01:45Z').toISOString()
    },
    {
      id: 'a7',
      studentId: 's2',
      studentName: 'Sophia Patel',
      rollNumber: 'CS-2023-18',
      subjectId: 'sub2',
      subjectName: 'Theory of Computation',
      date: todayStr,
      time: '10:03:10',
      status: 'Present',
      teacherId: 't3',
      teacherName: 'Dr. Evelyn Foster',
      createdAt: new Date(todayStr + 'T10:03:10Z').toISOString()
    },
    {
      id: 'a8',
      studentId: 's5',
      studentName: 'Xavier Jordan',
      rollNumber: 'CS-2024-11',
      subjectId: 'sub2',
      subjectName: 'Theory of Computation',
      date: todayStr,
      time: '10:14:02',
      status: 'Late',
      teacherId: 't3',
      teacherName: 'Dr. Evelyn Foster',
      createdAt: new Date(todayStr + 'T10:14:02Z').toISOString()
    }
  ];

  const now = new Date();
  const pastSessionTime = new Date(now.getTime() - 3600 * 1000).toISOString();
  const futureSessionTime = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  const seededStudents = students.map((s, idx) => {
    // Generate a deterministically distinct biometric vector for each default student
    const descriptorVal = 0.1 + (idx * 0.05);
    return {
      ...s,
      faceDescriptor: Array(128).fill(descriptorVal)
    };
  });

  const qrSessions: QRSession[] = [
    {
      id: 'q1',
      subjectId: 'sub1',
      subjectName: 'Advanced Database Systems',
      teacherId: 't1',
      teacherName: 'Dr. Aris Thorne',
      generatedTime: new Date(now.getTime() - 7200 * 1000).toISOString(),
      expiryTime: new Date(now.getTime() - 7200 * 1000 + 10 * 60 * 1000).toISOString(),
      status: 'Expired',
      sessionCode: 'SESSION_VAL_94812_EXPIRED',
      qrToken: 'EXPIRED_TOKEN_94812',
      lastRegeneratedAt: new Date(now.getTime() - 7200 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 7200 * 1000).toISOString()
    },
    {
      id: 'q2',
      subjectId: 'sub2',
      subjectName: 'Theory of Computation',
      teacherId: 't3',
      teacherName: 'Dr. Evelyn Foster',
      generatedTime: new Date(now.getTime() - 1000 * 60 * 5).toISOString(), // 5 mins ago
      expiryTime: futureSessionTime, // 10 mins from now
      status: 'Active',
      sessionCode: 'SESSION_VAL_23910_ACTIVE',
      qrToken: 'ACTIVE_TOKEN_23910',
      lastRegeneratedAt: new Date(now.getTime() - 100 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 1000 * 60 * 5).toISOString()
    }
  ];

  const admins: Admin[] = [
    {
      id: 'admin-1',
      fullName: 'Administrator Principal',
      email: 'admin@college.edu',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const adminCredentials: Record<string, string> = {
    'admin@college.edu': hashedDefaultPassword
  };

  const teacherCredentials: Record<string, string> = {
    'aris.thorne@college.edu': hashedDefaultPassword,
    'clara.vance@college.edu': hashedDefaultPassword,
    'evelyn.foster@college.edu': hashedDefaultPassword,
    'julian.cruz@college.edu': hashedDefaultPassword
  };

  const studentCredentials: Record<string, string> = {};
  seededStudents.forEach(st => {
    studentCredentials[st.rollNumber.toLowerCase()] = hashedDefaultPassword;
  });

  const notifications: Notification[] = [
    {
      id: 'n1',
      userId: 's1', // Aiden Mitchell
      title: 'Welcome to ERP Check-In',
      message: 'Your biometric profiles are successfully configured.',
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    }
  ];

  return {
    admins,
    adminCredentials,
    teacherCredentials,
    studentCredentials,
    students: seededStudents,
    teachers,
    subjects,
    attendance,
    qrSessions,
    notifications,
    systemSettings: {
      collegeName: 'Apex Institute of Technology',
      academicYear: '2026-2027',
      refreshIntervalSeconds: 30,
      allowLateAttendance: true
    }
  };
};

export class JSONDB {
  private static instance: JSONDB;
  private data!: Schema;

  private constructor() {
    this.readFromDisk();
  }

  public static getInstance(): JSONDB {
    if (!JSONDB.instance) {
      JSONDB.instance = new JSONDB();
    }
    return JSONDB.instance;
  }

  private readFromDisk() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Ensure any new collections are present
        if (!this.data.admins) this.data.admins = [];
        if (!this.data.students) this.data.students = [];
        if (!this.data.teachers) this.data.teachers = [];
        if (!this.data.subjects) this.data.subjects = [];
        if (!this.data.attendance) this.data.attendance = [];
        if (!this.data.qrSessions) this.data.qrSessions = [];
        if (!this.data.notifications) this.data.notifications = [];
        if (!this.data.teacherCredentials) {
          this.data.teacherCredentials = {};
          const salt = bcrypt.genSaltSync(10);
          const hashedDefaultPassword = bcrypt.hashSync('password123', salt);
          this.data.teachers.forEach(t => {
            this.data.teacherCredentials[t.email.toLowerCase()] = hashedDefaultPassword;
          });
        }
        if (!this.data.studentCredentials) {
          this.data.studentCredentials = {};
          const salt = bcrypt.genSaltSync(10);
          const hashedDefaultPassword = bcrypt.hashSync('password123', salt);
          this.data.students.forEach(s => {
            this.data.studentCredentials[s.rollNumber.toLowerCase()] = hashedDefaultPassword;
          });
        }
        if (!this.data.systemSettings) {
          this.data.systemSettings = {
            collegeName: 'Apex Institute of Technology',
            academicYear: '2026-2027',
            refreshIntervalSeconds: 30,
            allowLateAttendance: true
          };
        }
      } else {
        this.data = createInitialState();
        this.writeToDisk();
      }
    } catch (e) {
      console.error("DB Initialization error, using in-memory state:", e);
      this.data = createInitialState();
    }
  }

  private writeToDisk() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Failed to write database to disk:", e);
    }
  }

  // Admin auth functions
  public getAdminByEmail(email: string): Admin | undefined {
    return this.data.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
  }

  public getAdminCredentials(email: string): string | undefined {
    return this.data.adminCredentials[email.toLowerCase()];
  }

  // Teacher auth functions
  public getTeacherByEmail(email: string): Teacher | undefined {
    return this.data.teachers.find(t => t.email.toLowerCase() === email.toLowerCase());
  }

  public getTeacherCredentials(email: string): string | undefined {
    return this.data.teacherCredentials ? this.data.teacherCredentials[email.toLowerCase()] : undefined;
  }

  public updateTeacherPassword(email: string, passwordPlain: string): void {
    if (!this.data.teacherCredentials) this.data.teacherCredentials = {};
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(passwordPlain, salt);
    this.data.teacherCredentials[email.toLowerCase()] = passwordHash;
    this.writeToDisk();
  }

  public createAdmin(fullName: string, email: string, passwordPlain: string): Admin {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(passwordPlain, salt);
    
    const newAdmin: Admin = {
      id: 'admin-' + Math.random().toString(36).substr(2, 9),
      fullName,
      email: email.toLowerCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.admins.push(newAdmin);
    this.data.adminCredentials[email.toLowerCase()] = passwordHash;
    this.writeToDisk();
    return newAdmin;
  }

  public updateAdminProfile(id: string, fullName: string, email: string): Admin {
    const admin = this.data.admins.find(a => a.id === id);
    if (!admin) throw new Error('Admin user not found');

    const oldEmail = admin.email.toLowerCase();
    const newEmail = email.toLowerCase();

    if (oldEmail !== newEmail) {
      // Move credentials
      const creds = this.data.adminCredentials[oldEmail];
      if (creds) {
        this.data.adminCredentials[newEmail] = creds;
        delete this.data.adminCredentials[oldEmail];
      }
    }

    admin.fullName = fullName;
    admin.email = newEmail;
    admin.updatedAt = new Date().toISOString();

    this.writeToDisk();
    return admin;
  }

  public updateAdminPassword(email: string, passwordPlain: string): void {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(passwordPlain, salt);
    this.data.adminCredentials[email.toLowerCase()] = passwordHash;
    this.writeToDisk();
  }

  // Student CRUD
  public getStudents(): Student[] {
    return this.data.students;
  }

  public getStudentByRollNumber(rollNumber: string): Student | undefined {
    return this.data.students.find(s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase());
  }

  public getStudentCredentials(rollNumber: string): string | undefined {
    return this.data.studentCredentials ? this.data.studentCredentials[rollNumber.toLowerCase()] : undefined;
  }

  public updateStudentPassword(rollNumber: string, passwordPlain: string): void {
    if (!this.data.studentCredentials) this.data.studentCredentials = {};
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(passwordPlain, salt);
    this.data.studentCredentials[rollNumber.toLowerCase()] = passwordHash;
    this.writeToDisk();
  }

  public createStudent(student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Student {
    const newStudent: Student = {
      ...student,
      id: 'student_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.students.push(newStudent);
    if (!this.data.studentCredentials) this.data.studentCredentials = {};
    const salt = bcrypt.genSaltSync(10);
    const hashedPw = bcrypt.hashSync('password123', salt);
    this.data.studentCredentials[newStudent.rollNumber.toLowerCase()] = hashedPw;
    this.writeToDisk();
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>>): Student {
    const index = this.data.students.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Student not found');
    
    const oldRoll = this.data.students[index].rollNumber.toLowerCase();
    const newRoll = updates.rollNumber ? updates.rollNumber.toLowerCase() : oldRoll;

    if (oldRoll !== newRoll && this.data.studentCredentials) {
      const creds = this.data.studentCredentials[oldRoll];
      if (creds) {
        this.data.studentCredentials[newRoll] = creds;
        delete this.data.studentCredentials[oldRoll];
      }
    }

    this.data.students[index] = {
      ...this.data.students[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.writeToDisk();
    return this.data.students[index];
  }

  public deleteStudent(id: string): void {
    const student = this.data.students.find(s => s.id === id);
    if (student && this.data.studentCredentials) {
      delete this.data.studentCredentials[student.rollNumber.toLowerCase()];
    }
    this.data.students = this.data.students.filter(s => s.id !== id);
    // Delete orphan attendance
    this.data.attendance = this.data.attendance.filter(a => a.studentId !== id);
    this.writeToDisk();
  }

  // Teacher CRUD
  public getTeachers(): Teacher[] {
    return this.data.teachers;
  }

  public createTeacher(teacher: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>): Teacher {
    const newTeacher: Teacher = {
      ...teacher,
      id: 'teacher_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.teachers.push(newTeacher);
    this.writeToDisk();
    return newTeacher;
  }

  public updateTeacher(id: string, updates: Partial<Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>>): Teacher {
    const index = this.data.teachers.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Teacher not found');

    this.data.teachers[index] = {
      ...this.data.teachers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.writeToDisk();
    return this.data.teachers[index];
  }

  public deleteTeacher(id: string): void {
    this.data.teachers = this.data.teachers.filter(t => t.id !== id);
    // Null out teacher id in subject
    this.data.subjects = this.data.subjects.map(s => {
      if (s.teacherId === id) {
        return { ...s, teacherId: '' };
      }
      return s;
    });
    this.writeToDisk();
  }

  // Subject CRUD
  public getSubjects(): Subject[] {
    return this.data.subjects;
  }

  public createSubject(subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Subject {
    const newSubject: Subject = {
      ...subject,
      id: 'subject_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.subjects.push(newSubject);
    this.writeToDisk();
    return newSubject;
  }

  public updateSubject(id: string, updates: Partial<Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>>): Subject {
    const index = this.data.subjects.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Subject not found');

    this.data.subjects[index] = {
      ...this.data.subjects[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.writeToDisk();
    return this.data.subjects[index];
  }

  public deleteSubject(id: string): void {
    this.data.subjects = this.data.subjects.filter(s => s.id !== id);
    this.data.attendance = this.data.attendance.filter(a => a.subjectId !== id);
    this.data.qrSessions = this.data.qrSessions.filter(s => s.subjectId !== id);
    this.writeToDisk();
  }

  // Attendance Operations
  public getAttendance(): Attendance[] {
    return this.data.attendance;
  }

  public addAttendance(record: Omit<Attendance, 'id' | 'createdAt'>): Attendance {
    const newRecord: Attendance = {
      ...record,
      id: 'attendance_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.data.attendance.push(newRecord);
    this.writeToDisk();
    return newRecord;
  }

  // QR Session Operations
  public getQRSessions(): QRSession[] {
    // Check and update expired status and rotate token automatically
    const now = new Date();
    let updated = false;
    this.data.qrSessions = this.data.qrSessions.map(s => {
      // 1. Check expiration
      if (s.status === 'Active' && new Date(s.expiryTime) < now) {
        updated = true;
        return { ...s, status: 'Expired' };
      }
      
      // 2. Dynamic token rotation after 30 seconds
      if (s.status === 'Active') {
        const lastRegen = s.lastRegeneratedAt ? new Date(s.lastRegeneratedAt).getTime() : 0;
        const diffMs = now.getTime() - lastRegen;
        if (diffMs > 30 * 1000) {
          updated = true;
          const newToken = 'TOKEN_' + Math.random().toString(36).substring(2, 9).toUpperCase() + '_' + Math.floor(now.getTime() / 1000);
          return {
            ...s,
            qrToken: newToken,
            lastRegeneratedAt: now.toISOString()
          };
        }
      }
      
      return s;
    });
    if (updated) this.writeToDisk();
    return this.data.qrSessions;
  }

  public createQRSession(session: Omit<QRSession, 'id' | 'createdAt' | 'qrToken' | 'lastRegeneratedAt'>): QRSession {
    const nowIso = new Date().toISOString();
    const initToken = 'TOKEN_' + Math.random().toString(36).substring(2, 9).toUpperCase() + '_' + Math.floor(Date.now() / 1000);
    const newSession: QRSession = {
      ...session,
      id: 'session_' + Math.random().toString(36).substr(2, 9),
      qrToken: initToken,
      lastRegeneratedAt: nowIso,
      createdAt: nowIso
    };
    this.data.qrSessions.push(newSession);
    this.writeToDisk();
    return newSession;
  }

  public expireQRSession(id: string): QRSession {
    const session = this.data.qrSessions.find(s => s.id === id);
    if (!session) throw new Error('Session not found');

    session.status = 'Expired';
    session.expiryTime = new Date().toISOString();
    this.writeToDisk();
    return session;
  }

  // Notification Operations
  public getNotifications(userId: string): Notification[] {
    // Return all notifications matching the target userId or broadcast alerts
    return this.data.notifications
      .filter(n => n.userId === userId || n.userId === 'all')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(n: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Notification {
    const newNotification: Notification = {
      ...n,
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.push(newNotification);
    this.writeToDisk();
    return newNotification;
  }

  public markNotificationAsRead(id: string): Notification {
    const notif = this.data.notifications.find(n => n.id === id);
    if (!notif) throw new Error('Notification not found');
    notif.isRead = true;
    this.writeToDisk();
    return notif;
  }

  // General Dashboard Statistics
  public getDashboardStats(): DashboardStats {
    const todayStr = new Date().toISOString().split('T')[0];
    const qrSessions = this.getQRSessions(); // Updates expiry dynamically
    
    return {
      totalStudents: this.data.students.length,
      totalTeachers: this.data.teachers.length,
      totalSubjects: this.data.subjects.length,
      totalSessions: qrSessions.length,
      todayAttendanceCount: this.data.attendance.filter(a => a.date === todayStr).length
    };
  }

  // System Settings Module
  public getSystemSettings() {
    return this.data.systemSettings;
  }

  public updateSystemSettings(updates: Partial<Schema['systemSettings']>) {
    this.data.systemSettings = {
      ...this.data.systemSettings,
      ...updates
    };
    this.writeToDisk();
    return this.data.systemSettings;
  }
}
