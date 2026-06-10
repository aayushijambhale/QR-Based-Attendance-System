import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  GraduationCap, 
  QrCode, 
  History, 
  BarChart3, 
  User, 
  LogOut, 
  School,
  X,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const StudentSidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen 
}) => {
  const { student, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Console Home', icon: Home },
    { id: 'subjects', label: 'My Subjects', icon: GraduationCap },
    { id: 'qr-scanner', label: 'Scan QR Code', icon: QrCode },
    { id: 'attendance', label: 'Log Records', icon: History },
    { id: 'reports', label: 'Analytics Reports', icon: BarChart3 },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const handleNav = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile drawer backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            id="student-sidebar-backdrop"
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-45 lg:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Sidebar shell */}
      <aside 
        id="student-sidebar-root"
        className={`fixed top-4 bottom-4 left-4 w-64 bg-slate-900 rounded-[28px] border border-white/10 z-45 flex flex-col justify-between transition-transform duration-300 select-none shadow-2xl shadow-slate-950/50
          lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-[110%]'}`}
      >
        <div className="flex flex-col flex-1">
          {/* Brand Header Section */}
          <div className="h-20 border-b border-white/5 flex items-center justify-between px-6 shrink-0 relative">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <School className="text-white h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block tracking-tight">Apex Scholar</span>
                <span className="text-[9px] text-emerald-450 block font-semibold uppercase tracking-wider mt-0.5">Scholar Terminal</span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsOpen(false)}
              id="sidebar-close-btn"
              className="lg:hidden p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Active session highlight badge */}
          <div className="px-5 pt-4">
            <div className="bg-slate-950/50 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-300">SCHOLAR PORTAL</span>
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  id={`student-nav-${item.id}`}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[13px] font-semibold tracking-wide transition-all duration-300 uppercase select-none cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-650 text-white shadow-xl shadow-emerald-500/10 border border-white/10' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="active-indicator-student"
                      className="h-1.5 w-1.5 rounded-full bg-white"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Identity Box */}
        {student && (
          <div className="p-4 border-t border-white/5 shrink-0">
            <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
              <img 
                src={student.profilePhoto || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100"} 
                alt="Student Av" 
                className="h-9 w-9 rounded-xl object-cover shrink-0 border border-white/5 bg-slate-850"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate leading-none">{student.fullName}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1.5 truncate">{student.rollNumber}</p>
              </div>
            </div>

            {/* Logout Trigger */}
            <button
              onClick={logout}
              id="student-logout-btn"
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-red-500/10 hover:border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-xs font-semibold text-rose-400 transition-all select-none cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Exit Console</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
