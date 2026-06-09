import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../utils/api.js';
import { 
  Award, 
  BookOpen, 
  CheckCircle,
  AlertTriangle,
  Clock, 
  Calendar,
  Loader2, 
  Flame,
  QrCode,
  RefreshCw
} from 'lucide-react';

interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  attended: number;
  total: number;
  percentage: number;
}

interface AnalyticsData {
  present: number;
  late: number;
  absent: number;
  overallPercentage: number;
  totalClassesCount: number;
  totalAttendedCount: number;
  subjectBreakdown: SubjectAnalytics[];
}

interface RecentCheckIn {
  id: string;
  subjectName: string;
  rollNumber: string;
  date: string;
  time: string;
  status: 'Present' | 'Late' | 'Absent';
  teacherName: string;
}

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { student } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [recent, setRecent] = useState<RecentCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [analyticsResponse, historyResponse] = await Promise.all([
        api.get<AnalyticsData>('/api/student/attendance/analytics'),
        api.get<RecentCheckIn[]>('/api/student/attendance/history')
      ]);
      setData(analyticsResponse);
      setRecent(historyResponse.slice(0, 5)); // Keep last 5 entries
    } catch (err) {
      console.error("Failed to load student dashboard metrics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div id="student-dashboard-loading" className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">Loading student console...</p>
        </div>
      </div>
    );
  }

  const overall = data?.overallPercentage ?? 0;
  const isGoodStanding = overall >= 75;

  return (
    <div id="student-dashboard-container" className="space-y-6">
      
      {/* Top Welcome Title & Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Welcome Back, <span className="text-emerald-400">{student?.fullName}</span>!
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider font-mono">
            {student?.department} &bull; DIVISION {student?.division} &bull; {student?.year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            id="refresh-student-dashboard-btn"
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-300 transition-colors select-none cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Metrics'}</span>
          </button>

          <button
            onClick={() => setActiveTab('qr-scanner')}
            id="quick-scan-top-btn"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-500/10 transition-colors select-none cursor-pointer"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Mark Present</span>
          </button>
        </div>
      </div>

      {/* Bento Layout Grid for Metrics Summary */}
      <div id="student-dashboard-stats-bento" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Overall Percentage */}
        <div className="p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Overall Attendance</span>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isGoodStanding ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-4xl font-extrabold tracking-tight ${isGoodStanding ? 'text-emerald-400' : 'text-amber-400'}`}>
              {overall}%
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`h-2 w-2 rounded-full ${isGoodStanding ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <p className="text-[11px] text-slate-400 font-semibold uppercase">
                {isGoodStanding ? 'In Good Standing' : 'Below 75% Limit'}
              </p>
            </div>
          </div>
        </div>

        {/* Metric 2: Attended Lectures vs Total */}
        <div className="p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Attended Lectures</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-extrabold tracking-tight text-slate-100">
              {data?.totalAttendedCount ?? 0}
              <span className="text-sm text-slate-500 font-normal"> / {data?.totalClassesCount ?? 0}</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold uppercase mt-2">
              Lectures attended since term initialization
            </p>
          </div>
        </div>

        {/* Metric 3: Total Enrolled Subjects */}
        <div className="p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Enrolled Subjects</span>
            <div className="h-8 w-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-extrabold tracking-tight text-slate-100">
              {data?.subjectBreakdown.length ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold uppercase mt-2">
              Active mapped program subjects
            </p>
          </div>
        </div>

        {/* Metric 4: Active Class Attendance Risk Status */}
        <div className="p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Admit Criteria status</span>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isGoodStanding ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {isGoodStanding ? (
                <Flame className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              )}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-extrabold tracking-tight ${isGoodStanding ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isGoodStanding ? 'APPROVED' : 'WARNING'}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold uppercase mt-2">
              {isGoodStanding ? (
                'Cleared for Semester Exams'
              ) : (
                'Immediate attendance correction requested'
              )}
            </p>
          </div>
        </div>

      </div>

      {/* Main Bottom Section: Left (Subject Mapped progress), Right (Recent Checkin timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Grid Card: Subject Attendance Overview Progression */}
        <div className="lg:col-span-7 p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider">Subject-wise Progress</h3>
            <button
              onClick={() => setActiveTab('subjects')}
              id="view-all-subjects-btn"
              className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Examine Subjects &rarr;
            </button>
          </div>

          <div className="space-y-4">
            {data?.subjectBreakdown.map((sub) => {
              const subGood = sub.percentage >= 75;
              return (
                <div key={sub.subjectId} id={`subject-progress-${sub.subjectId}`} className="p-4 bg-slate-950 rounded-xl border border-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{sub.subjectName}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{sub.subjectCode}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${subGood ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {sub.percentage}%
                      </span>
                      <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">
                        {sub.attended} of {sub.total} classes
                      </p>
                    </div>
                  </div>

                  {/* Progress bar mapping */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${subGood ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {(!data || data.subjectBreakdown.length === 0) && (
              <p className="text-xs text-slate-500 italic py-4 text-center">No enrolled program subjects found.</p>
            )}
          </div>
        </div>

        {/* Right Grid Card: Recent Activity timeline / recent scan checkins */}
        <div className="lg:col-span-5 p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider">Recent Activity Logs</h3>
            <button
              onClick={() => setActiveTab('attendance')}
              id="view-all-attendance-logs-btn"
              className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Analyze Logs &rarr;
            </button>
          </div>

          <div className="flow-root">
            <ul className="-mb-8">
              {recent.map((item, logIndex) => {
                const isLate = item.status === 'Late';
                const isAbsent = item.status === 'Absent';
                return (
                  <li key={item.id} id={`recent-activity-item-${item.id}`}>
                    <div className="relative pb-8">
                      {logIndex !== recent.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-800" aria-hidden="true" />
                      ) : null}

                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center border ${
                            isLate 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                              : isAbsent 
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-450' 
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }`}>
                            <Clock className="h-4 w-4" />
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between gap-2.5">
                          <div>
                            <p className="text-xs font-bold text-slate-200">{item.subjectName}</p>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-wider">
                              Assigned: {item.teacherName}
                            </p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              isLate 
                                ? 'bg-amber-400/10 text-amber-400' 
                                : isAbsent 
                                  ? 'bg-rose-450/10 text-rose-400' 
                                  : 'bg-emerald-400/10 text-emerald-400'
                            }`}>
                              {item.status}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 justify-end mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>{item.date}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </li>
                );
              })}

              {recent.length === 0 && (
                <p className="text-xs text-slate-500 italic py-6 text-center">No recent scan checkins logged.</p>
              )}
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
};
