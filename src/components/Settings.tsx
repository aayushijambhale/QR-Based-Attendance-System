import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../utils/api.js';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Globe, 
  CheckCircle,
  RefreshCw,
  Sliders,
  Sparkles
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { admin, updateProfile } = useAuth();

  // Profile Form States
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // System Settings Form States
  const [collegeName, setCollegeName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [allowLate, setAllowLate] = useState(true);
  const [systemStatus, setSystemStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [systemLoading, setSystemLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      setProfileName(admin.fullName);
      setProfileEmail(admin.email);
    }

    // Fetch System config from backend
    const loadSystemSettings = async () => {
      try {
        const config = await api.get<{
          collegeName: string;
          academicYear: string;
          refreshIntervalSeconds: number;
          allowLateAttendance: boolean;
        }>('/api/settings');

        setCollegeName(config.collegeName);
        setAcademicYear(config.academicYear);
        setRefreshInterval(config.refreshIntervalSeconds);
        setAllowLate(config.allowLateAttendance);
      } catch (err) {
        console.error("Failed to load ERP server settings config:", err);
      }
    };
    loadSystemSettings();
  }, [admin]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus(null);

    if (newPassword && newPassword !== confirmPassword) {
      setProfileStatus({ type: 'error', message: 'New password overrides do not match confirm.' });
      return;
    }

    setProfileLoading(true);

    try {
      await updateProfile(
        profileName,
        profileEmail,
        newPassword ? currentPassword : undefined,
        newPassword ? newPassword : undefined
      );

      // Clean password inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setProfileStatus({ type: 'success', message: 'Administration identity saved successfully!' });
    } catch (err: any) {
      setProfileStatus({ type: 'error', message: err.message || 'Operation failed.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSystemStatus(null);
    setSystemLoading(true);

    try {
      await api.put('/api/settings', {
        collegeName,
        academicYear,
        refreshIntervalSeconds: refreshInterval,
        allowLateAttendance: allowLate
      });
      setSystemStatus({ type: 'success', message: 'College ERP core specifications synchronized!' });
    } catch (err: any) {
      setSystemStatus({ type: 'error', message: err.message || 'Submission failed.' });
    } finally {
      setSystemLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="settings-view-container">
      {/* Header element */}
      <div>
        <h1 className="text-2xl font-bold text-slate-905 tracking-tight">System Configuration</h1>
        <p className="text-slate-500 text-xs mt-1">Configure admin credentials, adjust real-time scan behaviors, and set institution parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module A: Admin Profile & Security */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6" id="profile-settings-card">
          <div className="flex items-center gap-2 pb-3.5 border-b border-slate-50 mb-5 select-none">
            <User className="h-4 w-4 text-indigo-505" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Administration Credentials</span>
          </div>

          {profileStatus && (
            <div 
              className={`p-4 rounded-xl text-xs mb-5 border select-all ${
                profileStatus.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-red-50 border-red-100 text-red-800'
              }`}
            >
              {profileStatus.message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Administrative Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Apex Administrator"
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Official Admin Email</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="admin@college.edu"
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 focus:bg-white"
                />
              </div>
            </div>

            {/* Separator block for sensitive actions */}
            <div className="border-t border-slate-50 pt-5 mt-5 space-y-4">
              <div className="flex items-center gap-1.5 pb-1 select-none">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Override Secret Password</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Current Admin Password *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 focus:bg-white"
                  autoComplete="current-password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">New Password Key *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 focus:bg-white"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Confirm New Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 focus:bg-white"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="saas-button-primary w-full mt-4 py-3 disabled:opacity-40"
            >
              {profileLoading ? 'Authenticating and saving...' : 'Commit Administration Changes'}
            </button>
          </form>
        </div>

        {/* Module B: Academic System Parameters */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6" id="system-settings-card">
          <div className="flex items-center gap-2 pb-3.5 border-b border-slate-50 mb-5 select-none">
            <Globe className="h-4 w-4 text-indigo-505" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Institution Specifications</span>
          </div>

          {systemStatus && (
            <div 
              className={`p-4 rounded-xl text-xs mb-5 border select-all ${
                systemStatus.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-red-50 border-red-100 text-red-800'
              }`}
            >
              {systemStatus.message}
            </div>
          )}

          <form onSubmit={handleUpdateSystem} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Institution College Name</label>
              <input
                type="text"
                required
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="Apex Institute of Technology"
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Active Academic Term Year</label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026-2027"
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Allow Late */}
              <div className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 transition-colors select-none">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-700 block">Allow Late Entries</span>
                  <span className="text-[10px] text-slate-400 font-sans block leading-none mt-1">Status marked: Late</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowLate}
                  onChange={(e) => setAllowLate(e.target.checked)}
                  className="accent-indigo-600 h-4, w-4 text-indigo-650 cursor-pointer"
                />
              </div>

              {/* Refresh sliding */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Refreshing Scan (sec)</label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 font-medium"
                >
                  <option value="10">10 Seconds (Very Fast)</option>
                  <option value="30">30 Seconds (Recommended)</option>
                  <option value="60">60 Seconds</option>
                  <option value="120">120 Seconds</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={systemLoading}
              className="saas-button-primary w-full mt-6 py-3 disabled:opacity-40"
            >
              {systemLoading ? 'Sychronizing specs...' : 'Save College Specifications'}
            </button>
          </form>

          {/* Prompt default information */}
          <div className="mt-8 p-4 rounded-xl bg-violet-50/50 border border-violet-100 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-indigo-900 leading-relaxed font-sans font-medium">
              System changes configure metadata tags stamped on exports, print forms, and dynamic headers on pages!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
