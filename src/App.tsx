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
import { 
  Menu, 
  RefreshCw, 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CalendarCheck, 
  QrCode, 
  FilePieChart, 
  Settings as SettingsIcon, 
  User, 
  Clock, 
  Home 
} from 'lucide-react';

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

  const mobileTabs = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', name: 'Students', icon: Users },
    { id: 'teachers', name: 'Teachers', icon: GraduationCap },
    { id: 'qr-sessions', name: 'QR Gates', icon: QrCode },
    { id: 'settings', name: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1D1D1F] flex font-sans" id="erp-layout-root">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={mobileSidebarOpen} 
        setIsOpen={setMobileSidebarOpen} 
      />

      {/* Main Panel Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen pb-16 lg:pb-0">
        {/* Global ERP Top Header Bar */}
        <header className="h-16 bg-white border-b border-[#D2D2D7] flex items-center justify-between px-6 lg:px-8 select-none shrink-0" id="erp-global-header">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              id="mobile-menu-trigger-btn"
              className="lg:hidden p-1.5 hover:bg-[#F8F9FA] rounded-lg border border-[#D2D2D7] text-[#6E6E73] transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-[#0071E3] leading-none">Apex Control Console</span>
              <span className="text-[9px] text-[#6E6E73] font-mono mt-1 font-semibold block uppercase tracking-wider">Management Active</span>
            </div>
          </div>

          {/* Admin Identity segment */}
          {admin && (
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-[#1D1D1F] block">{admin.fullName}</span>
                  <span className="text-[9px] text-[#6E6E73] font-mono block">System Admin</span>
                </div>
                <div className="h-8 w-8 bg-[#E8F2FF] border border-[#0071E3]/20 rounded-full flex items-center justify-center text-xs font-bold text-[#0071E3]">
                  {admin.fullName.slice(0, 2).toUpperCase()}
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

      {/* iOS-Style Bottom Tab Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#D2D2D7] flex items-center justify-around px-2 z-40 select-none pb-safe">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? 'text-[#0071E3]' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">{tab.name}</span>
            </button>
          );
        })}
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

  const mobileTabs = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'subjects', name: 'Subjects', icon: BookOpen },
    { id: 'qr-generator', name: 'QR Session', icon: QrCode },
    { id: 'attendance', name: 'Roster', icon: CalendarCheck },
    { id: 'profile', name: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1D1D1F] flex font-sans" id="teacher-layout-root">
      {/* Teacher Sidebar Navigation */}
      <TeacherSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={mobileSidebarOpen} 
        setIsOpen={setMobileSidebarOpen} 
      />

      {/* Main Panel Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen pb-16 lg:pb-0">
        {/* Global Faculty Top Header Bar */}
        <header className="h-16 bg-white border-b border-[#D2D2D7] flex items-center justify-between px-6 lg:px-8 select-none shrink-0" id="teacher-global-header">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              id="mobile-teacher-menu-trigger"
              className="lg:hidden p-1.5 hover:bg-[#F8F9FA] rounded-lg border border-[#D2D2D7] text-[#6E6E73] transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-[#0071E3] leading-none">Apex Faculty Terminal</span>
              <span className="text-[9px] text-[#6E6E73] font-mono mt-1 font-semibold block uppercase tracking-wider">Lecture Privileges Active</span>
            </div>
          </div>

          {/* Teacher Identity segment */}
          {teacher && (
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-[#1D1D1F] block">{teacher.fullName}</span>
                  <span className="text-[9px] text-[#6E6E73] font-mono block">Dept Lecturer</span>
                </div>
                <img 
                  src={teacher.profilePhoto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100"} 
                  alt="Teacher Av" 
                  className="h-8 w-8 bg-[#F8F9FA] border border-[#D2D2D7] rounded-full object-cover shrink-0"
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

      {/* iOS-Style Bottom Tab Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#D2D2D7] flex items-center justify-around px-2 z-40 select-none pb-safe">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? 'text-[#0071E3]' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">{tab.name}</span>
            </button>
          );
        })}
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

  const mobileTabs = [
    { id: 'dashboard', name: 'Home', icon: Home },
    { id: 'subjects', name: 'Subjects', icon: BookOpen },
    { id: 'qr-scanner', name: 'Scan QR', icon: QrCode },
    { id: 'attendance', name: 'Records', icon: Clock },
    { id: 'profile', name: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1D1D1F] font-sans" id="student-layout-root">
      {/* Student Sidebar Navigation */}
      <StudentSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={mobileSidebarOpen} 
        setIsOpen={setMobileSidebarOpen} 
      />

      {/* Main Panel Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen bg-[#F8F9FA] pb-16 lg:pb-0">
        {/* Global Scholar Top Header Bar */}
        <header className="h-16 bg-white border-b border-[#D2D2D7] flex items-center justify-between px-6 lg:px-8 select-none shrink-0" id="student-global-header">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              id="mobile-student-menu-trigger"
              className="lg:hidden p-1.5 hover:bg-[#F8F9FA] rounded-lg border border-[#D2D2D7] text-[#6E6E73] transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#0071E3] leading-none block">Apex Scholar Terminal</span>
              <span className="text-[9px] text-[#6E6E73] font-mono mt-1 font-semibold block uppercase tracking-wider">Student Console Active</span>
            </div>
          </div>

          {/* Student Identity segment */}
          {student && (
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-[#1D1D1F] block">{student.fullName}</span>
                  <span className="text-[9px] text-[#6E6E73] font-mono block">Roll: {student.rollNumber}</span>
                </div>
                <img 
                  src={student.profilePhoto || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100"} 
                  alt="Student Av" 
                  className="h-8 w-8 bg-[#F8F9FA] border border-[#D2D2D7] rounded-full object-cover shrink-0"
                />
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-[#F8F9FA]">
          {renderView()}
        </main>
      </div>

      {/* iOS-Style Bottom Tab Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#D2D2D7] flex items-center justify-around px-2 z-40 select-none pb-safe">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isScanButton = tab.id === 'qr-scanner';
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isScanButton 
                  ? isActive 
                    ? 'text-[#0071E3] scale-105' 
                    : 'text-[#0071E3]/80 hover:text-[#0071E3] scale-105' 
                  : isActive 
                    ? 'text-[#0071E3]' 
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              {isScanButton ? (
                <div className={`p-2 rounded-full ${isActive ? 'bg-[#0071E3]/10' : 'bg-transparent'}`}>
                  <Icon className="h-6 w-6" />
                </div>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className="text-[10px] mt-1 font-medium">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { token, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center animate-pulse">
          <GraduationCap className="h-10 w-10 text-[#0071E3] animate-bounce mx-auto mb-4" />
          <p className="text-xs text-[#6E6E73] font-semibold tracking-wider font-mono">Restoring Apex Session...</p>
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
