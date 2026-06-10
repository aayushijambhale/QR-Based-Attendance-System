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
    <div className="space-y-6 animate-fade-in animate-duration-300" id="dashboard-view-content">
      {/* Upper header with elegant typography and action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#134E4A] tracking-tight font-sans">
            ERP Control Console
          </h1>
          <p className="text-[#64748B] text-xs mt-1 uppercase tracking-wider font-semibold">
            REALTIME GATEWAY &bull; MULTI-USER SIMULATION DASHBOARD
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="saas-button-secondary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 text-[#0F766E] ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Metadata</span>
        </button>
      </div>

      {/* Grid layout containing stats and controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 select-none" id="bento-grid-dashboard">
        
        {/* Total Students Stat Panel */}
        <div
          onClick={() => setActiveTab('students')}
          className="saas-card p-6 flex flex-col justify-between saas-card-hover cursor-pointer"
          id="bento-card-students"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[#64748B] text-[13px] font-medium font-sans">
              Total Students
            </span>
            <div className="flex items-center gap-2">
              <span className="saas-pill-success">+12%</span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-4xl font-bold text-[#134E4A] tracking-tight block">
              {stats?.totalStudents ?? 0}
            </span>
            <div className="w-10 h-10 border border-[#F1F5F9] rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-[#14B8A6]" />
            </div>
          </div>
        </div>

        {/* Core Lecturers */}
        <div
          onClick={() => setActiveTab('teachers')}
          className="saas-card p-6 flex flex-col justify-between saas-card-hover cursor-pointer"
          id="bento-card-teachers"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[#64748B] text-[13px] font-medium font-sans">
              Allocated Faculty
            </span>
            <div className="flex items-center gap-2">
              <span className="saas-pill-success">+5%</span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-4xl font-bold text-[#134E4A] tracking-tight block">
              {stats?.totalTeachers ?? 0}
            </span>
            <div className="w-10 h-10 border border-[#F1F5F9] rounded-full flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-[#0F766E]" />
            </div>
          </div>
        </div>

        {/* Registered Subjects Stat Block */}
        <div
          onClick={() => setActiveTab('subjects')}
          className="saas-card p-6 flex flex-col justify-between saas-card-hover cursor-pointer"
          id="bento-card-subjects"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[#64748B] text-[13px] font-medium font-sans">
              Registered Syllabuses
            </span>
            <div className="flex items-center gap-2">
              <span className="saas-pill-success">+2%</span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-4xl font-bold text-[#134E4A] tracking-tight block">
              {stats?.totalSubjects ?? 0}
            </span>
            <div className="w-10 h-10 border border-[#F1F5F9] rounded-full flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-[#0F766E]" />
            </div>
          </div>
        </div>

        {/* Today's Scan Metrics */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="saas-card p-6 flex flex-col justify-between saas-card-hover cursor-pointer bg-[#F8FAFC]"
          id="bento-card-scan-today"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[#64748B] text-[13px] font-medium font-sans">
              Today's Attendance
            </span>
            <div className="flex items-center gap-2">
              <span className="saas-pill-success">Live</span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-4xl font-bold text-[#134E4A] tracking-tight block">
              {stats?.todayAttendanceCount ?? 0}
            </span>
            <div className="w-10 h-10 border border-[#E2E8F0] rounded-full flex items-center justify-center bg-white">
              <UserCheck className="h-5 w-5 text-[#14B8A6]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Simulator Feed Panel */}
        <div 
          className="lg:col-span-2 saas-card p-8 flex flex-col justify-between relative overflow-hidden"
          id="bento-card-simulation-panel"
        >
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 mb-5 select-none">
              <div className="flex items-center gap-2">
                <span className="text-[#0F766E] text-sm font-semibold uppercase">
                  Active Simulator Feed
                </span>
                <span className="h-2 w-2 rounded-full bg-[#14B8A6] animate-pulse" />
              </div>
              <span className="text-xs text-[#64748B] font-mono font-semibold tracking-wider">
                SERVER-AUTHORITATIVE
              </span>
            </div>

            <p className="text-sm text-[#64748B] mb-6">
              Validate and load test without physical dynamic device scanner codes. Mock or emulate checking in instantly using any live active QR gate code.
            </p>

            {simulationStatus && (
              <div 
                id="simulation-alert-box"
                className={`p-4 rounded-md text-sm mb-6 border flex items-start gap-3 font-medium ${
                  simulationStatus.type === 'success' 
                    ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#166534]' 
                    : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
                }`}
              >
                <Sparkles className="h-5 w-5 shrink-0" />
                <span className="break-words w-full">{simulationStatus.message}</span>
              </div>
            )}

            {activeSessions.length === 0 ? (
              <div className="py-12 px-6 border border-dashed border-[#E2E8F0] rounded-lg text-center bg-[#FFFBF5]">
                <QrCode className="h-10 w-10 text-[#64748B] mx-auto mb-3" />
                <h4 className="text-base font-semibold text-[#134E4A]">No Active Attendance QR Sessions</h4>
                <p className="text-sm text-[#64748B] max-w-sm mx-auto mt-2 mb-5">
                  Syllabus sessions are inactive. Ask a registered Lecturer to broadcast or generate a dynamic QR gate session.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('qr-sessions')}
                  className="saas-button-primary inline-flex items-center gap-2"
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
                    <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider">
                      1. Check-In Student Profile
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="saas-input"
                    >
                      {studentsArray.map(std => (
                        <option key={std.id} value={std.id}>
                          {std.fullName} ({std.rollNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select active QR */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider">
                      2. Active QR Code Session
                    </label>
                    <select
                      value={selectedSessionCode}
                      onChange={(e) => setSelectedSessionCode(e.target.value)}
                      className="saas-input"
                    >
                      {activeSessions.map(sess => (
                        <option key={sess.id} value={sess.sessionCode}>
                          {sess.subjectName} ({sess.teacherName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={simulating}
                  className="w-full saas-button-primary flex items-center justify-center gap-2 py-3"
                >
                  <Play className="h-4 w-4 shrink-0" />
                  <span>{simulating ? 'Authenticating & Saving...' : 'Simulate Scanning Active QR Code'}</span>
                </button>
              </form>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748B]">
            <span>Simulated geo-markers match college coordinate guidelines</span>
            <span className="font-mono bg-[#FFFBF5] border border-[#E2E8F0] rounded px-2 py-1">Sync Interval: Instantaneous</span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Realtime Active Sessions */}
          <div
            onClick={() => setActiveTab('qr-sessions')}
            className="saas-card p-6 flex flex-col justify-between saas-card-hover cursor-pointer"
            id="bento-card-qr-sessions"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider font-sans">
                Active Gates
              </span>
              <div className="w-10 h-10 bg-[#EAF5F5] text-[#14B8A6] rounded-md flex items-center justify-center">
                <QrCode className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold text-[#134E4A] tracking-tight block">
                {activeSessions.length}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium ${
                  activeSessions.length > 0 ? 'text-[#0F766E]' : 'text-[#64748B]'
                }`}>
                  {activeSessions.length > 0 ? 'Active Broadcasts Live' : 'Syllabus Standby'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Activity log feed */}
          <div 
            className="saas-card p-6 flex flex-col justify-between"
            id="bento-card-activity-log"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 mb-4 select-none">
                <h3 className="text-sm font-semibold text-[#134E4A] uppercase tracking-wider font-sans">Live Activity</h3>
                <button 
                  onClick={() => setActiveTab('attendance')}
                  className="text-[#0F766E] text-xs font-medium hover:underline cursor-pointer"
                >
                  View Roster
                </button>
              </div>

              {recentAttendance.length === 0 ? (
                <div className="py-8 text-center text-[#64748B] bg-[#FFFBF5] rounded-lg border border-dashed border-[#E2E8F0]">
                  <Users className="h-6 w-6 mx-auto mb-2 text-[#64748B]" />
                  <span className="text-xs font-medium">No logs today yet</span>
                </div>
              ) : (
                <div className="space-y-3" id="dashboard-recent-feed">
                  {recentAttendance.slice(0, 3).map((log) => {
                    const statusColors: any = {
                      Present: 'saas-pill-success',
                      Late: 'saas-pill-warning',
                      Absent: 'saas-pill-error',
                    };
                    return (
                      <div 
                        key={log.id} 
                        className="p-3 bg-[#F8FAFC] flex items-center justify-between gap-3 rounded-xl hover:bg-[#F1F5F9] transition-colors"
                      >
                        <div className="overflow-hidden min-w-0">
                          <p className="text-sm font-bold text-[#134E4A] truncate">{log.studentName}</p>
                          <p className="text-xs text-[#64748B] truncate mt-0.5">
                            {log.subjectName} &bull; <span className="font-mono">{log.rollNumber}</span>
                          </p>
                        </div>
                        <span className={`${statusColors[log.status] || 'saas-pill-warning'} shrink-0`}>
                          {log.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
