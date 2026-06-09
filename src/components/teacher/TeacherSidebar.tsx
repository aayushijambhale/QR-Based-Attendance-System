import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { 
  Home, 
  GraduationCap, 
  QrCode, 
  History, 
  BarChart3, 
  User, 
  LogOut, 
  School,
  X 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const TeacherSidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen 
}) => {
  const { teacher, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Console Home', icon: Home },
    { id: 'subjects', label: 'My Subjects', icon: GraduationCap },
    { id: 'qr-generator', label: 'Dynamic QR Generator', icon: QrCode },
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
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          id="teacher-sidebar-backdrop"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar shell */}
      <aside 
        id="teacher-sidebar-root"
        className={`fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-900 z-45 flex flex-col justify-between transition-transform duration-300 select-none
          lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col flex-1">
          {/* Brand Header Section */}
          <div className="h-20 bg-slate-950 border-b border-slate-905 flex items-center justify-between px-6 shrink-0 relative">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-550/25">
                <School className="text-white h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block tracking-tight">Apex Faculty</span>
                <span className="text-[10px] text-slate-500 block font-semibold uppercase mt-0.5">Teacher Module</span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsOpen(false)}
              id="sidebar-close-btn"
              className="lg:hidden p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  id={`teacher-nav-${item.id}`}
                  className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all uppercase select-none cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-650 text-white shadow-md shadow-indigo-505/10' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Identity Box */}
        {teacher && (
          <div className="p-4 border-t border-slate-900 bg-slate-1000/20 shrink-0">
            <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-900">
              <img 
                src={teacher.profilePhoto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100"} 
                alt="Teacher Av" 
                className="h-9 w-9 rounded-xl object-cover shrink-0 border border-white/5 bg-slate-850"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{teacher.fullName}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{teacher.department}</p>
              </div>
            </div>

            {/* Logout Trigger */}
            <button
              onClick={logout}
              id="faculty-logout-btn"
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-xs font-semibold text-red-505 transition-all select-none cursor-pointer"
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
