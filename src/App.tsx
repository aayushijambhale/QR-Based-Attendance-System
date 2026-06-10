import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Login } from './components/Login.js';
import { Sidebar } from './components/Sidebar.js';
import { NotificationBell } from './components/NotificationBell.js';
import { Dashboard } from './components/Dashboard.js';
import { Students } from './components/Students.js';
import { Teachers } from './components/Teachers.js';
import { Subjects } from './components/Subjects.js';
import { AttendanceLogs } from './components/Attendance.js';
import { QRSessions } from './components/QRSessions.js';
import { Reports } from './components/Reports.js';
import { Settings } from './components/Settings.js';
import { Menu, RefreshCw, GraduationCap } from 'lucide-react';

// Teacher Module component imports
import { TeacherSidebar } from './components/teacher/TeacherSidebar.js';
import { TeacherDashboard } from './components/teacher/TeacherDashboard.js';
import { TeacherSubjects } from './components/teacher/TeacherSubjects.js';
import { TeacherQR } from './components/teacher/TeacherQR.js';
import { TeacherAttendance } from './components/teacher/TeacherAttendance.js';
import { TeacherReports } from './components/teacher/TeacherReports.js';
import { TeacherProfile } from './components/teacher/TeacherProfile.js';

// Student Module component imports
import { StudentSidebar } from './components/student/StudentSidebar.js';
import { StudentDashboard } from './components/student/StudentDashboard.js';
import { StudentSubjects } from './components/student/StudentSubjects.js';
import { StudentQRScanner } from './components/student/StudentQRScanner.js';
import { StudentAttendance } from './components/student/StudentAttendance.js';
import { StudentReports } from './components/student/StudentReports.js';
import { StudentProfile } from './components/student/StudentProfile.js';

const AdminLayout: React.FC = () => {
  const { admin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Render correct catalog sheet view
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'students':
        return <Students />;
      case 'teachers':
        return <Teachers />;
      case 'subjects':
        return <Subjects />;
      case 'attendance':
        return <AttendanceLogs />;
      case 'qr-sessions':
        return <QRSessions />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#134E4A] flex" id="erp-layout-root">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={mobileSidebarOpen} 
        setIsOpen={setMobileSidebarOpen} 
      />

      {/* Main Panel Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Global ERP Top Header Bar */}
        <header className="h-20 bg-white border-b border-[#F1F5F9] flex items-center justify-between px-6 lg:px-8 select-none shrink-0" id="erp-global-header">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              id="mobile-menu-trigger-btn"
              className="lg:hidden p-1.5 hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-600 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-[#0F766E] leading-none">Apex ERP Attendance Console</span>
              <span className="text-[10px] text-[#64748B] font-medium font-mono mt-1 font-semibold block uppercase">MANAGEMENT PRIVILEGES ACTIVE</span>
            </div>
          </div>

          {/* Admin Identity segment */}
          {admin && (
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-[#134E4A] block">Logged: {admin.fullName}</span>
                  <span className="text-[10px] text-[#64748B] font-medium font-mono block">System Admin</span>
                </div>
                <div className="h-9 w-9 bg-[#EAF5F5] border border-[#14B8A6]/50 rounded-md flex items-center justify-center text-xs font-bold text-[#0F766E]">
                  AD
                </div>
              </div>
            </div>
          )}
        </header>

        {/* View content frame */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

const TeacherLayout: React.FC = () => {
  const { teacher } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Render correct view based on active tab
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TeacherDashboard setActiveTab={setActiveTab} />;
      case 'subjects':
        return <TeacherSubjects />;
      case 'qr-generator':
        return <TeacherQR />;
      case 'attendance':
        return <TeacherAttendance />;
      case 'reports':
        return <TeacherReports />;
      case 'profile':
        return <TeacherProfile />;
      default:
        return <TeacherDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#134E4A] flex" id="teacher-layout-root">
      {/* Teacher Sidebar Navigation */}
      <TeacherSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={mobileSidebarOpen} 
        setIsOpen={setMobileSidebarOpen} 
      />

      {/* Main Panel Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Global Faculty Top Header Bar */}
        <header className="h-20 bg-white border-b border-[#F1F5F9] flex items-center justify-between px-6 lg:px-8 select-none shrink-0" id="teacher-global-header">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              id="mobile-teacher-menu-trigger"
              className="lg:hidden p-1.5 hover:bg-slate-50 rounded-xl border border-slate-205 text-slate-600 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-[#0F766E] leading-none">Apex ERP Faculty Terminal</span>
              <span className="text-[10px] text-[#64748B] font-medium font-mono mt-1 font-semibold block uppercase">LECTURE PRIVILEGES ACTIVE</span>
            </div>
          </div>

          {/* Teacher Identity segment */}
          {teacher && (
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-[#134E4A] block">{teacher.fullName}</span>
                  <span className="text-[10px] text-[#64748B] font-medium font-mono block">Dept Lecturer</span>
                </div>
                <img 
                  src={teacher.profilePhoto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100"} 
                  alt="Teacher Av" 
                  className="h-9 w-9 bg-[#FFFBF5] border border-[#E2E8F0] rounded-md object-cover shrink-0"
                />
              </div>
            </div>
          )}
        </header>

        {/* View content frame */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

const StudentLayout: React.FC = () => {
  const { student } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Render correct view based on active tab
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StudentDashboard setActiveTab={setActiveTab} />;
      case 'subjects':
        return <StudentSubjects />;
      case 'qr-scanner':
        return <StudentQRScanner />;
      case 'attendance':
        return <StudentAttendance />;
      case 'reports':
        return <StudentReports />;
      case 'profile':
        return <StudentProfile />;
      default:
        return <StudentDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex text-[#134E4A] font-sans" id="student-layout-root">
      {/* Student Sidebar Navigation */}
      <StudentSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={mobileSidebarOpen} 
        setIsOpen={setMobileSidebarOpen} 
      />

      {/* Main Panel Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen bg-[#FFFBF5]">
        {/* Global Scholar Top Header Bar */}
        <header className="h-20 bg-white border-b border-[#F1F5F9] flex items-center justify-between px-6 lg:px-8 select-none shrink-0" id="student-global-header">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              id="mobile-student-menu-trigger"
              className="lg:hidden p-1.5 hover:bg-[#EAF5F5] rounded-md border border-[#E2E8F0] text-[#64748B] transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#0F766E] leading-none block">Apex Scholar Terminal</span>
              <span className="text-[10px] text-[#64748B] font-medium font-mono mt-1 font-semibold block uppercase">SCHOLASTIC RIGHTS ONLINE</span>
            </div>
          </div>

          {/* Student Identity segment */}
          {student && (
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-[#134E4A] block">{student.fullName}</span>
                  <span className="text-[10px] text-[#64748B] font-mono block">Roll: {student.rollNumber}</span>
                </div>
                <img 
                  src={student.profilePhoto || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100"} 
                  alt="Student Av" 
                  className="h-9 w-9 bg-[#FFFBF5] border border-[#E2E8F0] rounded-md object-cover shrink-0"
                />
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-[#FFFBF5]">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { token, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#FFFBF5]">
        <div className="text-center animate-pulse">
          <GraduationCap className="h-12 w-12 text-[#0F766E] animate-bounce mx-auto mb-4" />
          <p className="text-sm text-[#64748B] font-medium font-mono">RESTORING APEX SESSION...</p>
        </div>
      </div>
    );
  }

  if (!token) return <Login />;

  if (role === 'teacher') return <TeacherLayout />;
  if (role === 'student') return <StudentLayout />;
  return <AdminLayout />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
