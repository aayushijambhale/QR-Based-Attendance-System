import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Lock, Mail, Eye, EyeOff, KeyRound, School, GraduationCap, ShieldCheck, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [loginAs, setLoginAs] = useState<'admin' | 'teacher' | 'student'>('student');
  const [emailOrRoll, setEmailOrRoll] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrRoll || !password) {
      setError('Please fill in all standard credentials.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(emailOrRoll, password, rememberMe, loginAs);
    } catch (err: any) {
      setError(
        err.error || 
        err.message || 
        `Invalid ${loginAs === 'admin' ? 'administrator email' : loginAs === 'teacher' ? 'faculty teacher email' : 'student roll number'} or password.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FFFBF5]">
      {/* Main Container */}
      <div className="w-full max-w-md animate-fade-in" id="login-card-container">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center select-none">
          <div className="h-16 w-16 bg-[#0F766E] rounded-md flex items-center justify-center shadow-sm mb-4">
            <School className="text-white h-9 w-9" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#134E4A] font-sans">
            Apex Attendance
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            QR-Based Attendance Management System
          </p>
        </div>

        {/* Clean Box Form */}
        <div className="bg-white rounded-lg p-8 border border-[#E2E8F0] shadow-sm relative">
          
          {/* Identity role selector tabs (3 roles) */}
          <div className="flex bg-[#FFFBF5] p-1 rounded-md mb-6 border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => {
                setLoginAs('student');
                setError(null);
                setEmailOrRoll('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                loginAs === 'student'
                  ? 'bg-white text-[#0F766E] shadow-sm border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#134E4A]'
              }`}
            >
              <UserCheck className="h-3 w-3" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginAs('teacher');
                setError(null);
                setEmailOrRoll('evelyn.foster@college.edu');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                loginAs === 'teacher'
                  ? 'bg-white text-[#0F766E] shadow-sm border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#134E4A]'
              }`}
            >
              <GraduationCap className="h-3 w-3" />
              <span>Teacher</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginAs('admin');
                setError(null);
                setEmailOrRoll('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                loginAs === 'admin'
                  ? 'bg-white text-[#0F766E] shadow-sm border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#134E4A]'
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              <span>Admin</span>
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-medium text-[#134E4A] mb-1">Welcome back</h2>
            <p className="text-xs text-[#64748B]">
              Sign in with your {loginAs === 'admin' ? 'administrative email' : loginAs === 'teacher' ? 'assigned faculty email' : 'scholar roll number'}.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#EF4444] flex items-center gap-2" id="error-message-box">
              <span className="h-2 w-2 rounded-full bg-[#EF4444] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input target fields */}
            <div>
              <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">
                {loginAs === 'admin' ? 'Administrator Email' : loginAs === 'teacher' ? 'Teacher Email' : 'Student Roll Number'}
              </label>
              <div className="relative">
                {loginAs === 'student' ? (
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                ) : (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                )}
                <input
                  type="text"
                  value={emailOrRoll}
                  onChange={(e) => setEmailOrRoll(e.target.value)}
                  placeholder={
                    loginAs === 'admin' 
                      ? 'admin@college.edu' 
                      : loginAs === 'teacher' 
                        ? 'evelyn.foster@college.edu' 
                        : 'e.g. 20CS01'
                  }
                  id="email-or-roll-input"
                  className="saas-input pl-10"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  id="password-input"
                  className="saas-input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  id="toggle-password-btn"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#64748B] hover:text-[#134E4A] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  id="remember-checkbox"
                  className="accent-[#0F766E] h-4 w-4 rounded border-[#E2E8F0] text-[#0F766E] focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs text-[#64748B]">Remember session logs</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              id="login-submit-btn"
              className="w-full mt-6 saas-button-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <KeyRound className="animate-spin h-4 w-4 text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Access Portal Console</span>
              )}
            </button>
          </form>

          {/* Prompt Default Credentials Help */}
          <div className="mt-6 border-t border-[#E2E8F0] pt-4 text-center">
            <span className="text-[10px] text-[#64748B] block">Default Setup Keypairs:</span>
            {loginAs === 'admin' ? (
              <code className="text-[#134E4A] text-[11px] font-mono mt-1 block bg-[#FFFBF5] py-1.5 rounded-md border border-[#E2E8F0]">
                aayushiadmin@gmail.com / 123
              </code>
            ) : loginAs === 'teacher' ? (
              <code className="text-[#134E4A] text-[11px] font-mono mt-1 block bg-[#FFFBF5] py-1.5 rounded-md border border-[#E2E8F0]">
                jyoti.nandimath@mituniversity.edu.in / Password123
              </code>
            ) : (
              <code className="text-[#134E4A] text-[11px] font-mono mt-1 block bg-[#FFFBF5] py-1.5 rounded-md border border-[#E2E8F0]">
                1 / Password123
              </code>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
