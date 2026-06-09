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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-950 overflow-hidden">
      {/* Absolute decorative blurred rings */}
      <div className="absolute top-[10%] left-[10%] w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md animate-fade-in" id="login-card-container">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center select-none">
          <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 ring-4 ring-white/10">
            <School className="text-white h-9 w-9" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white font-sans">
            Apex Attendance
          </h1>
          <p className="text-sm text-indigo-300/80 mt-1">
            QR-Based Attendance Management System
          </p>
        </div>

        {/* Glass Box Form */}
        <div className="glass-panel-dark rounded-3xl p-8 border border-white/15 shadow-2xl relative">
          
          {/* Identity role selector tabs (3 roles) */}
          <div className="flex bg-slate-950/40 p-1 rounded-xl mb-6 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setLoginAs('student');
                setError(null);
                setEmailOrRoll('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                loginAs === 'student'
                  ? 'bg-gradient-to-r from-emerald-550 to-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                loginAs === 'teacher'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                loginAs === 'admin'
                  ? 'bg-gradient-to-r from-indigo-550 to-indigo-650 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              <span>Admin</span>
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-medium text-white mb-1">Welcome back</h2>
            <p className="text-xs text-slate-400">
              Sign in with your {loginAs === 'admin' ? 'administrative email' : loginAs === 'teacher' ? 'assigned faculty email' : 'scholar roll number'}.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 flex items-center gap-2 animate-shake" id="error-message-box">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input target fields */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                {loginAs === 'admin' ? 'Administrator Email' : loginAs === 'teacher' ? 'Teacher Email' : 'Student Roll Number'}
              </label>
              <div className="relative">
                {loginAs === 'student' ? (
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                ) : (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                  className="w-full bg-slate-900/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white rounded-xl py-3 pl-10 pr-4 outline-none transition-all placeholder:text-slate-505"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  id="password-input"
                  className="w-full bg-slate-900/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white rounded-xl py-3 pl-10 pr-10 outline-none transition-all placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  id="toggle-password-btn"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-white transition-colors"
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
                  className="accent-indigo-500 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs text-slate-300">Remember session logs</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              id="login-submit-btn"
              className={`w-full mt-6 bg-gradient-to-r text-sm text-white font-medium py-3 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                loginAs === 'student' 
                  ? 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/10' 
                  : 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-500/10'
              }`}
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
          <div className="mt-6 border-t border-white/5 pt-4 text-center">
            <span className="text-[10px] text-indigo-200/50 block">Default Setup Keypairs:</span>
            {loginAs === 'admin' ? (
              <code className="text-indigo-200 text-[11px] font-mono mt-1 block bg-slate-950/20 py-1.5 rounded-lg border border-white/5">
                admin@college.edu / password123
              </code>
            ) : loginAs === 'teacher' ? (
              <code className="text-indigo-200 text-[11px] font-mono mt-1 block bg-slate-950/20 py-1.5 rounded-lg border border-white/5">
                evelyn.foster@college.edu / password123
              </code>
            ) : (
              <code className="text-emerald-355 text-[11px] font-mono mt-1 block bg-slate-950/20 py-1.5 rounded-lg border border-white/5">
                20CS01 / password123 &nbsp;or&nbsp; 20CS04 / password123
              </code>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
