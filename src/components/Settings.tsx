import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../utils/api.js';
import { 
  User, 
  Lock, 
  Globe, 
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

      setProfileStatus({ type: 'success', message: 'Administration credentials saved successfully!' });
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
      setSystemStatus({ type: 'success', message: 'College ERP specifications synchronized!' });
    } catch (err: any) {
      setSystemStatus({ type: 'error', message: err.message || 'Submission failed.' });
    } finally {
      setSystemLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#1D1D1F]" id="settings-view-container">
      {/* Header element */}
      <div className="select-none">
        <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">System Settings</h1>
        <p className="text-[#6E6E73] text-xs mt-1">Configure admin credentials, adjust real-time scan behaviors, and set institution parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module A: Admin Profile & Security */}
        <div className="saas-card p-6" id="profile-settings-card">
          <div className="flex items-center gap-2 pb-3.5 border-b border-[#D2D2D7]/55 mb-5 select-none">
            <User className="h-4 w-4 text-[#0071E3]" />
            <span className="text-[10px] font-bold text-[#1D1D1F] uppercase tracking-wider">Administration Credentials</span>
          </div>

          {profileStatus && (
            <div 
              className={`p-3.5 rounded-xl text-xs mb-5 border select-all ${
                profileStatus.type === 'success' 
                  ? 'bg-[#EAFBEF] border-[#34C759]/20 text-[#34C759]' 
                  : 'bg-[#FDF2F2] border-[#FF3B30]/20 text-[#FF3B30]'
              }`}
            >
              {profileStatus.message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Apex Administrator"
                  className="saas-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">Admin Email</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="admin@college.edu"
                  className="saas-input text-xs"
                />
              </div>
            </div>

            {/* Separator block for sensitive actions */}
            <div className="border-t border-[#D2D2D7]/55 pt-5 mt-5 space-y-4">
              <div className="flex items-center gap-1.5 pb-1 select-none">
                <Lock className="h-4 w-4 text-[#6E6E73]" />
                <span className="text-[10px] font-bold text-[#1D1D1F] uppercase tracking-wider">Override Secret Password</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">Current Password *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="saas-input text-xs"
                  autoComplete="current-password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">New Password *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="saas-input text-xs"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">Confirm New Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="saas-input text-xs"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="saas-button-primary w-full mt-4 py-2.5 disabled:opacity-40 cursor-pointer"
            >
              {profileLoading ? 'Authenticating and saving...' : 'Commit Administration Changes'}
            </button>
          </form>
        </div>

        {/* Module B: Academic System Parameters */}
        <div className="saas-card p-6" id="system-settings-card">
          <div className="flex items-center gap-2 pb-3.5 border-b border-[#D2D2D7]/55 mb-5 select-none">
            <Globe className="h-4 w-4 text-[#0071E3]" />
            <span className="text-[10px] font-bold text-[#1D1D1F] uppercase tracking-wider">Institution Specifications</span>
          </div>

          {systemStatus && (
            <div 
              className={`p-3.5 rounded-xl text-xs mb-5 border select-all ${
                systemStatus.type === 'success' 
                  ? 'bg-[#EAFBEF] border-[#34C759]/20 text-[#34C759]' 
                  : 'bg-[#FDF2F2] border-[#FF3B30]/20 text-[#FF3B30]'
              }`}
            >
              {systemStatus.message}
            </div>
          )}

          <form onSubmit={handleUpdateSystem} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">Institution College Name</label>
              <input
                type="text"
                required
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="Apex Institute of Technology"
                className="saas-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">Active Academic Term Year</label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026-2027"
                className="saas-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Allow Late */}
              <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#D2D2D7] flex items-center justify-between gap-4 select-none">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#1D1D1F] block">Allow Late Entries</span>
                  <span className="text-[9px] text-[#6E6E73] font-sans block leading-none mt-1">Status marked: Late</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowLate}
                  onChange={(e) => setAllowLate(e.target.checked)}
                  className="accent-[#0071E3] h-4 w-4 text-[#0071E3] cursor-pointer"
                />
              </div>

              {/* Refresh sliding */}
              <div>
                <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">Refreshing Scan (sec)</label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value, 10))}
                  className="saas-input text-xs py-2.5"
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
              className="saas-button-primary w-full mt-6 py-2.5 disabled:opacity-40 cursor-pointer"
            >
              {systemLoading ? 'Synchronizing specs...' : 'Save College Specifications'}
            </button>
          </form>

          {/* Prompt default information */}
          <div className="mt-7 p-4 rounded-xl bg-[#E8F2FF] border border-[#0071E3]/15 flex items-start gap-3 select-none">
            <Sparkles className="h-4 w-4 text-[#0071E3] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#6E6E73] leading-relaxed font-sans font-medium">
              System changes configure metadata tags stamped on exports, print forms, and dynamic headers on pages!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
