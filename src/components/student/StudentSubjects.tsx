import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import { 
  User, 
  Calendar, 
  ChevronLeft,
  Loader2,
  BookOpen,
  PieChart
} from 'lucide-react';

interface SubjectAnalytics {
  attended: number;
  total: number;
  percentage: number;
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  department: string;
  semester: string;
  teacherId: string;
  teacherName: string;
  teacherPhoto?: string;
  analytics?: SubjectAnalytics;
}

interface SubjectDetail {
  subject: {
    id: string;
    name: string;
    code: string;
    department: string;
    semester: string;
    teacherName: string;
  };
  attendance: {
    id: string;
    date: string;
    time: string;
    status: 'Present' | 'Late' | 'Absent';
    teacherName: string;
  }[];
}

export const StudentSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SubjectDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchSubjects = async () => {
    try {
      const data = await api.get<SubjectItem[]>('/api/student/subjects');
      setSubjects(data);
    } catch (err) {
      console.error("Failed to load student subjects list:", err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleSelectSubject = async (id: string) => {
    setSelectedSubjectId(id);
    setLoadingDetail(true);
    try {
      const data = await api.get<SubjectDetail>(`/api/student/subjects/${id}`);
      setDetail(data);
    } catch (err) {
      console.error(`Failed to load details for subject ${id}:`, err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleBackToList = () => {
    setSelectedSubjectId(null);
    setDetail(null);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  if (loadingList) {
    return (
      <div id="subjects-loading" className="flex items-center justify-center min-h-[40vh] bg-[#F8F9FA]">
        <div className="text-center select-none">
          <Loader2 className="h-8 w-8 text-[#0071E3] animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#6E6E73] font-mono uppercase tracking-wider">Loading course curriculum...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="student-subjects-container" className="space-y-6 text-[#1D1D1F]">
      
      {/* Detail View Mode */}
      {selectedSubjectId ? (
        <div id="student-subject-detail-view" className="space-y-6">
          {/* Back Trigger Header */}
          <button
            onClick={handleBackToList}
            id="back-to-subjects-list-btn"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6E6E73] hover:text-[#1D1D1F] transition-colors select-none cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>All Subjects</span>
          </button>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-20 bg-white saas-card">
              <Loader2 className="h-8 w-8 text-[#0071E3] animate-spin" />
            </div>
          ) : detail ? (
            <div className="space-y-6">
              
              {/* Subject Jumbotron Header Card */}
              <div className="saas-card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <span className="px-2.5 py-0.5 rounded bg-[#E8F2FF] text-[#0071E3] text-[9px] font-bold uppercase border border-[#0071E3]/20 select-none">
                    {detail.subject.semester}
                  </span>
                  <h2 className="text-xl font-bold text-[#1D1D1F] mt-2.5">{detail.subject.name}</h2>
                  <p className="text-xs text-[#6E6E73] mt-1 font-semibold">{detail.subject.code} &bull; {detail.subject.department}</p>
                </div>

                <div className="flex items-center gap-3 bg-[#F8F9FA] p-3 rounded-xl border border-[#D2D2D7]/55 select-none">
                  <div className="h-9 w-9 rounded-full bg-[#EAFBEF] text-[#34C759] flex items-center justify-center">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[#6E6E73] uppercase tracking-wider block">Course Lecturer</span>
                    <span className="text-xs font-bold text-[#1D1D1F] block mt-0.5">{detail.subject.teacherName}</span>
                  </div>
                </div>
              </div>

              {/* Attendance Breakdown Grid list */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Checkin Logs Table */}
                <div className="lg:col-span-8 saas-card overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#D2D2D7]/55 select-none bg-[#F8F9FA]">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#1D1D1F]">Individual Lesson History</h3>
                  </div>
                  
                  <div className="overflow-x-auto bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#D2D2D7]/65 text-[10px] font-bold uppercase text-[#6E6E73] tracking-wider select-none">
                          <th className="py-3 px-6">Session Date</th>
                          <th className="py-3 px-6">Timestamp</th>
                          <th className="py-3 px-6">Reporting Authority</th>
                          <th className="py-3 px-6 text-right pr-6">Check-In Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D2D2D7]/65 text-xs text-[#1D1D1F]">
                        {detail.attendance.map((log) => {
                          const statusColors: any = {
                            Present: 'saas-pill-success',
                            Late: 'saas-pill-warning',
                            Absent: 'saas-pill-error'
                          };
                          return (
                            <tr key={log.id} id={`detail-log-row-${log.id}`} className="hover:bg-[#F8F9FA] transition-colors">
                              <td className="py-3.5 px-6 font-semibold">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5 text-[#6E6E73]" />
                                  <span>{log.date}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-6 font-mono text-[#6E6E73]">{log.time}</td>
                              <td className="py-3.5 px-6 font-semibold text-[#1D1D1F]">{log.teacherName}</td>
                              <td className="py-3.5 px-6 text-right pr-6">
                                <span className={`${statusColors[log.status] || 'saas-pill-warning'}`}>
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {detail.attendance.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-10 text-center text-xs text-[#6E6E73] italic select-none">
                              No attendance logs available for this session.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Left Side: Summary Card */}
                <div className="lg:col-span-4 saas-card p-5 flex flex-col justify-between h-fit">
                  <div>
                    <div className="flex items-center gap-2 text-[#0071E3] mb-4 select-none">
                      <PieChart className="h-4.5 w-4.5" />
                      <h4 className="text-[10px] font-bold uppercase tracking-wider">Aggregate Summary</h4>
                    </div>

                    {/* Calculations */}
                    {(() => {
                      const totalSubjectClasses = 10;
                      const attended = detail.attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
                      const percent = Math.round((attended / totalSubjectClasses) * 100);
                      const thresholdOk = percent >= 75;

                      return (
                        <div id="analytics-summary-body" className="space-y-6">
                          <div className="text-center py-5 bg-[#F8F9FA] rounded-xl border border-[#D2D2D7]/55 select-none">
                            <h5 className={`text-4xl font-extrabold tracking-tight ${thresholdOk ? 'text-[#34C759]' : 'text-[#FF9500]'}`}>
                              {percent}%
                            </h5>
                            <p className="text-[9px] text-[#6E6E73] font-bold uppercase tracking-wider mt-2">Attendance Rating</p>
                          </div>

                          <div className="space-y-3.5 text-xs text-[#6E6E73] font-bold uppercase select-none">
                            <div className="flex justify-between">
                              <span>Lectures Enrolled:</span>
                              <span className="text-[#1D1D1F] font-mono">{totalSubjectClasses}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Present logs:</span>
                              <span className="text-[#34C759] font-mono">
                                {detail.attendance.filter(a => a.status === 'Present').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Late logs:</span>
                              <span className="text-[#FF9500] font-mono">
                                {detail.attendance.filter(a => a.status === 'Late').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Absent logs:</span>
                              <span className="text-[#FF3B30] font-mono">
                                {detail.attendance.filter(a => a.status === 'Absent').length}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#D2D2D7]/55 select-none">
                    <p className="text-[9px] text-[#6E6E73] leading-normal font-bold uppercase tracking-wider">
                      Notice: Maintain at least <span className="text-[#1D1D1F]">75%</span> to qualify for end-semester exams.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <p className="text-xs text-[#6E6E73] select-none">Failed to load subject description.</p>
          )}

        </div>
      ) : (
        <div id="student-subjects-list" className="space-y-6">
          <div className="select-none">
            <h2 className="text-2xl font-bold text-[#1D1D1F]">My Subjects</h2>
            <p className="text-xs text-[#6E6E73] mt-1">Select a course to inspect comprehensive logging histories, scores, and faculty information.</p>
          </div>

          {/* List of Subjects */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub) => {
              const analytics = sub.analytics;
              const percent = analytics?.percentage ?? 0;
              const subGood = percent >= 75;

              return (
                <div 
                  key={sub.id} 
                  onClick={() => handleSelectSubject(sub.id)}
                  id={`subject-card-${sub.id}`}
                  className="saas-card p-5 saas-card-hover transition-all group select-none cursor-pointer flex flex-col justify-between h-44"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-mono text-[#6E6E73] font-bold">{sub.code}</span>
                      <span className={`h-8 w-8 flex items-center justify-center rounded-full ${subGood ? 'bg-[#EAFBEF] text-[#34C759]' : 'bg-[#FFF1E6] text-[#FF9500]'}`}>
                        <BookOpen className="h-4.5 w-4.5" />
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#1D1D1F] mt-3 group-hover:text-[#0071E3] transition-colors line-clamp-1">
                      {sub.name}
                    </h3>
                    <p className="text-[10px] text-[#6E6E73] font-bold mt-1 uppercase tracking-wider">Lecturer: {sub.teacherName}</p>
                  </div>

                  {/* Percentage Summary strip */}
                  <div className="mt-4 pt-3 border-t border-[#D2D2D7]/55">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                      <span className="text-[#6E6E73] text-[9px]">Attainment</span>
                      <span className={subGood ? 'text-[#34C759]' : 'text-[#FF9500]'}>{percent}%</span>
                    </div>

                    <div className="w-full bg-[#EAEAEA] rounded-full h-1 overflow-hidden">
                      <div 
                        className={`h-1 rounded-full ${subGood ? 'bg-[#34C759]' : 'bg-[#FF9500]'}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {subjects.length === 0 && (
              <div className="col-span-full text-center py-10 bg-white border border-dashed border-[#D2D2D7] rounded-2xl select-none">
                <p className="text-xs text-[#6E6E73]">No active subjects mapped to your current profile division.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
