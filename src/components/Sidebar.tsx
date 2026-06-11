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
    { id: 'reports', name: 'Reports & Analytics', icon: FilePieChart },
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
            className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Element */}
      <aside 
        id="sidebar-container"
        className={`fixed top-0 bottom-0 left-0 bg-[#F8F9FA] border-r border-[#D2D2D7] w-64 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-[110%]'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 border-b border-[#D2D2D7] flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-[#0071E3] rounded-lg flex items-center justify-center">
                <School className="text-white h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-[#1D1D1F] text-sm tracking-tight font-sans block">Apex Attend</span>
                <span className="text-[9px] text-[#6E6E73] block font-mono font-semibold uppercase tracking-wider">ERP System</span>
              </div>
            </div>
            {/* Close Toggle for Mobile Box */}
            <button 
              onClick={() => setIsOpen(false)}
              id="sidebar-close-btn"
              className="lg:hidden text-[#6E6E73] hover:text-[#1D1D1F] transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Active session highlight badge */}
          <div className="px-5 pt-4">
            <div className="bg-white rounded-lg p-2.5 border border-[#D2D2D7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[#0071E3]" />
                <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-[#1D1D1F]">ADMINISTRATIVE CORE</span>
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-[#0071E3]" />
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
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                    isActive 
                      ? 'bg-[#E8F2FF] text-[#0071E3]'
                      : 'hover:bg-white text-[#6E6E73] hover:text-[#1D1D1F] border border-transparent hover:border-[#D2D2D7]/45'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 shrink-0 transition-transform duration-150 ${
                      isActive ? 'text-[#0071E3]' : 'text-[#6E6E73] group-hover:text-[#1D1D1F]'
                    }`} />
                    <span>{item.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile details & Logout footer */}
        <div className="p-4 border-t border-[#D2D2D7]" id="sidebar-footer">
          {admin && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-3 bg-white rounded-xl border border-[#D2D2D7] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <div className="h-8 w-8 rounded-full bg-[#0071E3] flex items-center justify-center text-xs font-bold text-white shrink-0">
                {admin.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-[#1D1D1F] truncate leading-none">{admin.fullName}</p>
                <p className="text-[10px] text-[#6E6E73] truncate mt-1">Administrator</p>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            id="sidebar-logout-btn"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-[#FF3B30] hover:bg-[#FFF1F1] transition-all cursor-pointer group"
          >
            <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5 duration-150" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
