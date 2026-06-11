import mongoose, { Schema, Document } from 'mongoose';

// ==========================================
// 1. ADMIN SCHEMA
// ==========================================
export interface IAdmin extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema = new Schema({
  _id: { type: String, default: () => 'admin-' + Math.random().toString(36).substr(2, 9) },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

// ==========================================
// 2. STUDENT SCHEMA
// ==========================================
export interface IStudent extends Document {
  fullName: string;
  rollNumber: string;
  email: string;
  department: string;
  year: string;
  division: string;
  profilePhoto: string;
  faceDescriptor: number[]; // 128-dimensional biometric floats
  passwordHash: string; // Store hashed credentials
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema({
  _id: { type: String, default: () => 'student_' + Math.random().toString(36).substr(2, 9) },
  fullName: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  division: { type: String, required: true },
  profilePhoto: { type: String, default: '' },
  faceDescriptor: { type: [Number], default: [] },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

// ==========================================
// 3. TEACHER SCHEMA
// ==========================================
export interface ITeacher extends Document {
  fullName: string;
  employeeId: string;
  email: string;
  department: string;
  phoneNumber: string;
  profilePhoto: string;
  passwordHash: string; // Store hashed credentials
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema: Schema = new Schema({
  _id: { type: String, default: () => 'teacher_' + Math.random().toString(36).substr(2, 9) },
  fullName: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  profilePhoto: { type: String, default: '' },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

// ==========================================
// 4. SUBJECT SCHEMA
// ==========================================
export interface ISubject extends Document {
  name: string;
  code: string;
  department: string;
  semester: string;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema: Schema = new Schema({
  _id: { type: String, default: () => 'subject_' + Math.random().toString(36).substr(2, 9) },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, index: true },
  department: { type: String, required: true },
  semester: { type: String, required: true },
  teacherId: { type: String, default: '' }
}, { timestamps: true });

// ==========================================
// 5. ATTENDANCE SCHEMA
// ==========================================
export interface IAttendance extends Document {
  studentId: string;
  studentName: string;
  rollNumber: string;
  subjectId: string;
  subjectName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  status: 'Present' | 'Absent' | 'Late';
  teacherId: string;
  teacherName: string;
  latitude: number;
  longitude: number;
  attendanceTime: Date;
  selfieImage: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema({
  _id: { type: String, default: () => 'attendance_' + Math.random().toString(36).substr(2, 9) },
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String, required: true, index: true },
  subjectId: { type: String, required: true, index: true },
  subjectName: { type: String, required: true },
  date: { type: String, required: true, index: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late'], required: true },
  teacherId: { type: String, required: true },
  teacherName: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  attendanceTime: { type: Date, default: Date.now },
  selfieImage: { type: String, default: '' }
}, { timestamps: true });

// ==========================================
// 6. ATTENDANCE SESSION SCHEMA (QR)
// ==========================================
export interface IAttendanceSession extends Document {
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  generatedTime: string;
  expiryTime: string;
  status: 'Active' | 'Expired';
  sessionCode: string;
  qrToken: string;
  lastRegeneratedAt: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSessionSchema: Schema = new Schema({
  _id: { type: String, default: () => 'session_' + Math.random().toString(36).substr(2, 9) },
  subjectId: { type: String, required: true, index: true },
  subjectName: { type: String, default: '' },
  teacherId: { type: String, required: true },
  teacherName: { type: String, default: '' },
  generatedTime: { type: String, required: true },
  expiryTime: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
  sessionCode: { type: String, required: true, unique: true },
  qrToken: { type: String, required: true },
  lastRegeneratedAt: { type: String, required: true },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 }
}, { timestamps: true });

// ==========================================
// 7. NOTIFICATION SCHEMA
// ==========================================
export interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  _id: { type: String, default: () => 'notif_' + Math.random().toString(36).substr(2, 9) },
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'alert'], required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

// ==========================================
// 8. SYSTEM SETTINGS SCHEMA
// ==========================================
export interface ISystemSettings extends Document {
  collegeName: string;
  academicYear: string;
  refreshIntervalSeconds: number;
  allowLateAttendance: boolean;
}

const SystemSettingsSchema: Schema = new Schema({
  _id: { type: String, default: () => 'settings' },
  collegeName: { type: String, default: 'Apex Institute of Technology' },
  academicYear: { type: String, default: '2026-2027' },
  refreshIntervalSeconds: { type: Number, default: 30 },
  allowLateAttendance: { type: Boolean, default: true }
}, { timestamps: true });

// Export Models
export const MongoAdmin: mongoose.Model<IAdmin> = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);
export const MongoStudent: mongoose.Model<IStudent> = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
export const MongoTeacher: mongoose.Model<ITeacher> = mongoose.models.Teacher || mongoose.model<ITeacher>('Teacher', TeacherSchema);
export const MongoSubject: mongoose.Model<ISubject> = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
export const MongoAttendance: mongoose.Model<IAttendance> = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export const MongoAttendanceSession: mongoose.Model<IAttendanceSession> = mongoose.models.AttendanceSession || mongoose.model<IAttendanceSession>('AttendanceSession', AttendanceSessionSchema);
export const MongoNotification: mongoose.Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const MongoSystemSettings: mongoose.Model<ISystemSettings> = mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
