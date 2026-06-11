import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { 
  User, 
  ShieldAlert, 
  CheckCircle, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Save,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

const STATIC_AVATARS = [
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
];

export const StudentProfile: React.FC = () => {
  const { student, updateStudentProfile, changeStudentPassword } = useAuth();

  // Contact edits
  const [email, setEmail] = useState(student?.email || '');
  const [profilePhoto, setProfilePhoto] = useState(student?.profilePhoto || STATIC_AVATARS[0]);
  
  // Credentials change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showAvatarGrid, setShowAvatarGrid] = useState(false);

  // status notifications
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email) {
      setErrorMsg('University Email is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Invalid email address format.');
      return;
    }

    if (currentPassword && newPassword) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        setErrorMsg('New password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters.');
        return;
      }
    }

    setSaving(true);

    try {
      // 1. Update basic core details (email & photo URL)
      await updateStudentProfile(email, profilePhoto);

      // 2. If user requested a password change
      if (currentPassword && newPassword) {
        await changeStudentPassword(currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
      }

      setSuccessMsg('Scholar profile updated successfully.');
    } catch (err: any) {
      setErrorMsg(err.error || err.message || 'Verification failed. Password mismatch or weak passcode.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#1D1D1F]" id="student-profile-view">
      <div className="select-none">
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Scholar Profile</h1>
        <p className="text-xs text-[#6E6E73] mt-1">
          Review your official academic transcripts, update contact addresses, choose personal avatars, or change login passcodes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Avatar selector, static enrollment values */}
        <div className="lg:col-span-1 saas-card p-5 flex flex-col items-center justify-between text-center select-none h-fit space-y-6">
          <div className="space-y-4 flex flex-col items-center w-full">
            {/* profile photo */}
            <div className="relative group">
              <img
                src={profilePhoto}
                alt="Student Av"
                className="h-24 w-24 rounded-full object-cover border border-[#D2D2D7] bg-[#F5F5F7] shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowAvatarGrid(!showAvatarGrid)}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white border border-[#D2D2D7] text-[#0071E3] flex items-center justify-center transition-transform hover:scale-105 shadow-sm cursor-pointer"
                title="Change Avatar"
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {showAvatarGrid && (
              <div className="w-full bg-[#F8F9FA] p-3 rounded-xl border border-[#D2D2D7] animate-fade-in mt-3">
                <p className="text-[9px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2 select-none">Select Avatar Profile</p>
                <div className="grid grid-cols-5 gap-2">
                  {STATIC_AVATARS.map((av, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => { setProfilePhoto(av); setShowAvatarGrid(false); }}
                      className={`relative rounded-full overflow-hidden h-8 w-8 border-2 transition-all cursor-pointer ${
                        profilePhoto === av ? 'border-[#0071E3] scale-105 shadow-sm' : 'border-transparent hover:border-[#D2D2D7]'
                      }`}
                    >
                      <img src={av} alt="preview" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="py-1">
              <h3 className="text-base font-bold text-[#1D1D1F]">{student?.fullName}</h3>
              <p className="text-[10px] font-mono text-[#6E6E73] mt-0.5 font-bold uppercase">Roll: {student?.rollNumber}</p>
            </div>
          </div>

          <div className="w-full divide-y divide-[#D2D2D7]/55 text-xs font-semibold text-[#6E6E73] select-none">
            <div className="py-2.5 flex justify-between">
              <span className="text-[9px] font-bold text-[#6E6E73] uppercase tracking-wider">Enrolled Division</span>
              <span className="text-[#0071E3] font-bold">Division {student?.division}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[9px] font-bold text-[#6E6E73] uppercase tracking-wider">Academic Year</span>
              <span className="text-[#1D1D1F]">{student?.year}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[9px] font-bold text-[#6E6E73] uppercase tracking-wider">Department</span>
              <span className="text-[#1D1D1F] truncate pl-2 max-w-[150px]">{student?.department}</span>
            </div>
            <div className="py-3 flex justify-between bg-[#F8F9FA] px-2 rounded-xl border border-[#D2D2D7]/55 mt-2">
              <span className="text-[9px] font-bold text-[#6E6E73] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-[#0071E3]" />
                <span>Scholar Rank</span>
              </span>
              <span className="font-mono text-[#1D1D1F]">Active Ledger</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive edit forms (contact update + change password) */}
        <div className="lg:col-span-2 saas-card p-6">
          <div className="flex items-center gap-2 pb-3.5 border-b border-[#D2D2D7]/55 font-bold mb-6 select-none">
            <User className="h-4.5 w-4.5 text-[#0071E3]" />
            <span className="text-xs text-[#1D1D1F] uppercase tracking-wider">Scholar Particulars</span>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-[#FDF2F2] border border-[#FF3B30]/20 text-xs text-[#FF3B30] flex items-center gap-2" id="profile-error">
              <ShieldAlert className="h-4 w-4 text-[#FF3B30] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-[#EAFBEF] border border-[#34C759]/20 text-xs text-[#34C759] flex items-center gap-2" id="profile-success">
              <CheckCircle className="h-4 w-4 text-[#34C759] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitProfile} className="space-y-6 text-xs font-semibold text-[#1D1D1F]">
            {/* General Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 select-none">
              <div>
                <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={student?.fullName}
                  disabled
                  title="Official names can only be updated by the Registrars"
                  className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl p-2.5 text-[#8E8E93] outline-none cursor-not-allowed font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wider mb-2">
                  Scholar Roll Number
                </label>
                <input
                  type="text"
                  value={student?.rollNumber}
                  disabled
                  title="Official Roll numbers remain static once files are committed"
                  className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl p-2.5 text-[#8E8E93] outline-none cursor-not-allowed font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wider mb-2">
                  Contact/University Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="saas-input"
                  required
                />
              </div>

              <div className="select-none">
                <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wider mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={student?.department}
                  disabled
                  className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl p-2.5 text-[#8E8E93] outline-none cursor-not-allowed font-semibold"
                />
              </div>
            </div>

            {/* Sec Credentials */}
            <div className="border-t border-[#D2D2D7]/55 pt-5 space-y-4">
              <div className="flex items-center gap-1.5 text-[#1D1D1F] font-bold uppercase select-none mb-1 text-[11px] tracking-wider">
                <KeyRound className="h-4 w-4 text-[#0071E3] shrink-0" />
                <span>Security Update</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wider mb-2">
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
                  <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wider mb-2">
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer"
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
              className="saas-button-primary flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Details'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
