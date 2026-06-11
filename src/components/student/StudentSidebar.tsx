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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-45 lg:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Sidebar shell */}
      <aside 
        id="student-sidebar-root"
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#F8F9FA] border-r border-[#D2D2D7] z-50 flex flex-col justify-between transition-transform duration-300 select-none
          lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-[110%]'}`}
      >
        <div className="flex flex-col flex-1">
          {/* Brand Header Section */}
          <div className="h-16 border-b border-[#D2D2D7] flex items-center justify-between px-6 shrink-0 relative">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-[#0071E3] rounded-lg flex items-center justify-center">
                <School className="text-white h-5 w-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-[#1D1D1F] block tracking-tight">Apex Scholar</span>
                <span className="text-[9px] text-[#6E6E73] block font-semibold uppercase tracking-wider mt-0.5">Scholar Terminal</span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsOpen(false)}
              id="sidebar-close-btn"
              className="lg:hidden p-1.5 hover:bg-[#F8F9FA] rounded-lg text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Active session highlight badge */}
          <div className="px-5 pt-4">
            <div className="bg-white rounded-lg p-2.5 border border-[#D2D2D7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[#0071E3]" />
                <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-[#1D1D1F]">SCHOLAR PORTAL</span>
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-[#0071E3]" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  id={`student-nav-${item.id}`}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 select-none cursor-pointer ${
                    isActive 
                      ? 'bg-[#E8F2FF] text-[#0071E3]' 
                      : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-white border border-transparent hover:border-[#D2D2D7]/45'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#0071E3]' : 'text-[#6E6E73] group-hover:text-[#1D1D1F]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="active-indicator-student"
                      className="h-1.5 w-1.5 rounded-full bg-[#0071E3]"
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
          <div className="p-4 border-t border-[#D2D2D7] shrink-0">
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-[#D2D2D7] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <img 
                src={student.profilePhoto || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100"} 
                alt="Student Av" 
                className="h-8 w-8 rounded-full object-cover shrink-0 border border-[#D2D2D7]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#1D1D1F] truncate leading-none">{student.fullName}</p>
                <p className="text-[9px] text-[#6E6E73] font-mono mt-1 truncate">{student.rollNumber}</p>
              </div>
            </div>

            {/* Logout Trigger */}
            <button
              onClick={logout}
              id="student-logout-btn"
              className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg border border-[#FF3B30]/10 hover:border-[#FF3B30]/30 bg-[#FF3B30]/5 hover:bg-[#FF3B30]/10 text-xs font-semibold text-[#FF3B30] transition-all select-none cursor-pointer"
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
