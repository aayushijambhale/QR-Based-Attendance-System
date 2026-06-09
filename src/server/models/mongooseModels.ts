import mongoose, { Schema, Document } from 'mongoose';

// ==========================================
// 1. STUDENT SCHEMA
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
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  division: { type: String, required: true },
  profilePhoto: { type: String, default: '' },
  faceDescriptor: { type: [Number], default: [] }
}, { timestamps: true });

// ==========================================
// 2. TEACHER SCHEMA
// ==========================================
export interface ITeacher extends Document {
  fullName: string;
  employeeId: string;
  email: string;
  department: string;
  phoneNumber: string;
  profilePhoto: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  profilePhoto: { type: String, default: '' }
}, { timestamps: true });

// ==========================================
// 3. SUBJECT SCHEMA
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
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, index: true },
  department: { type: String, required: true },
  semester: { type: String, required: true },
  teacherId: { type: String, default: '' }
}, { timestamps: true });

// ==========================================
// 4. ATTENDANCE SCHEMA
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
}

const AttendanceSchema: Schema = new Schema({
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
// 5. ATTENDANCE SESSION SCHEMA (QR)
// ==========================================
export interface IAttendanceSession extends Document {
  subjectId: string;
  teacherId: string;
  qrToken: string;
  generatedAt: Date;
  expiresAt: Date;
  status: 'Active' | 'Expired';
}

const AttendanceSessionSchema: Schema = new Schema({
  subjectId: { type: String, required: true, index: true },
  teacherId: { type: String, required: true },
  qrToken: { type: String, required: true, unique: true },
  generatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Expired'], default: 'Active' }
}, { timestamps: true });

// ==========================================
// 6. NOTIFICATION SCHEMA
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
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'alert'], required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

// Export Models
export const MongoStudent = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
export const MongoTeacher = mongoose.models.Teacher || mongoose.model<ITeacher>('Teacher', TeacherSchema);
export const MongoSubject = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
export const MongoAttendance = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export const MongoAttendanceSession = mongoose.models.AttendanceSession || mongoose.model<IAttendanceSession>('AttendanceSession', AttendanceSessionSchema);
export const MongoNotification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
