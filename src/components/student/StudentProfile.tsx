import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  ShieldAlert, 
  CheckCircle, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Save,
  Image,
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
    <div className="space-y-6 animate-fade-in" id="student-profile-view">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Scholar Profile</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your official academic transcripts, update contact addresses, choose personal avatars, or change login passcodes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Avatar selector, static enrollment values */}
        <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-between text-center select-none h-fit space-y-6">
          <div className="space-y-4 flex flex-col items-center w-full">
            {/* profile photo */}
            <div className="relative group">
              <img
                src={profilePhoto}
                alt="Student Av"
                className="h-28 w-28 rounded-3xl object-cover ring-4 ring-slate-800/60 border border-slate-700/50 bg-slate-950"
              />
              <button
                type="button"
                onClick={() => setShowAvatarGrid(!showAvatarGrid)}
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-emerald-400 flex items-center justify-center transition-transform hover:scale-105 shadow-md cursor-pointer"
                title="Change Avatar"
              >
                <Image className="h-4 w-4" />
              </button>
            </div>

            {showAvatarGrid && (
              <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-850 animate-fade-in mt-3">
                <p className="text-[10px] font-bold text-slate-505 uppercase tracking-wide mb-2.5">Select Premium Avatar</p>
                <div className="grid grid-cols-5 gap-2">
                  {STATIC_AVATARS.map((av, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => { setProfilePhoto(av); setShowAvatarGrid(false); }}
                      className={`relative rounded-lg overflow-hidden h-9 w-9 border-2 transition-all cursor-pointer ${
                        profilePhoto === av ? 'border-emerald-500 scale-105 shadow-md' : 'border-transparent hover:border-slate-800'
                      }`}
                    >
                      <img src={av} alt="preview" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="py-2">
              <h3 className="text-base font-extrabold text-slate-205">{student?.fullName}</h3>
              <p className="text-[11px] font-mono text-emerald-400 mt-1 uppercase font-semibold">{student?.rollNumber}</p>
            </div>
          </div>

          <div className="w-full divide-y divide-slate-800 text-xs font-semibold text-slate-350 select-none">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Enrolled Division</span>
              <span className="text-emerald-400 block font-bold">DIVISION {student?.division}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Academic Year</span>
              <span>{student?.year}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Department</span>
              <span>{student?.department}</span>
            </div>
            <div className="py-3 flex justify-between bg-slate-950/20 px-2 rounded-xl border border-slate-900/50 mt-2">
              <span className="text-slate-550 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>Scholar Rank</span>
              </span>
              <span className="font-mono text-slate-200">Active Ledger</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive edit forms (contact update + change password) */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center gap-2 pb-3.5 border-b border-slate-800 font-bold mb-6 select-none">
            <User className="h-4.5 w-4.5 text-emerald-400" />
            <span className="text-xs text-slate-300 uppercase tracking-wider">Update Scholastic Console</span>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2 animate-shake" id="profile-error">
              <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2 animate-fade-in" id="profile-success">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitProfile} className="space-y-6 text-xs font-semibold text-slate-300">
            {/* General Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={student?.fullName}
                  disabled
                  title="Official names can only be updated by the Registrars"
                  className="w-full bg-slate-955 border border-slate-850 rounded-xl p-3 text-slate-500 outline-none cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1.5">
                  Scholar Roll Number
                </label>
                <input
                  type="text"
                  value={student?.rollNumber}
                  disabled
                  title="Official Roll numbers remain static once files are committed"
                  className="w-full bg-slate-955 border border-slate-850 rounded-xl p-3 text-slate-500 outline-none cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1.5">
                  Contact/University Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={student?.department}
                  disabled
                  className="w-full bg-slate-955 border border-slate-850 text-slate-500 rounded-xl p-3 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Sec Credentials */}
            <div className="border-t border-slate-800 pt-5 space-y-4">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold uppercase select-none mb-1 text-[11.5px]">
                <KeyRound className="h-4 w-4 text-emerald-450 shrink-0" />
                <span>Security Credentials Update</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1.5">
                    Current Secure Password
                  </label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 outline-none focus:border-emerald-555 placeholder:text-slate-600 font-mono pr-10"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1.5">
                    New Secure Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 outline-none focus:border-emerald-555 placeholder:text-slate-600 font-mono pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
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
              className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-2"
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
