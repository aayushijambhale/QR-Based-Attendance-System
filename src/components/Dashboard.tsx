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

      {/* Bento Grid layout containing both numbers and controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="bento-grid-dashboard">
        {/* Bento Cell 1: Total Students (col-span-1) */}
        <div
          onClick={() => setActiveTab('students')}
          className="col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          id="bento-card-students"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest font-sans">
              Total Students
            </span>
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3.5xl font-black text-slate-800 tracking-tighter">
              {stats?.totalStudents ?? 0}
            </span>
            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded-lg select-none">
              +12%
            </span>
          </div>
        </div>

        {/* Bento Cell 2: Total Teachers (col-span-1) */}
        <div
          onClick={() => setActiveTab('teachers')}
          className="col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          id="bento-card-teachers"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest font-sans">
              Total Teachers
            </span>
            <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3.5xl font-black text-slate-800 tracking-tighter">
              {stats?.totalTeachers ?? 0}
            </span>
            <span className="text-slate-450 text-[10px] font-bold uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-lg select-none">
              Stable
            </span>
          </div>
        </div>

        {/* Bento Cell 3: Registered Subjects (col-span-1) */}
        <div
          onClick={() => setActiveTab('subjects')}
          className="col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          id="bento-card-subjects"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest font-sans">
              Registered Subjects
            </span>
            <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3.5xl font-black text-slate-800 tracking-tighter">
              {stats?.totalSubjects ?? 0}
            </span>
            <span className="text-indigo-500 text-[10px] font-bold uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded-lg select-none">
              Sem-II
            </span>
          </div>
        </div>

        {/* Bento Cell 4: Today's Scan Metrics (col-span-1) */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          id="bento-card-scan-today"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest font-sans">
              Today's Scan Volume
            </span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3.5xl font-black text-slate-800 tracking-tighter">
              {stats?.todayAttendanceCount ?? 0}
            </span>
            <span className="text-emerald-600 text-[10px] font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-lg select-none">
              {attendanceRate}% Present
            </span>
          </div>
        </div>

        {/* Bento Cell 5: Operational Active QR / Simulation Block (col-span-2) */}
        <div 
          className="col-span-1 md:col-span-2 bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-2xl border border-slate-850"
          id="bento-card-simulation-panel"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 select-none">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-indigo-500/30">
                  Active Simulator Feed
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] text-slate-500 font-mono font-medium tracking-wider">
                SERVER-AUTHORITATIVE
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Skip testing with physical device cameras. Emulate checking in as a student using any produced dynamic QR gate key in real-time.
            </p>

            {simulationStatus && (
              <div 
                id="simulation-alert-box"
                className={`p-3.5 rounded-xl text-xs mb-6 border animate-fade-in flex items-start gap-2.5 overflow-hidden font-semibold ${
                  simulationStatus.type === 'success' 
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />
                <span className="break-words w-full">{simulationStatus.message}</span>
              </div>
            )}

            {activeSessions.length === 0 ? (
              <div className="py-8 px-6 border border-dashed border-slate-800 rounded-2xl text-center bg-slate-950/30">
                <QrCode className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                <h4 className="text-xs font-bold text-slate-300">No Active Attendance QR Sessions</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1.5 mb-4 leading-relaxed font-semibold">
                  To trace attendance, generate a dynamic QR gate session under the QR Sessions tab.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('qr-sessions')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10 transition-colors"
                >
                  <span>Spawn QR Session</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSimulateScan} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Student */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">
                      1. Select Registered Student
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-semibold text-slate-200"
                    >
                      {studentsArray.map(std => (
                        <option key={std.id} value={std.id} className="bg-slate-950 text-slate-200">
                          {std.fullName} ({std.rollNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select active QR */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">
                      2. Active QR Code Session
                    </label>
                    <select
                      value={selectedSessionCode}
                      onChange={(e) => setSelectedSessionCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-semibold text-slate-200"
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
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl py-3 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>{simulating ? 'Processing Transaction...' : 'Simulate Scanning Active QR Code'}</span>
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 select-none">
            <span>Scan transactions follow server-authoritative timestamps</span>
            <span className="font-mono">Refreshes dynamically every 10s</span>
          </div>
        </div>

        {/* Bento Cell 6: Live Activity log feed (col-span-2) */}
        <div 
          className="col-span-1 md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
          id="bento-card-activity-log"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-md font-bold text-slate-800">Dynamic Activity Stream</h3>
              <button 
                onClick={() => setActiveTab('attendance')}
                className="text-indigo-600 text-xs font-bold hover:underline"
              >
                View All
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 font-semibold">
              Live roster records updated instantly as checks occur.
            </p>

            {recentAttendance.length === 0 ? (
              <div className="py-12 text-center text-slate-300">
                <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <span className="text-xs font-bold">No entries recorded today</span>
              </div>
            ) : (
              <div className="space-y-3" id="dashboard-recent-feed">
                {recentAttendance.slice(0, 4).map((log) => {
                  const statusColors = {
                    Present: 'bg-emerald-50 border-emerald-100 text-emerald-800',
                    Late: 'bg-amber-50 border-amber-100 text-amber-800',
                    Absent: 'bg-red-50 border-red-100 text-red-800',
                  };
                  return (
                    <div 
                      key={log.id} 
                      className="p-3 bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 transition-all text-left rounded-xl"
                    >
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate">{log.studentName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">
                          {log.subjectName} &bull; <span className="font-mono font-medium text-slate-400">ROLL: {log.rollNumber}</span>
                        </p>
                        <span className="text-[9px] text-slate-450 font-mono block mt-1">
                          Checked-In: {log.date} at {log.time}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusColors[log.status] || 'bg-slate-50'}`}>
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
              className="w-full mt-4 text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-all block cursor-pointer"
            >
              Examine full cumulative audit logs &rarr;
            </button>
          )}
        </div>

        {/* Bento Cell 7: Total QR Sessions (col-span-1) */}
        <div
          onClick={() => setActiveTab('qr-sessions')}
          className="col-span-1 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          id="bento-card-qr-sessions"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest font-sans">
              Dynamic QR Gates
            </span>
            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <QrCode className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3.5xl font-black text-slate-800 tracking-tighter">
              {stats?.totalSessions ?? 0}
            </span>
            <span className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded-lg select-none">
              Publish QR
            </span>
          </div>
        </div>

        {/* Bento Cell 8: Quick Actions Center (col-span-3) */}
        <div 
          className="col-span-1 md:col-span-2 lg:col-span-3 bg-indigo-50 border border-indigo-100/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300"
          id="bento-card-quick-actions"
        >
          <div>
            <h3 className="text-indigo-950 text-md font-extrabold mb-1">Quick Management Directory</h3>
            <p className="text-[11px] text-indigo-700/80 mb-5 font-semibold leading-relaxed">
              Banish deep menu scouring. Access critical portal registration and telemetry export shortcuts in one single click.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button 
              onClick={() => setActiveTab('students')}
              className="flex flex-col items-center justify-center p-4 bg-white border border-indigo-100 rounded-2xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all group cursor-pointer shadow-sm hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center mb-2.5 group-hover:bg-indigo-500">
                <Users className="w-4 h-4 text-indigo-600 group-hover:text-white" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest">New Student</span>
            </button>

            <button 
              onClick={() => setActiveTab('qr-sessions')}
              className="flex flex-col items-center justify-center p-4 bg-white border border-indigo-100 rounded-2xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all group cursor-pointer shadow-sm hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center mb-2.5 group-hover:bg-indigo-500">
                <QrCode className="w-4 h-4 text-indigo-600 group-hover:text-white" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest">Publish QR Code</span>
            </button>

            <button 
              onClick={() => setActiveTab('reports')}
              className="flex flex-col items-center justify-center p-4 bg-white border border-indigo-100 rounded-2xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all group cursor-pointer shadow-sm hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center mb-2.5 group-hover:bg-indigo-500">
                <BookOpen className="w-4 h-4 text-indigo-600 group-hover:text-white" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest">Analytical Exports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
