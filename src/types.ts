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
  sessionCode: string; // Code encoded in QR
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
