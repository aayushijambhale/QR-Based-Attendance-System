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
      <div className="flex h-[60vh] items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-[#0071E3] animate-spin mx-auto mb-4" />
          <p className="text-xs font-semibold text-[#6E6E73] font-mono uppercase tracking-wider">Compiling dashboard analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-view-content">
      {/* Upper header with elegant typography and action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight font-sans">
            ERP Control Console
          </h1>
          <p className="text-[#6E6E73] text-[10px] mt-1 uppercase tracking-wider font-bold">
            Realtime Gateway &bull; Multi-User Simulation Dashboard
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="saas-button-secondary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 text-[#0071E3] ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Console</span>
        </button>
      </div>

      {/* Grid layout containing stats and controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 select-none" id="bento-grid-dashboard">
        
        {/* Total Students Stat Panel */}
        <div
          onClick={() => setActiveTab('students')}
          className="saas-card p-5 flex flex-col justify-between saas-card-hover cursor-pointer"
          id="bento-card-students"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[#6E6E73] text-[11px] font-bold uppercase tracking-wider font-sans">
              Total Students
            </span>
            <span className="saas-pill-success">+12%</span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-3xl font-bold text-[#1D1D1F] tracking-tight block">
              {stats?.totalStudents ?? 0}
            </span>
            <div className="w-8 h-8 bg-[#E8F2FF] rounded-full flex items-center justify-center">
              <Users className="h-4.5 w-4.5 text-[#0071E3]" />
            </div>
          </div>
        </div>

        {/* Core Lecturers */}
        <div
          onClick={() => setActiveTab('teachers')}
          className="saas-card p-5 flex flex-col justify-between saas-card-hover cursor-pointer"
          id="bento-card-teachers"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[#6E6E73] text-[11px] font-bold uppercase tracking-wider font-sans">
              Allocated Faculty
            </span>
            <span className="saas-pill-success">+5%</span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-3xl font-bold text-[#1D1D1F] tracking-tight block">
              {stats?.totalTeachers ?? 0}
            </span>
            <div className="w-8 h-8 bg-[#E8F2FF] rounded-full flex items-center justify-center">
              <GraduationCap className="h-4.5 w-4.5 text-[#0071E3]" />
            </div>
          </div>
        </div>

        {/* Registered Subjects Stat Block */}
        <div
          onClick={() => setActiveTab('subjects')}
          className="saas-card p-5 flex flex-col justify-between saas-card-hover cursor-pointer"
          id="bento-card-subjects"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[#6E6E73] text-[11px] font-bold uppercase tracking-wider font-sans">
              Active Programs
            </span>
            <span className="saas-pill-success">+2%</span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-3xl font-bold text-[#1D1D1F] tracking-tight block">
              {stats?.totalSubjects ?? 0}
            </span>
            <div className="w-8 h-8 bg-[#E8F2FF] rounded-full flex items-center justify-center">
              <BookOpen className="h-4.5 w-4.5 text-[#0071E3]" />
            </div>
          </div>
        </div>

        {/* Today's Scan Metrics */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="saas-card p-5 flex flex-col justify-between saas-card-hover cursor-pointer bg-[#F8F9FA]"
          id="bento-card-scan-today"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[#6E6E73] text-[11px] font-bold uppercase tracking-wider font-sans">
              Today's Attendance
            </span>
            <span className="saas-pill-success">Live</span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-3xl font-bold text-[#1D1D1F] tracking-tight block">
              {stats?.todayAttendanceCount ?? 0}
            </span>
            <div className="w-8 h-8 bg-white border border-[#D2D2D7] rounded-full flex items-center justify-center">
              <UserCheck className="h-4.5 w-4.5 text-[#34C759]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Simulator Feed Panel */}
        <div 
          className="lg:col-span-2 saas-card p-6 flex flex-col justify-between relative overflow-hidden"
          id="bento-card-simulation-panel"
        >
          <div>
            <div className="flex items-center justify-between border-b border-[#D2D2D7] pb-3.5 mb-5 select-none">
              <div className="flex items-center gap-2">
                <span className="text-[#0071E3] text-[11px] font-bold uppercase tracking-wider">
                  Active Simulator Feed
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#34C759] animate-pulse" />
              </div>
              <span className="text-[9px] text-[#6E6E73] font-mono font-bold tracking-wider">
                SERVER-AUTHORITATIVE
              </span>
            </div>

            <p className="text-xs text-[#6E6E73] mb-6">
              Validate and load test attendance checking records without physical device scanner hardware. Emulate checking in instantly using any live, active QR gate code.
            </p>

            {simulationStatus && (
              <div 
                id="simulation-alert-box"
                className={`p-3.5 rounded-xl text-xs mb-6 border flex items-start gap-2.5 font-medium transition-all ${
                  simulationStatus.type === 'success' 
                    ? 'bg-[#EAFBEF] border-[#34C759]/20 text-[#34C759]' 
                    : 'bg-[#FDF2F2] border-[#FF3B30]/20 text-[#FF3B30]'
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="break-words w-full">{simulationStatus.message}</span>
              </div>
            )}

            {activeSessions.length === 0 ? (
              <div className="py-10 px-5 border border-dashed border-[#D2D2D7] rounded-2xl text-center bg-[#F8F9FA]">
                <QrCode className="h-8 w-8 text-[#6E6E73] mx-auto mb-3" />
                <h4 className="text-sm font-bold text-[#1D1D1F]">No Active Attendance QR Sessions</h4>
                <p className="text-xs text-[#6E6E73] max-w-sm mx-auto mt-1 mb-5">
                  Dynamic gates are currently closed. Broadcast a QR session from a Lecturer profile to simulate scans.
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
              <form onSubmit={handleSimulateScan} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Student */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider">
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
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider">
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
                  className="w-full saas-button-primary flex items-center justify-center gap-2 py-2.5 mt-2 cursor-pointer"
                >
                  <Play className="h-4 w-4 shrink-0" />
                  <span>{simulating ? 'Checking in...' : 'Simulate Scanning Active QR Code'}</span>
                </button>
              </form>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-[#D2D2D7] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#6E6E73] select-none">
            <span>Simulated geo-location coordinates match campus guidelines</span>
            <span className="font-mono bg-[#F5F5F7] border border-[#D2D2D7] rounded px-2 py-0.5">Sync: Realtime</span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Realtime Active Sessions */}
          <div
            onClick={() => setActiveTab('qr-sessions')}
            className="saas-card p-5 flex flex-col justify-between saas-card-hover cursor-pointer"
            id="bento-card-qr-sessions"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[#6E6E73] text-[11px] font-bold uppercase tracking-wider font-sans">
                Active Gates
              </span>
              <div className="w-8 h-8 bg-[#E8F2FF] text-[#0071E3] rounded-full flex items-center justify-center">
                <QrCode className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-[#1D1D1F] tracking-tight block">
                {activeSessions.length}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] font-bold uppercase ${
                  activeSessions.length > 0 ? 'text-[#34C759]' : 'text-[#6E6E73]'
                }`}>
                  {activeSessions.length > 0 ? 'Active Broadcasts Live' : 'Syllabus Standby'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Activity log feed */}
          <div 
            className="saas-card p-5 flex flex-col justify-between"
            id="bento-card-activity-log"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#D2D2D7] pb-3 mb-3 select-none">
                <h3 className="text-[11px] font-bold text-[#1D1D1F] uppercase tracking-wider font-sans">Live Activity</h3>
                <button 
                  onClick={() => setActiveTab('attendance')}
                  className="text-[#0071E3] text-[11px] font-bold hover:underline cursor-pointer"
                >
                  View Roster
                </button>
              </div>

              {recentAttendance.length === 0 ? (
                <div className="py-8 text-center text-[#6E6E73] bg-[#F8F9FA] rounded-xl border border-dashed border-[#D2D2D7]">
                  <Users className="h-5 w-5 mx-auto mb-2 text-[#6E6E73]" />
                  <span className="text-xs">No logs today yet</span>
                </div>
              ) : (
                <div className="space-y-2.5" id="dashboard-recent-feed">
                  {recentAttendance.slice(0, 3).map((log) => {
                    const statusColors: any = {
                      Present: 'saas-pill-success',
                      Late: 'saas-pill-warning',
                      Absent: 'saas-pill-error',
                    };
                    return (
                      <div 
                        key={log.id} 
                        className="p-2.5 bg-[#F8F9FA] border border-[#D2D2D7]/50 flex items-center justify-between gap-3 rounded-xl hover:bg-[#F5F5F7] transition-all"
                      >
                        <div className="overflow-hidden min-w-0">
                          <p className="text-xs font-bold text-[#1D1D1F] truncate">{log.studentName}</p>
                          <p className="text-[10px] text-[#6E6E73] truncate mt-0.5">
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
