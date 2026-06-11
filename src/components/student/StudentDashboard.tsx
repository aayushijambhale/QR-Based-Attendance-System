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
      <div id="student-dashboard-loading" className="flex items-center justify-center min-h-[50vh] bg-[#F8F9FA]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[#0071E3] animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-[#6E6E73] font-mono uppercase tracking-wider">Loading scholar console...</p>
        </div>
      </div>
    );
  }

  const overall = data?.overallPercentage ?? 0;
  const isGoodStanding = overall >= 75;

  return (
    <div id="student-dashboard-container" className="space-y-6 text-[#1D1D1F]">
      
      {/* Top Welcome Title & Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
            Welcome Back, <span className="text-[#0071E3]">{student?.fullName}</span>!
          </h1>
          <p className="text-xs text-[#6E6E73] mt-1 uppercase font-bold tracking-wider font-sans">
            {student?.department} &bull; Division {student?.division} &bull; {student?.year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            id="refresh-student-dashboard-btn"
            disabled={refreshing}
            className="saas-button-secondary flex items-center gap-2 text-xs py-2 px-3.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#0071E3] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Metrics'}</span>
          </button>

          <button
            onClick={() => setActiveTab('qr-scanner')}
            id="quick-scan-top-btn"
            className="saas-button-primary flex items-center gap-2 text-xs py-2 px-3.5"
          >
            <QrCode className="h-3.5 w-3.5 text-white" />
            <span>Mark Present</span>
          </button>
        </div>
      </div>

      {/* Bento Layout Grid for Metrics Summary */}
      <div id="student-dashboard-stats-bento" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        
        {/* Metric 1: Overall Percentage */}
        <div className="saas-card p-5 flex flex-col justify-between saas-card-hover cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider">Overall Attendance</span>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isGoodStanding ? 'bg-[#EAFBEF] text-[#34C759]' : 'bg-[#FFF1E6] text-[#FF9500]'}`}>
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-extrabold tracking-tight ${isGoodStanding ? 'text-[#34C759]' : 'text-[#FF9500]'}`}>
              {overall}%
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`h-1.5 w-1.5 rounded-full ${isGoodStanding ? 'bg-[#34C759]' : 'bg-[#FF9500]'}`} />
              <p className="text-[10px] text-[#6E6E73] font-bold uppercase">
                {isGoodStanding ? 'In Good Standing' : 'Below 75% Limit'}
              </p>
            </div>
          </div>
        </div>

        {/* Metric 2: Attended Lectures vs Total */}
        <div className="saas-card p-5 flex flex-col justify-between saas-card-hover cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider">Attended Lectures</span>
            <div className="h-8 w-8 rounded-full bg-[#E8F2FF] text-[#0071E3] flex items-center justify-center">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
              {data?.totalAttendedCount ?? 0}
              <span className="text-sm text-[#6E6E73] font-normal"> / {data?.totalClassesCount ?? 0}</span>
            </h3>
            <p className="text-[10px] text-[#6E6E73] font-bold uppercase mt-2">
              Lectures attended since term start
            </p>
          </div>
        </div>

        {/* Metric 3: Total Enrolled Subjects */}
        <div className="saas-card p-5 flex flex-col justify-between saas-card-hover cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider">Enrolled Subjects</span>
            <div className="h-8 w-8 rounded-full bg-[#E8F2FF] text-[#0071E3] flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
              {data?.subjectBreakdown.length ?? 0}
            </h3>
            <p className="text-[10px] text-[#6E6E73] font-bold uppercase mt-2">
              Active mapped program subjects
            </p>
          </div>
        </div>

        {/* Metric 4: Active Class Attendance Risk Status */}
        <div className="saas-card p-5 flex flex-col justify-between saas-card-hover cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider">Exam Admissibility</span>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isGoodStanding ? 'bg-[#EAFBEF] text-[#34C759]' : 'bg-[#FDF2F2] text-[#FF3B30]'}`}>
              {isGoodStanding ? (
                <Flame className="h-4 w-4 text-[#34C759]" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-[#FF3B30]" />
              )}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-extrabold tracking-tight ${isGoodStanding ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
              {isGoodStanding ? 'APPROVED' : 'WARNING'}
            </h3>
            <p className="text-[10px] text-[#6E6E73] font-bold uppercase mt-2">
              {isGoodStanding ? (
                'Cleared for Semester Exams'
              ) : (
                'Immediate correction requested'
              )}
            </p>
          </div>
        </div>

      </div>

      {/* Main Bottom Section: Left (Subject Mapped progress), Right (Recent Checkin timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Grid Card: Subject Attendance Overview Progression */}
        <div className="lg:col-span-7 saas-card p-6">
          <div className="flex items-center justify-between mb-5 select-none pb-2 border-b border-[#D2D2D7]/55">
            <h3 className="text-[11px] font-bold text-[#1D1D1F] uppercase tracking-wider">Subject-wise Progress</h3>
            <button
              onClick={() => setActiveTab('subjects')}
              id="view-all-subjects-btn"
              className="text-[11px] font-bold text-[#0071E3] uppercase tracking-wider hover:text-[#0062C4] transition-colors cursor-pointer"
            >
              All Subjects &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {data?.subjectBreakdown.map((sub) => {
              const subGood = sub.percentage >= 75;
              return (
                <div key={sub.subjectId} id={`subject-progress-${sub.subjectId}`} className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#D2D2D7]/55 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1D1D1F]">{sub.subjectName}</p>
                      <p className="text-[10px] text-[#6E6E73] font-mono mt-0.5 font-semibold">{sub.subjectCode}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-extrabold ${subGood ? 'text-[#34C759]' : 'text-[#FF9500]'}`}>
                        {sub.percentage}%
                      </span>
                      <p className="text-[9px] text-[#6E6E73] font-bold uppercase mt-0.5">
                        {sub.attended} of {sub.total} classes
                      </p>
                    </div>
                  </div>

                  {/* Progress bar mapping */}
                  <div className="w-full bg-[#EAEAEA] rounded-full h-1 overflow-hidden select-none">
                    <div 
                      className={`h-1 rounded-full transition-all duration-500 ${subGood ? 'bg-[#34C759]' : 'bg-[#FF9500]'}`}
                      style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {(!data || data.subjectBreakdown.length === 0) && (
              <p className="text-xs text-[#6E6E73] italic py-4 text-center select-none">No enrolled program subjects found.</p>
            )}
          </div>
        </div>

        {/* Right Grid Card: Recent Activity timeline / recent scan checkins */}
        <div className="lg:col-span-5 saas-card p-6">
          <div className="flex items-center justify-between mb-5 select-none pb-2 border-b border-[#D2D2D7]/55">
            <h3 className="text-[11px] font-bold text-[#1D1D1F] uppercase tracking-wider">Recent Activity Logs</h3>
            <button
              onClick={() => setActiveTab('attendance')}
              id="view-all-attendance-logs-btn"
              className="text-[11px] font-bold text-[#0071E3] uppercase tracking-wider hover:text-[#0062C4] transition-colors cursor-pointer"
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
                    <div className="relative pb-6">
                      {logIndex !== recent.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-[#D2D2D7]/65" aria-hidden="true" />
                      ) : null}

                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center border ${
                            isLate 
                              ? 'bg-[#FFF1E6] border-[#FF9500]/20 text-[#FF9500]' 
                              : isAbsent 
                                ? 'bg-[#FDF2F2] border-[#FF3B30]/20 text-[#FF3B30]' 
                                : 'bg-[#EAFBEF] border-[#34C759]/20 text-[#34C759]'
                          }`}>
                            <Clock className="h-4 w-4" />
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between gap-2.5">
                          <div>
                            <p className="text-xs font-bold text-[#1D1D1F] leading-tight">{item.subjectName}</p>
                            <p className="text-[9px] text-[#6E6E73] mt-1 font-bold uppercase">
                              Lecturer: {item.teacherName}
                            </p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              isLate 
                                ? 'bg-[#FFF1E6] text-[#FF9500] border border-[#FF9500]/15' 
                                : isAbsent 
                                  ? 'bg-[#FDF2F2] text-[#FF3B30] border border-[#FF3B30]/15' 
                                  : 'bg-[#EAFBEF] text-[#34C759] border border-[#34C759]/15'
                            }`}>
                              {item.status}
                            </span>
                            <div className="text-[9px] text-[#6E6E73] font-mono font-bold flex items-center gap-1 justify-end mt-1.5">
                              <Calendar className="h-3 w-3 text-[#6E6E73]" />
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
                <p className="text-xs text-[#6E6E73] italic py-6 text-center select-none">No recent scan checkins logged.</p>
              )}
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
};
