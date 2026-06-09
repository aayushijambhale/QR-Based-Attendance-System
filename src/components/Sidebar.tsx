import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CalendarCheck, 
  QrCode, 
  FilePieChart, 
  Settings, 
  LogOut,
  X,
  Menu,
  School
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { admin, logout } = useAuth();

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', name: 'Students', icon: Users },
    { id: 'teachers', name: 'Teachers', icon: GraduationCap },
    { id: 'subjects', name: 'Subjects', icon: BookOpen },
    { id: 'attendance', name: 'Attendance Logs', icon: CalendarCheck },
    { id: 'qr-sessions', name: 'QR Sessions', icon: QrCode },
    { id: 'reports', name: 'Report Exports', icon: FilePieChart },
    { id: 'settings', name: 'System Settings', icon: Settings }
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false); // Close drawer on mobile
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          id="sidebar-mobile-overlay"
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-fade"
        />
      )}

      {/* Main Sidebar Element */}
      <aside 
        id="sidebar-container"
        className={`fixed top-0 bottom-0 left-0 bg-slate-950 text-slate-300 w-64 border-r border-slate-800 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-20 border-b border-slate-800 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <School className="text-white h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-white text-md tracking-tight font-sans">Apex Attend</span>
                <span className="text-[10px] text-emerald-400 block font-mono font-medium uppercase tracking-wider">ERP System</span>
              </div>
            </div>
            {/* Close Toggle for Mobile Box */}
            <button 
              onClick={() => setIsOpen(false)}
              id="sidebar-close-btn"
              className="lg:hidden text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav Directory */}
          <nav className="p-4 space-y-1" id="sidebar-nav">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  id={`sidebar-link-${item.id}`}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                    isActive 
                      ? 'bg-indigo-600/95 text-white shadow-lg shadow-indigo-600/15'
                      : 'hover:bg-slate-900 hover:text-white text-slate-400'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  }`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile details & Logout footer */}
        <div className="p-4 border-t border-slate-800" id="sidebar-footer">
          {admin && (
            <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-slate-900/50 rounded-2xl border border-slate-800/60">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-sm font-bold text-indigo-400">
                {admin.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{admin.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{admin.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            id="sidebar-logout-btn"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer group"
          >
            <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-1 duration-200" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
