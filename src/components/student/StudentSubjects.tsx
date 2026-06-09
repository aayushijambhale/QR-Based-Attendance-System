import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import { 
  GraduationCap, 
  User, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
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
      <div id="subjects-loading" className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading course curriculum...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="student-subjects-container" className="space-y-6">
      
      {/* Detail View Mode */}
      {selectedSubjectId ? (
        <div id="student-subject-detail-view" className="space-y-6">
          {/* Back Trigger Header */}
          <button
            onClick={handleBackToList}
            id="back-to-subjects-list-btn"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors select-none cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Store All Subjects</span>
          </button>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            </div>
          ) : detail ? (
            <div className="space-y-6">
              
              {/* Subject Jumbotron Header Card */}
              <div className="p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] bg-indigo-505/10 text-indigo-400 border border-indigo-500/10 font-bold uppercase font-mono tracking-wider">
                    {detail.subject.semester}
                  </span>
                  <h2 className="text-xl font-bold text-slate-100 mt-3">{detail.subject.name}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">{detail.subject.code} &bull; Department of {detail.subject.department}</p>
                </div>

                <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-900">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Course Lecturer</span>
                    <span className="text-sm font-semibold text-slate-200 block">{detail.subject.teacherName}</span>
                  </div>
                </div>
              </div>

              {/* Attendance Breakdown Grid list */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Checkin Logs Table */}
                <div className="lg:col-span-8 p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-350">Individual Lesson History</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                          <th className="pb-3 pl-2">Session Date</th>
                          <th className="pb-3">Timestamp</th>
                          <th className="pb-3">Reporting Authority</th>
                          <th className="pb-3 text-right pr-2">Attainment Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/40">
                        {detail.attendance.map((log) => {
                          const isLate = log.status === 'Late';
                          const isAbsent = log.status === 'Absent';
                          return (
                            <tr key={log.id} id={`detail-log-row-${log.id}`} className="text-xs text-slate-300 hover:bg-slate-950/20 transition-colors">
                              <td className="py-3.5 pl-2 font-semibold flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                <span>{log.date}</span>
                              </td>
                              <td className="py-3.5 font-mono text-slate-400">{log.time}</td>
                              <td className="py-3.5 font-medium">{log.teacherName}</td>
                              <td className="py-3.5 text-right pr-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                  isLate 
                                    ? 'bg-amber-400/10 text-amber-400' 
                                    : isAbsent 
                                      ? 'bg-rose-450/10 text-rose-400' 
                                      : 'bg-emerald-400/10 text-emerald-400'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {detail.attendance.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-10 text-center text-xs text-slate-500 italic">
                              No attendance log files located for this catalog session.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Left Side: Summary Card */}
                <div className="lg:col-span-4 p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-400 mb-4">
                      <PieChart className="h-4.5 w-4.5" />
                      <h4 className="text-xs font-extrabold uppercase tracking-widest">Aggregate summary</h4>
                    </div>

                    {/* Calculations */}
                    {(() => {
                      const totalSubjectClasses = 10;
                      const attended = detail.attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
                      const percent = Math.round((attended / totalSubjectClasses) * 100);
                      const thresholdOk = percent >= 75;

                      return (
                        <div id="analytics-summary-body" className="space-y-6">
                          <div className="text-center py-6 bg-slate-950 rounded-2xl border border-slate-900">
                            <h5 className={`text-5xl font-extrabold tracking-tight ${thresholdOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {percent}%
                            </h5>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Current Attendance Score</p>
                          </div>

                          <div className="space-y-3.5 text-xs text-slate-400 font-semibold uppercase">
                            <div className="flex justify-between">
                              <span>Lectures Enrolled:</span>
                              <span className="text-slate-200 font-mono font-bold">{totalSubjectClasses}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Present logs:</span>
                              <span className="text-emerald-400 font-mono font-bold">
                                {detail.attendance.filter(a => a.status === 'Present').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Late logs:</span>
                              <span className="text-amber-400 font-mono font-bold">
                                {detail.attendance.filter(a => a.status === 'Late').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Absent logs:</span>
                              <span className="text-rose-400 font-mono font-bold">
                                {detail.attendance.filter(a => a.status === 'Absent').length}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 leading-normal font-medium uppercase tracking-wide">
                      Notice: Students must maintain a minimum threshold criteria rating of <span className="text-slate-300 font-bold">75%</span> in order to qualify for end-semester exams.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <p className="text-xs text-slate-500">Failed to load item description.</p>
          )}

        </div>
      ) : (
        <div id="student-subjects-list" className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">My Subjects</h2>
            <p className="text-xs text-slate-400 mt-1">Select a catalog course item bellow to inspect comprehensive logging histories, scores, and faculty information.</p>
          </div>

          {/* List of Subjects */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => {
              const analytics = sub.analytics;
              const percent = analytics?.percentage ?? 0;
              const subGood = percent >= 75;

              return (
                <div 
                  key={sub.id} 
                  onClick={() => handleSelectSubject(sub.id)}
                  id={`subject-card-${sub.id}`}
                  className="p-5 bg-slate-900/60 hover:bg-slate-850/60 backdrop-blur-md rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-md group select-none cursor-pointer flex flex-col justify-between h-48"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-mono text-slate-500">{sub.code}</span>
                      <span className={`h-25 w-25 flex items-center justify-center rounded-lg ${subGood ? 'bg-emerald-500/10 text-emerald-450' : 'bg-amber-500/10 text-amber-400'}`}>
                        <BookOpen className="h-4 w-4" />
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-200 mt-3 group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {sub.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium truncate mt-1">Lecturer: {sub.teacherName}</p>
                  </div>

                  {/* Percentage Summary strip */}
                  <div className="mt-4 pt-3 border-t border-slate-850/50">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                      <span className="text-slate-500 font-bold text-[10px]">Attained</span>
                      <span className={subGood ? 'text-emerald-400' : 'text-amber-400'}>{percent}%</span>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                      <div 
                        className={`h-1 rounded-full ${subGood ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {subjects.length === 0 && (
              <div colSpan={3} className="text-center py-10 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
                <p className="text-xs text-slate-500">No active subjects mapped to your current profile division.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
