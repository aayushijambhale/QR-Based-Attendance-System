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
            className="lg:hidden fixed inset-0 bg-[#134E4A]/60 backdrop-blur-sm z-40 cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Element */}
      <aside 
        id="sidebar-container"
        className={`fixed top-0 bottom-0 left-0 bg-[#FFFBF5] border-r border-[#E2E8F0] w-64 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-[110%]'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-20 border-b border-[#E2E8F0] flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[#0F766E] rounded-md flex items-center justify-center">
                <School className="text-white h-5.5 w-5.5" />
              </div>
              <div>
                <span className="font-bold text-[#134E4A] text-md tracking-tight font-sans block">Apex Attend</span>
                <span className="text-[9px] text-[#64748B] block font-mono font-medium uppercase tracking-wider">ERP System</span>
              </div>
            </div>
            {/* Close Toggle for Mobile Box */}
            <button 
              onClick={() => setIsOpen(false)}
              id="sidebar-close-btn"
              className="lg:hidden text-[#64748B] hover:text-[#134E4A] transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Active session highlight badge */}
          <div className="px-5 pt-4">
            <div className="bg-[#FFFBF5] rounded-md p-3 border border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-[#14B8A6]" />
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#134E4A]">ADMINISTRATIVE CORE</span>
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A6]" />
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
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-200 group cursor-pointer ${
                    isActive 
                      ? 'bg-[#EAF5F5] text-[#0F766E]'
                      : 'hover:bg-white text-[#64748B] hover:text-[#134E4A]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-[#0F766E]' : 'text-[#64748B] group-hover:text-[#134E4A]'
                    }`} />
                    <span>{item.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile details & Logout footer */}
        <div className="p-4" id="sidebar-footer">
          {admin && (
            <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-white rounded-xl border border-[#F1F5F9] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
              <div className="h-9 w-9 rounded-lg bg-[#0F766E] flex items-center justify-center text-xs font-bold text-white shrink-0">
                {admin.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-[#134E4A] truncate leading-none">{admin.fullName}</p>
                <p className="text-[10px] text-[#64748B] truncate mt-1">Administrator</p>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            id="sidebar-logout-btn"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-[13px] font-medium text-[#EF4444] hover:bg-[#FEF2F2] transition-all cursor-pointer group"
          >
            <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-1 duration-200" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
