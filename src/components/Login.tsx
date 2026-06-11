import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Lock, Mail, Eye, EyeOff, KeyRound, School, GraduationCap, UserCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [loginAs, setLoginAs] = useState<'teacher' | 'student'>('student');
  const [emailOrRoll, setEmailOrRoll] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-detect admin presence based on email input
  const isAdminDetected = emailOrRoll.trim().toLowerCase() === 'aayushiadmin@gmail.com' || 
                          (emailOrRoll.trim().toLowerCase().includes('admin') && emailOrRoll.includes('@'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrRoll || !password) {
      setError('Please fill in all standard credentials.');
      return;
    }

    setLoading(true);
    setError(null);

    // If admin is detected, override selection and authenticate as admin
    const actualRole = isAdminDetected ? 'admin' : loginAs;

    try {
      await login(emailOrRoll, password, rememberMe, actualRole);
    } catch (err: any) {
      setError(
        err.error || 
        err.message || 
        `Invalid ${actualRole === 'admin' ? 'administrator email' : actualRole === 'teacher' ? 'faculty teacher email' : 'student roll number'} or password.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F8F9FA] font-sans overflow-x-hidden">
      
      {/* LEFT COLUMN: College Showcase & Visual branding (Visible on md and larger) */}
      <div className="hidden md:flex md:w-[50%] lg:w-[55%] xl:w-[60%] bg-gradient-to-br from-[#1D1D1F] via-[#242426] to-[#0A0A0B] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden select-none">
        
        {/* Subtle blur highlights */}
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-[#0071E3]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#34C759]/5 blur-[100px] pointer-events-none" />

        {/* Top Header: Brand Identity */}
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/15">
            <School className="text-white h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider uppercase text-white leading-none">Apex University</h2>
            <span className="text-[10px] text-[#6E6E73] font-semibold tracking-widest mt-1 block uppercase">Autonomous ERP Gateway</span>
          </div>
        </div>

        {/* Center content: Text & Key features list */}
        <div className="my-auto max-w-lg space-y-8 relative z-10">
          <div className="space-y-4">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Unified Academic Gateway. Secure Attendance Ledgers.
            </h1>
            <p className="text-[#AEAEB2] text-sm leading-relaxed">
              Welcome to the digital campus portal. Authenticate to manage syllabus records, broadcast active QR gates, or verify lecture attendance in real-time.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Feature 1 */}
            <div className="flex items-start gap-3.5">
              <div className="mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-[#0071E3]/20 flex items-center justify-center border border-[#0071E3]/35 text-[#0071E3]">
                <CheckCircle2 className="h-3 w-3 text-[#0071E3]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Rotating QR Session Gates</h4>
                <p className="text-[11px] text-[#AEAEB2] mt-0.5">Dynamic checking keys with automatic 30s tokens rotation preventing proxy check-ins.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3.5">
              <div className="mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-[#34C759]/20 flex items-center justify-center border border-[#34C759]/35 text-[#34C759]">
                <CheckCircle2 className="h-3 w-3 text-[#34C759]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Real-Time Sync Diagnostics</h4>
                <p className="text-[11px] text-[#AEAEB2] mt-0.5">Live WebSocket stream updates statistical charts instantly as check-ins are logged.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3.5">
              <div className="mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-[#FF9500]/20 flex items-center justify-center border border-[#FF9500]/35 text-[#FF9500]">
                <CheckCircle2 className="h-3 w-3 text-[#FF9500]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Roster Intelligence</h4>
                <p className="text-[11px] text-[#AEAEB2] mt-0.5">Class registries segmented by target department divisions and active semesters.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stats row */}
        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10 relative z-10">
          <div>
            <span className="text-xl lg:text-2xl font-mono font-bold text-white block">12,800+</span>
            <span className="text-[10px] text-[#6E6E73] font-bold uppercase tracking-wider">Students Enrolled</span>
          </div>
          <div>
            <span className="text-xl lg:text-2xl font-mono font-bold text-white block">480+</span>
            <span className="text-[10px] text-[#6E6E73] font-bold uppercase tracking-wider">Faculty Lecturers</span>
          </div>
          <div>
            <span className="text-xl lg:text-2xl font-mono font-bold text-white block">99.9%</span>
            <span className="text-[10px] text-[#6E6E73] font-bold uppercase tracking-wider">Uptime Verification</span>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Authentic clean Apple login card */}
      <div className="flex-1 min-h-screen flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[390px] animate-fade-in" id="login-card-container">
          
          {/* Brand Header for Mobile views */}
          <div className="text-center mb-6 flex flex-col items-center select-none md:hidden">
            <div className="h-12 w-12 bg-[#0071E3] rounded-xl flex items-center justify-center mb-3">
              <School className="text-white h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
              Apex ERP Portal
            </h1>
            <p className="text-[10px] text-[#6E6E73] mt-0.5">
              Secure QR-Based Campus Management
            </p>
          </div>

          {/* Login Box */}
          <div className="bg-white rounded-2xl p-7 border border-[#D2D2D7] shadow-[0_6px_20px_rgba(0,0,0,0.03)] relative">
            
            {/* Segmented control: Teacher & Student only. Admin is auto-triggered */}
            <div className="flex bg-[#F5F5F7] p-0.5 rounded-lg mb-6 border border-[#D2D2D7]/50 select-none">
              <button
                type="button"
                onClick={() => {
                  setLoginAs('student');
                  setError(null);
                  setEmailOrRoll('ADT23SOCB1502'); // Real seed student roll
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  loginAs === 'student'
                    ? 'bg-white text-[#0071E3] shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-[#D2D2D7]/50'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
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
                  setEmailOrRoll('jyoti.nandimath@mituniversity.edu.in'); // Real seed teacher email
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  loginAs === 'teacher'
                    ? 'bg-white text-[#0071E3] shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-[#D2D2D7]/50'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <GraduationCap className="h-3 w-3" />
                <span>Teacher</span>
              </button>
            </div>

            {/* Login Header details */}
            <div className="mb-5 select-none">
              <h2 className="text-lg font-bold text-[#1D1D1F]">Sign In</h2>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                {isAdminDetected 
                  ? 'Administrator account detected. Password verification active.' 
                  : `Enter your ${loginAs === 'teacher' ? 'faculty email' : 'roll number'} to access.`}
              </p>
            </div>

            {/* Admin Auto-Trigger Detection banner */}
            {isAdminDetected && (
              <div className="mb-5 p-3 rounded-xl bg-[#0071E3]/10 border border-[#0071E3]/20 text-xs text-[#0071E3] flex items-center gap-2 animate-fade-in select-none">
                <ShieldCheck className="h-4 w-4 text-[#0071E3] shrink-0" />
                <span className="font-semibold">Admin Mode Activated Automatically</span>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-xs text-[#FF3B30] flex items-center gap-2" id="error-message-box">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B30] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Credentials Identifier Field */}
              <div>
                <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-1.5">
                  {isAdminDetected 
                    ? 'Administrator Identity' 
                    : loginAs === 'teacher' 
                      ? 'Teacher Email' 
                      : 'Student Roll Number'}
                </label>
                <div className="relative">
                  {loginAs === 'student' && !isAdminDetected ? (
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E6E73]" />
                  ) : (
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E6E73]" />
                  )}
                  <input
                    type="text"
                    value={emailOrRoll}
                    onChange={(e) => setEmailOrRoll(e.target.value)}
                    placeholder={
                      loginAs === 'teacher' 
                        ? 'e.g. name@mituniversity.edu.in' 
                        : 'e.g. ADT23SOCB1502'
                    }
                    id="email-or-roll-input"
                    className="saas-input pl-9"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-1.5">
                  Secure Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E6E73]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    id="password-input"
                    className="saas-input pl-9 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    id="toggle-password-btn"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember checkbox */}
              <div className="flex items-center justify-between pt-1 select-none">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    id="remember-checkbox"
                    className="accent-[#0071E3] h-4 w-4 rounded border-[#D2D2D7] text-[#0071E3] focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-xs text-[#6E6E73]">Keep me signed in</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                id="login-submit-btn"
                className="w-full mt-2 saas-button-primary flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Prompt Default Credentials Help */}
            <div className="mt-6 border-t border-[#D2D2D7] pt-4 text-center">
              <span className="text-[9px] font-bold text-[#6E6E73] uppercase tracking-wider block">Demo Account Credentials:</span>
              {isAdminDetected ? (
                <code className="text-[#1D1D1F] text-[10px] font-mono mt-1.5 block bg-[#F5F5F7] py-1 rounded-md border border-[#D2D2D7]/50">
                  Password: Password123
                </code>
              ) : loginAs === 'teacher' ? (
                <div className="space-y-1 mt-1.5">
                  <code className="text-[#1D1D1F] text-[10px] font-mono block bg-[#F5F5F7] py-1 rounded-md border border-[#D2D2D7]/50 text-center">
                    jyoti.nandimath@mituniversity.edu.in
                  </code>
                  <span className="text-[9px] text-[#6E6E73] block">Password: Password123</span>
                </div>
              ) : (
                <div className="space-y-1 mt-1.5">
                  <code className="text-[#1D1D1F] text-[10px] font-mono block bg-[#F5F5F7] py-1 rounded-md border border-[#D2D2D7]/50 text-center">
                    Roll: ADT23SOCB1502
                  </code>
                  <span className="text-[9px] text-[#6E6E73] block">Password: Password123</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
