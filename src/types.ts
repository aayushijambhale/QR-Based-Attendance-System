/**
 * Shared Type Definitions for the QR-Based Attendance System
 */

export interface Student {
  id: string;
  fullName: string;
  rollNumber: string;
  email: string;
  department: string;
  year: string; // e.g. "FE", "SE", "TE", "BE" or "1st Year", etc.
  division: string; // e.g. "A", "B", "C"
  profilePhoto: string; // URL or base64
  faceDescriptor?: number[]; // 128-dimensional biometric float array
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  employeeId: string;
  email: string;
  department: string;
  phoneNumber: string;
  profilePhoto: string; // URL or base64
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  semester: string; // e.g. "Semester 1", etc.
  teacherId: string; // References Teacher.id
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
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
  latitude?: number; // Geo GPS latitude
  longitude?: number; // Geo GPS longitude
  attendanceTime?: string; // Verification timestamp
  selfieImage?: string; // Face snapshot verified
  createdAt: string;
}

export interface QRSession {
  id: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  generatedTime: string; // ISO string
  expiryTime: string; // ISO string
  status: 'Active' | 'Expired';
  sessionCode: string; // Unique URL or code base
  qrToken: string; // Rotating 30s secure token
  lastRegeneratedAt: string; // Timestamp of token rotation
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string; // Recipient user ID (or 'all' / 'admin' / 'teacher' / 'student')
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  isRead: boolean;
  createdAt: string;
}

export interface Admin {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalSessions: number;
  todayAttendanceCount: number;
}
