import React, { createContext, useContext, useState, useEffect } from 'react';
import { Admin, Teacher, Student } from '../types.js';
import { api } from '../utils/api.js';

interface AuthContextType {
  admin: Admin | null;
  teacher: Teacher | null;
  student: Student | null;
  role: 'admin' | 'teacher' | 'student' | null;
  token: string | null;
  loading: boolean;
  login: (emailOrRoll: string, password: string, rememberMe: boolean, loginAs: 'admin' | 'teacher' | 'student') => Promise<void>;
  logout: () => void;
  updateProfile: (fullName: string, email: string, currentPassword?: string, newPassword?: string) => Promise<void>;
  updateTeacherProfile: (fullName: string, email: string, phoneNumber: string, currentPassword?: string, newPassword?: string) => Promise<void>;
  updateStudentProfile: (email: string, profilePhoto: string) => Promise<void>;
  changeStudentPassword: (currentPassword?: string, newPassword?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from local storage on startup
  useEffect(() => {
    const fetchMe = async () => {
      const savedToken = localStorage.getItem('qr_admin_token');
      if (savedToken) {
        try {
          setToken(savedToken);
          const data = await api.get<{ admin?: Admin; teacher?: Teacher; student?: Student; role: 'admin' | 'teacher' | 'student' }>('/api/auth/me');
          setRole(data.role || 'admin');
          if (data.role === 'teacher') {
            setTeacher(data.teacher || null);
          } else if (data.role === 'student') {
            setStudent(data.student || null);
          } else {
            setAdmin(data.admin || null);
          }
        } catch (e) {
          console.error("Session restoration failed:", e);
          // Token is old or stale
          localStorage.removeItem('qr_admin_token');
          setToken(null);
          setAdmin(null);
          setTeacher(null);
          setStudent(null);
          setRole(null);
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, []);

  const login = async (emailOrRoll: string, password: string, rememberMe: boolean, loginAs: 'admin' | 'teacher' | 'student' = 'admin') => {
    if (loginAs === 'teacher') {
      const data = await api.post<{ token: string; teacher: Teacher; role: 'teacher' }>('/api/teacher/login', { email: emailOrRoll, password });
      setToken(data.token);
      setTeacher(data.teacher);
      setStudent(null);
      setAdmin(null);
      setRole('teacher');
      localStorage.setItem('qr_admin_token', data.token);
    } else if (loginAs === 'student') {
      const data = await api.post<{ token: string; student: Student; role: 'student' }>('/api/student/login', { rollNumber: emailOrRoll, password });
      setToken(data.token);
      setStudent(data.student);
      setTeacher(null);
      setAdmin(null);
      setRole('student');
      localStorage.setItem('qr_admin_token', data.token);
    } else {
      const data = await api.post<{ token: string; admin: Admin }>('/api/auth/login', { email: emailOrRoll, password });
      setToken(data.token);
      setAdmin(data.admin);
      setTeacher(null);
      setStudent(null);
      setRole('admin');
      localStorage.setItem('qr_admin_token', data.token);
    }
  };

  const logout = () => {
    localStorage.removeItem('qr_admin_token');
    sessionStorage.removeItem('qr_admin_token');
    setToken(null);
    setAdmin(null);
    setTeacher(null);
    setStudent(null);
    setRole(null);
  };

  const updateProfile = async (fullName: string, email: string, currentPassword?: string, newPassword?: string) => {
    const data = await api.put<{ admin: Admin }>('/api/auth/profile', {
      fullName,
      email,
      currentPassword,
      newPassword,
    });
    setAdmin(data.admin);
  };

  const updateTeacherProfile = async (fullName: string, email: string, phoneNumber: string, currentPassword?: string, newPassword?: string) => {
    const data = await api.put<{ teacher: Teacher }>('/api/teacher/profile', {
      fullName,
      email,
      phoneNumber,
      currentPassword,
      newPassword,
    });
    setTeacher(data.teacher);
  };

  const updateStudentProfile = async (email: string, profilePhoto: string) => {
    const data = await api.put<{ student: Student }>('/api/student/profile', {
      email,
      profilePhoto
    });
    setStudent(data.student);
  };

  const changeStudentPassword = async (currentPassword?: string, newPassword?: string) => {
    await api.put<{ message: string }>('/api/student/change-password', {
      currentPassword,
      newPassword
    });
  };

  return (
    <AuthContext.Provider value={{
      admin,
      teacher,
      student,
      role,
      token,
      loading,
      login,
      logout,
      updateProfile,
      updateTeacherProfile,
      updateStudentProfile,
      changeStudentPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
