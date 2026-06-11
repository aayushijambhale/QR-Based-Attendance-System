import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { 
  User, 
  ShieldAlert, 
  CheckCircle, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Save 
} from 'lucide-react';

export const TeacherProfile: React.FC = () => {
  const { teacher, updateTeacherProfile } = useAuth();

  // form states
  const [fullName, setFullName] = useState(teacher?.fullName || '');
  const [email, setEmail] = useState(teacher?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(teacher?.phoneNumber || '');
  
  // Credentials change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // status notifications
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      setErrorMsg('Full Name and Email are essential.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // If updating password
      const changePassword = currentPassword && newPassword;
      await updateTeacherProfile(
        fullName,
        email,
        phoneNumber,
        changePassword ? currentPassword : undefined,
        changePassword ? newPassword : undefined
      );

      setSuccessMsg('Profile details saved successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="teacher-profile-view">
      <div>
        <h1 className="text-2xl font-bold font-sans text-[#1D1D1F] tracking-tight">Faculty Profile</h1>
        <p className="text-xs text-[#6E6E73] mt-1">
          Review your university employee record, update contact details, or secure your passcode credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: Beautiful static avatar and system meta info */}
        <div className="lg:col-span-1 saas-card p-6 flex flex-col items-center justify-between text-center h-fit space-y-6">
          <div className="space-y-4 flex flex-col items-center">
            {/* profile photo */}
            <div className="relative">
              <img
                src={teacher?.profilePhoto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces"}
                alt="Teacher Av"
                className="h-28 w-28 rounded-3xl object-cover ring-4 ring-[#F8F9FA] border border-[#D2D2D7]"
              />
              <span className="absolute bottom-1 right-1 h-4.5 w-4.5 rounded-full bg-[#34C759] border-2 border-white animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#1D1D1F]">{teacher?.fullName}</h3>
              <p className="text-[11px] font-mono text-[#6E6E73] mt-1 uppercase font-semibold">{teacher?.employeeId || 'FAC-CS-202'}</p>
            </div>
          </div>

          <div className="w-full divide-y divide-[#D2D2D7] text-xs font-semibold text-[#1D1D1F] select-none">
            <div className="py-2.5 flex justify-between">
              <span className="text-[#6E6E73] font-semibold uppercase tracking-wider text-[9px]">Role</span>
              <span className="text-[#0071E3]">Lecturer Faculty</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#6E6E73] font-semibold uppercase tracking-wider text-[9px]">Department</span>
              <span>{teacher?.department}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-[#6E6E73] font-semibold uppercase tracking-wider text-[9px]">Account Node</span>
              <span className="apple-badge">Verified Ledger</span>
            </div>
          </div>
        </div>

        {/* Right Form: interactive update */}
        <div className="lg:col-span-2 saas-card p-6">
          <div className="flex items-center gap-2 pb-3.5 border-b border-[#D2D2D7] font-bold mb-6 select-none">
            <User className="h-4.5 w-4.5 text-[#0071E3]" />
            <span className="text-xs text-[#1D1D1F] uppercase tracking-wider">Update Details Console</span>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-xs text-[#FF3B30] flex items-center gap-2 animate-shake" id="profile-error">
              <ShieldAlert className="h-4 w-4 text-[#FF3B30] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#34C759]/10 border border-[#34C759]/20 text-xs text-[#34C759] flex items-center gap-2 animate-fade-in select-none" id="profile-success">
              <CheckCircle className="h-4 w-4 text-[#34C759] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitProfile} className="space-y-6 text-xs font-semibold text-[#1D1D1F]">
            {/* General Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wide mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="saas-input"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wide mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={teacher?.department}
                  disabled
                  title="Department can only be edited by administrative accounts"
                  className="saas-input bg-[#F8F9FA] text-[#6E6E73] cursor-not-allowed border-[#D2D2D7]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wide mb-1.5">
                  University Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="saas-input"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wide mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 0000"
                  className="saas-input"
                />
              </div>
            </div>

            {/* Sec Credentials */}
            <div className="border-t border-[#D2D2D7] pt-5 space-y-4">
              <div className="flex items-center gap-1.5 text-[#1D1D1F] font-bold uppercase select-none mb-1 text-[11.5px]">
                <KeyRound className="h-4 w-4 text-[#0071E3] shrink-0" />
                <span>Security Credentials Update</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wide mb-1.5">
                    Current Password
                  </label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="saas-input font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wide mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="saas-input font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="saas-button-primary py-3 px-6 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving Details...' : 'Save Settings'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
