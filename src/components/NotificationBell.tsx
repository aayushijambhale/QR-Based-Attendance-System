import React, { useState, useEffect, useRef } from 'react';
import { Bell, RefreshCw, Check, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.js';
import { io } from 'socket.io-client';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const { token, role } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const list = await api.get<Notification[]>('/api/notifications');
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Setup real-time Socket.io feedback loop
    const socket = io(window.location.origin, {
      auth: { token }
    });

    socket.on('notification', (newNotif: Notification) => {
      // Prepend the new notification streaming over sockets
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Handle session started broadcasts specifically
    socket.on('sessionStarted', (session: any) => {
      if (role === 'student') {
        const socketNotif: Notification = {
          id: `socket_${Date.now()}_start`,
          userId: 'all',
          title: 'Check-In Gate Opened',
          message: `Dynamic check-in started for "${session.subjectName}". Scan instantly before expiry.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(prev => [socketNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    // Handle attendance marked notifications specifically
    socket.on('attendanceMarked', (data: any) => {
      if (role === 'teacher') {
        const socketNotif: Notification = {
          id: `socket_${Date.now()}_mark`,
          userId: 'all',
          title: 'Student Checked In',
          message: `${data.studentName} marked present. Coordinates verified.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(prev => [socketNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    // Close dropdown on clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      socket.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [token, role]);

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read && !n.id.startsWith('socket_'));
    try {
      await Promise.all(unread.map(n => api.put(`/api/notifications/${n.id}/read`, {})));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const markOneAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id.startsWith('socket_')) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }
    try {
      await api.put(`/api/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-550 dark:text-slate-350 transition-all cursor-pointer"
        aria-label="Notification center"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 text-white font-bold text-[8px] rounded-full flex items-center justify-center animate-pulse border border-white dark:border-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3.5 w-76 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-xl z-50 divide-y divide-slate-100 dark:divide-slate-900 animate-fade-in overflow-hidden">
          <div className="p-3.5 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/30">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-805 dark:text-slate-250">Terminal Warnings</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[9px] text-indigo-605 dark:text-emerald-450 font-extrabold uppercase hover:underline cursor-pointer"
              >
                Clear all ({unreadCount})
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-150 dark:divide-slate-900">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2 text-slate-500" />
                <span className="text-[10px] uppercase font-mono">Syncing alert log...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-450 leading-normal">
                <Bell className="h-5 w-5 text-slate-250 dark:text-slate-750 mx-auto mb-1.5" />
                <p className="text-[9px] uppercase font-mono font-bold">No active warnings</p>
                <p className="text-[8px] text-slate-450 mt-0.5 lowercase leading-snug">all network parameters are quiet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isRead = notif.read;
                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors flex gap-2.5 text-left ${
                      isRead ? 'bg-transparent opacity-50' : 'bg-indigo-50/20 dark:bg-emerald-950/10'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {notif.type === 'success' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : notif.type === 'warning' ? (
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                      ) : (
                        <Info className="h-3.5 w-3.5 text-indigo-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-snug">
                          {notif.title}
                        </p>
                        {!isRead && (
                          <button
                            onClick={(e) => markOneAsRead(notif.id, e)}
                            className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal font-semibold">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
