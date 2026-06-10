import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { motion, AnimatePresence } from 'motion/react';
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
  School,
  Sparkles
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
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            id="sidebar-mobile-overlay"
            className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-md z-40 cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Element */}
      <aside 
        id="sidebar-container"
        className={`fixed top-4 bottom-4 left-4 bg-slate-900 text-slate-300 w-64 rounded-[28px] border border-white/10 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl shadow-slate-950/50 ${
          isOpen ? 'translate-x-0' : '-translate-x-[110%]'
        } lg:left-4`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-20 border-b border-white/5 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <School className="text-white h-5.5 w-5.5" />
              </div>
              <div>
                <span className="font-bold text-white text-md tracking-tight font-sans block">Apex Attend</span>
                <span className="text-[9px] text-blue-400 block font-mono font-medium uppercase tracking-wider">ERP System</span>
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

          {/* Quick Active session highlight badge */}
          <div className="px-5 pt-4">
            <div className="bg-slate-950/50 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-blue-400" />
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-300">ADMINISTRATIVE CORE</span>
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            </div>
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
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[13px] font-semibold tracking-wide transition-all duration-300 group cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-xl shadow-blue-600/10 border border-white/10'
                      : 'hover:bg-white/5 hover:text-white text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="h-1.5 w-1.5 rounded-full bg-white"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile details & Logout footer */}
        <div className="p-4 border-t border-white/5" id="sidebar-footer">
          {admin && (
            <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-slate-950/40 rounded-2xl border border-white/5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner">
                {admin.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate leading-none">{admin.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate mt-1">Administrator</p>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            id="sidebar-logout-btn"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all cursor-pointer group"
          >
            <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-1 duration-200" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
