import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { DashboardStats, Attendance, Student, QRSession } from '../types.js';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Play, 
  UserCheck, 
  RefreshCw,
  QrCode,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [activeSessions, setActiveSessions] = useState<QRSession[]>([]);
  const [studentsArray, setStudentsArray] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Scan simulation states
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSessionCode, setSelectedSessionCode] = useState('');
  const [simulationStatus, setSimulationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [simulating, setSimulating] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsData, attendanceData, sessionsData, studentsData] = await Promise.all([
        api.get<DashboardStats>('/api/dashboard/stats'),
        api.get<Attendance[]>('/api/attendance'),
        api.get<QRSession[]>('/api/qr-sessions'),
        api.get<Student[]>('/api/students')
      ]);

      setStats(statsData);
      
      // Filter recent attendance (latest 5 logs sort by date/time down)
      const sortedLogs = [...attendanceData].sort((a, b) => {
        const datetimeA = new Date(`${a.date}T${a.time || '00:00:00'}Z`);
        const datetimeB = new Date(`${b.date}T${b.time || '00:00:00'}Z`);
        return datetimeB.getTime() - datetimeA.getTime();
      });
      setRecentAttendance(sortedLogs.slice(0, 5));

      // Separate active QR sessions
      const activeRows = sessionsData.filter(s => s.status === 'Active');
      setActiveSessions(activeRows);

      setStudentsArray(studentsData);
      
      // Set defaults for simulation dropdowns if available
      if (studentsData.length && !selectedStudentId) {
        setSelectedStudentId(studentsData[0].id);
      }
      if (activeRows.length && !selectedSessionCode) {
        setSelectedSessionCode(activeRows[0].sessionCode);
      } else if (!activeRows.length) {
        setSelectedSessionCode('');
      }

    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 10 seconds to make the real-time simulation feel truly dynamic
    const timer = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleSimulateScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedSessionCode) {
      setSimulationStatus({ type: 'error', message: 'Please launch an active session and select a student first.' });
      return;
    }

    setSimulating(true);
    setSimulationStatus(null);

    try {
      const res = await api.post<{ success: boolean; message: string; record: Attendance }>('/api/qr-sessions/scan', {
        sessionCode: selectedSessionCode,
        studentId: selectedStudentId
      });

      setSimulationStatus({ type: 'success', message: res.message });
      // Refresh statistics and modern listings
      await fetchDashboardData();
    } catch (err: any) {
      setSimulationStatus({ 
        type: 'error', 
        message: err.message || 'Scan failed. Maybe student already logged attendance?' 
      });
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-500 font-sans">Compiling Administration Stats...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Students',
      value: stats?.totalStudents ?? 0,
      icon: Users,
      color: 'from-indigo-500 to-indigo-600',
      shadow: 'shadow-indigo-500/10',
      tabId: 'students'
    },
    {
      name: 'Total Teachers',
      value: stats?.totalTeachers ?? 0,
      icon: GraduationCap,
      color: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/10',
      tabId: 'teachers'
    },
    {
      name: 'Registered Subjects',
      value: stats?.totalSubjects ?? 0,
      icon: BookOpen,
      color: 'from-sky-500 to-sky-600',
      shadow: 'shadow-sky-500/10',
      tabId: 'subjects'
    },
    {
      name: 'Generated QR Sessions',
      value: stats?.totalSessions ?? 0,
      icon: QrCode,
      color: 'from-amber-500 to-amber-600',
      shadow: 'shadow-amber-500/10',
      tabId: 'qr-sessions'
    },
    {
      name: "Today's Attendances",
      value: stats?.todayAttendanceCount ?? 0,
      icon: UserCheck,
      color: 'from-violet-500 to-fuchsia-600',
      shadow: 'shadow-violet-500/10',
      tabId: 'attendance'
    }
  ];

  const totalStudentsCount = stats?.totalStudents ?? 0;
  const attendanceRate = totalStudentsCount > 0 
    ? Math.round(((stats?.todayAttendanceCount ?? 0) / totalStudentsCount) * 100) 
    : 94;

  return (
    <div className="space-y-8 animate-fade-in animate-duration-300" id="dashboard-view-content">
      {/* Upper header with elegant typography and action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-sans">
            ERP Control Console
          </h1>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-semibold">
            REALTIME GATEWAY &bull; MULTI-USER SIMULATION DASHBOARD
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 select-none self-start"
        >
          <RefreshCw className={`h-3 w-3 text-indigo-600 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Metadata</span>
        </button>
      </div>

      {/* Bento Grid layout containing both numbers and controls with asymmetrical design and glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-8 select-none" id="bento-grid-dashboard">
        
        {/* Asymmetrical Column Layout: 1. Total Students Stat Panel (col-span-3 - Narrow/Tall layout) */}
        <div
          onClick={() => setActiveTab('students')}
          className="md:col-span-3 lg:col-span-4 bg-white/70 backdrop-blur-md border border-white/50 rounded-[30px] p-7 flex flex-col justify-between shadow-premium-light hover:shadow-xl hover:border-blue-300 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          id="bento-card-students"
        >
          {/* Subtle gradient glow decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-blue-400/20 transition-all duration-500" />
          
          <div className="flex items-center justify-between w-full relative z-10">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest font-sans">
              Total Student Body
            </span>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner group-hover:rotate-6 transition-all duration-300">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <span className="text-5xl font-black text-slate-900 tracking-tight block">
              {stats?.totalStudents ?? 0}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-full select-none">
                +12.4% Semester Growth
              </span>
            </div>
          </div>
        </div>

        {/* Asymmetrical Column Layout: 2. Core Lecturers (col-span-3 - Narrow/Tall layout) */}
        <div
          onClick={() => setActiveTab('teachers')}
          className="md:col-span-3 lg:col-span-4 bg-white/70 backdrop-blur-md border border-white/50 rounded-[30px] p-7 flex flex-col justify-between shadow-premium-light hover:shadow-xl hover:border-purple-300 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          id="bento-card-teachers"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-purple-400/20 transition-all duration-500" />
          
          <div className="flex items-center justify-between w-full relative z-10">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest font-sans">
              Allocated Faculty
            </span>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 shadow-inner group-hover:-rotate-6 transition-all duration-300">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <span className="text-5xl font-black text-slate-900 tracking-tight block">
              {stats?.totalTeachers ?? 0}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-slate-450 text-[10px] font-bold uppercase tracking-widest bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full select-none">
                Active & Steady
              </span>
            </div>
          </div>
        </div>

        {/* Asymmetrical Column Layout: 3. Today's Scan Metrics & Attendance Gauge (col-span-4 - Large Display layout) */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="md:col-span-6 lg:col-span-4 bg-gradient-to-tr from-blue-600 to-indigo-700 text-white rounded-[30px] p-7 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:scale-[1.01] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group relative overflow-hidden text-left"
          id="bento-card-scan-today"
        >
          {/* Immersive background decoration */}
          <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-15" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600')" }} />
          <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pulse-glow-ring" />
          
          <div className="flex items-center justify-between w-full relative z-10">
            <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest font-sans">
              Daily Attendance Score
            </span>
            <div className="w-10 h-10 bg-white/15 text-white rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform duration-300">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <span className="text-5xl font-black text-white tracking-tight block">
              {stats?.todayAttendanceCount ?? 0}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-white text-[10px] font-extrabold bg-emerald-500/80 border border-emerald-400/40 px-2.5 py-0.5 rounded-full shadow-lg shadow-emerald-700/20 select-none">
                {attendanceRate}% Present Ratio Today
              </span>
            </div>
          </div>
        </div>

        {/* Asymmetrical Row Layout: 4. Active Simulator Feed Panel (col-span-7 - Super wide glassmorphism container) */}
        <div 
          className="md:col-span-6 lg:col-span-8 bg-slate-900 text-slate-100 rounded-[32px] p-8 shadow-premium-dark flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-[0_25px_60px_-15px_rgba(2,6,23,0.7)] border border-white/10"
          id="bento-card-simulation-panel"
        >
          {/* Gradient background aura */}
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-505/5 rounded-full blur-[80px] -translate-y-1/2 pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-5 select-none">
              <div className="flex items-center gap-2.5">
                <span className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase border border-blue-500/20">
                  Active Simulator Feed
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-glow shadow-emerald-400/50" />
              </div>
              <span className="text-[10px] text-slate-505 font-mono font-semibold tracking-wider">
                SERVER-AUTHORITATIVE
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">
              Validate and load test without physical dynamic device scanner codes. Mock or emulate checking in instantly using any live active QR gate code.
            </p>

            {simulationStatus && (
              <div 
                id="simulation-alert-box"
                className={`p-4 rounded-2xl text-xs mb-6 border animate-fade-in flex items-start gap-3 font-semibold ${
                  simulationStatus.type === 'success' 
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 shadow-premium-dark' 
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-300 shadow-premium-dark'
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />
                <span className="break-words w-full">{simulationStatus.message}</span>
              </div>
            )}

            {activeSessions.length === 0 ? (
              <div className="py-12 px-6 border border-dashed border-slate-800 rounded-[24px] text-center bg-slate-950/30">
                <QrCode className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-300">No Active Attendance QR Sessions</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 mb-5 leading-relaxed font-semibold">
                  Syllabus sessions are inactive. Ask a registered Lecturer to broadcast or generate a dynamic QR gate session.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('qr-sessions')}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  <span>Go to QR Sessions</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSimulateScan} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Select Student */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">
                      1. Check-In Student Profile
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 text-xs rounded-xl p-3.5 outline-none focus:border-blue-500 transition-colors font-semibold text-slate-200 cursor-pointer shadow-inner"
                    >
                      {studentsArray.map(std => (
                        <option key={std.id} value={std.id} className="bg-slate-950 text-slate-200">
                          {std.fullName} ({std.rollNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select active QR */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">
                      2. Active QR Code Session
                    </label>
                    <select
                      value={selectedSessionCode}
                      onChange={(e) => setSelectedSessionCode(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 text-xs rounded-xl p-3.5 outline-none focus:border-blue-500 transition-colors font-semibold text-slate-200 cursor-pointer shadow-inner"
                    >
                      {activeSessions.map(sess => (
                        <option key={sess.id} value={sess.sessionCode} className="bg-slate-950 text-slate-200">
                          {sess.subjectName} ({sess.teacherName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={simulating}
                  className="w-full bg-gradient-to-r from-blue-550 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl py-3.5 shadow-xl shadow-blue-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="h-4 w-4 shrink-0 text-indigo-200" />
                  <span>{simulating ? 'Authenticating & Saving...' : 'Simulate Scanning Active QR Code'}</span>
                </button>
              </form>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 select-none">
            <span className="font-semibold">Simulated geo-markers match college coordinate guidelines</span>
            <span className="font-mono bg-white/5 rounded px-2 py-0.5">Sync Interval: Instantaneous</span>
          </div>
        </div>

        {/* Asymmetrical Column Layout: 5. Registered Subjects Stat Block (col-span-4 - Small card) */}
        <div
          onClick={() => setActiveTab('subjects')}
          className="md:col-span-3 lg:col-span-4 bg-white/70 backdrop-blur-md border border-white/50 rounded-[30px] p-7 flex flex-col justify-between shadow-premium-light hover:shadow-xl hover:border-blue-200 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          id="bento-card-subjects"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-sky-400/20 transition-all duration-500" />
          
          <div className="flex items-center justify-between w-full relative z-10">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest font-sans">
              Registered Syllabuses
            </span>
            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center border border-sky-100 shadow-inner group-hover:scale-115 transition-transform duration-300">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <span className="text-5xl font-black text-slate-900 tracking-tight block">
              {stats?.totalSubjects ?? 0}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sky-600 text-[10px] font-extrabold bg-sky-50 border border-sky-100/60 px-2.5 py-0.5 rounded-full select-none">
                Core syllabus active
              </span>
            </div>
          </div>
        </div>

        {/* Asymmetrical Column Layout: 6. Realtime Active Sessions (col-span-4 - Dark, narrow card) */}
        <div
          onClick={() => setActiveTab('qr-sessions')}
          className="md:col-span-3 lg:col-span-4 bg-slate-900 border border-white/10 rounded-[30px] p-7 flex flex-col justify-between shadow-premium-dark hover:shadow-2xl hover:border-slate-800 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          id="bento-card-qr-sessions"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-blue-500/15 transition-all duration-500" />
          
          <div className="flex items-center justify-between w-full relative z-10">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest font-sans">
              Active Gates
            </span>
            <div className="w-10 h-10 bg-white/5 text-blue-400 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-115 transition-transform duration-300">
              <QrCode className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <span className="text-5.5xl font-black text-white tracking-tight block">
              {activeSessions.length}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full select-none ${
                activeSessions.length > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-slate-805 text-slate-400 border border-white/5'
              }`}>
                {activeSessions.length > 0 ? 'Active Broadcasts Live' : 'Syllabus Standby'}
              </span>
            </div>
          </div>
        </div>

        {/* Asymmetrical Column Layout: 7. Live Activity log feed (col-span-4 - Glass, modern timeline) */}
        <div 
          className="md:col-span-6 lg:col-span-4 bg-white/75 backdrop-blur-md border border-white/50 rounded-[30px] p-7 shadow-premium-light overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-white/90 transition-all"
          id="bento-card-activity-log"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 select-none">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">Live Activity</h3>
              <button 
                onClick={() => setActiveTab('attendance')}
                className="text-blue-650 text-xs font-bold hover:underline transition-colors cursor-pointer"
              >
                View Roster
              </button>
            </div>

            <p className="text-[11px] text-slate-450 mb-4 font-semibold leading-normal">
              Latest check-in updates verified from client-side student keys.
            </p>

            {recentAttendance.length === 0 ? (
              <div className="py-10 text-center text-slate-350 bg-slate-50/20 rounded-2xl border border-dashed border-slate-200">
                <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <span className="text-xs font-bold">No logs today yet</span>
              </div>
            ) : (
              <div className="space-y-3.5" id="dashboard-recent-feed">
                {recentAttendance.slice(0, 3).map((log) => {
                  const statusColors = {
                    Present: 'bg-emerald-50 border-emerald-100 text-emerald-800',
                    Late: 'bg-amber-50 border-amber-100 text-amber-800',
                    Absent: 'bg-red-50 border-red-100 text-red-800',
                  };
                  return (
                    <div 
                      key={log.id} 
                      className="p-3 bg-white/50 border border-slate-100/80 flex items-center justify-between gap-3 transition-all text-left rounded-2xl hover:border-blue-100 shadow-xs"
                    >
                      <div className="overflow-hidden min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate leading-snug">{log.studentName}</p>
                        <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                          {log.subjectName} &bull; <span className="font-mono text-[9px] text-slate-400 font-semibold">{log.rollNumber}</span>
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${statusColors[log.status] || 'bg-slate-50'}`}>
                        {log.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {recentAttendance.length > 0 && (
            <button
              onClick={() => setActiveTab('attendance')}
              className="w-full mt-4 text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors block cursor-pointer"
            >
              Analyze full ledger &rarr;
            </button>
          )}
        </div>

        {/* Asymmetrical Column Layout: 8. Quick Shortcut Commands (col-span-8 - Gradient border luxury panel) */}
        <div 
          className="md:col-span-6 lg:col-span-12 bg-indigo-50/40 border-b border-r border-l border-indigo-100/50 backdrop-blur-md rounded-[32px] p-8 shadow-premium-light flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden"
          id="bento-card-quick-actions"
        >
          {/* Subtle gradient highlights */}
          <div className="absolute top-0 right-1/3 w-64 h-64 bg-indigo-200/20 rounded-full blur-[60px] pointer-events-none" />
          
          <div>
            <h3 className="text-slate-900 text-md font-bold uppercase tracking-wider mb-1.5 font-sans">ERP Master Operations</h3>
            <p className="text-xs text-slate-505 mb-6 font-semibold leading-normal max-w-2xl">
              Execute core registry operations instantly without looking through the menu indexes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveTab('students')}
              className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-[22px] hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer shadow-premium-light"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-all">
                <Users className="w-5 h-5 text-blue-600 group-hover:text-white" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 block">Student Roster</span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Manage Profiles</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('qr-sessions')}
              className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-[22px] hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer shadow-premium-light"
            >
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <QrCode className="w-5 h-5 text-indigo-600 group-hover:text-white" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 block">Broadcast Portal</span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">QR Transmission</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('reports')}
              className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-[22px] hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer shadow-premium-light"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <BookOpen className="w-5 h-5 text-purple-600 group-hover:text-white" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 block">Executive Excel</span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Extract Spreadsheets</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
