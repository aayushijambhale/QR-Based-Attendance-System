import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import { Subject, Student } from '../../types.js';
import { 
  GraduationCap, 
  Users, 
  Search, 
  Layers, 
  BookOpen, 
  ArrowLeft, 
  Sparkles,
  BookMarked
} from 'lucide-react';

export const TeacherSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected single subject detail view state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [subjectDetail, setSubjectDetail] = useState<Subject | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const loadSubjects = async () => {
    try {
      const allSubjects = await api.get<Subject[]>('/api/teacher/subjects');
      setSubjects(allSubjects);
    } catch (e) {
      console.error("Failed to load teacher subjects:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleInspectSubject = async (sub: Subject) => {
    setSelectedSubjectId(sub.id);
    setSubjectDetail(sub);
    setDetailLoading(true);
    setStudentSearch('');

    try {
      const data = await api.get<{ subject: Subject; students: Student[] }>(`/api/teacher/subjects/${sub.id}`);
      setEnrolledStudents(data.students);
    } catch (e) {
      console.error("Failed to fetch subject enrolled list:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedSubjectId(null);
    setSubjectDetail(null);
    setEnrolledStudents([]);
  };

  const filteredStudents = enrolledStudents.filter(st => {
    const q = studentSearch.toLowerCase();
    return st.fullName.toLowerCase().includes(q) || 
           st.rollNumber.toLowerCase().includes(q) || 
           st.semester.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="py-20 text-center animate-pulse text-xs text-slate-405 font-mono">
        LOADING FACULTY SYLLABUS DIRECTORY...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="teacher-subjects-view">
      {/* Dynamic Header based on active details expansion view */}
      {!selectedSubjectId ? (
        <div>
          <h1 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">Syllabus Courses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse and inspect subjects assigned to you by the Principal Dean. Manage student class lists and rosters.
          </p>
        </div>
      ) : (
        <button
          onClick={handleBack}
          id="back-to-subjects-list-btn"
          className="text-indigo-650 hover:text-indigo-705 font-bold text-xs flex items-center gap-2 cursor-pointer border border-slate-105 px-3 py-1.5 rounded-lg bg-white shadow-xs w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Course Directory</span>
        </button>
      )}

      {/* Main Container logic */}
      {!selectedSubjectId ? (
        // List grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <div 
              key={sub.id}
              onClick={() => handleInspectSubject(sub)}
              id={`inspect-subject-card-${sub.id}`}
              className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between hover:border-indigo-150 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Abs decoration backdrop glow */}
              <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-indigo-50/20 to-transparent blur-md group-hover:from-indigo-100/30 transition-all pointer-events-none" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {/* tag code */}
                  <code className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded-lg border border-indigo-100/50">
                    {sub.code}
                  </code>
                  
                  {/* Department flag */}
                  <span className="text-[10px] bg-slate-50 text-slate-500 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {sub.department}
                  </span>
                </div>

                <div>
                  <h3 className="text-md font-bold text-slate-900 group-hover:text-indigo-650 transition-colors leading-snug">
                    {sub.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
                    <BookOpen className="h-3 w-3 inline" />
                    <span>Lec: 3h/Week • Sem {sub.semester}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-505 font-bold">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>CS Roster</span>
                </div>
                <span className="text-indigo-600 group-hover:underline">Examine Class →</span>
              </div>
            </div>
          ))}

          {subjects.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
              <BookMarked className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold">You aren't currently assigned to any subjects.</p>
              <p className="text-[10px] text-slate-400 mt-1">Please ask the Academic Admin to allocate your syllabus subjects.</p>
            </div>
          )}
        </div>
      ) : (
        // Expanded Detail view
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subject Meta Details Bento Panel */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 lg:col-span-1 h-fit space-y-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3.5 border-b border-slate-50">
              <Layers className="h-4.5 w-4.5 text-indigo-550 shrink-0" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Syllabus Overview</span>
            </div>

            {subjectDetail && (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Course Identifier</span>
                  <div className="flex justify-between items-center mt-1">
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">{subjectDetail.name}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Course Code</span>
                    <code className="text-[11px] font-mono font-bold text-slate-800 block mt-1">{subjectDetail.code}</code>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Semester</span>
                    <span className="text-[11px] font-bold text-slate-805 block mt-1">Semester {subjectDetail.semester}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Faculty Department</span>
                    <span className="text-[11px] font-bold text-slate-805 block mt-1">{subjectDetail.department}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tally Allocated</span>
                    <span className="text-[11px] font-bold text-indigo-605 block mt-1 font-mono">{enrolledStudents.length} Students</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[11px] text-indigo-800 leading-normal">
                  <Sparkles className="h-4 w-4 mb-2 text-indigo-550 shrink-0" />
                  Roster students belong to the <b>{subjectDetail.department} department</b> in Semester <b>{subjectDetail.semester}</b>, matching standard Academic rules.
                </div>
              </div>
            )}
          </div>

          {/* Student list */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-50 gap-4 mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Class Roster Enrolled Students</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">List of students eligible for the check-in key generator.</p>
              </div>

              {/* Search input bar */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Query by Roll, Semester..."
                  id="student-roster-search"
                  className="w-full bg-slate-50 hover:bg-slate-50/80 border border-slate-200 text-xs rounded-xl py-2 pl-9 pr-4 outline-none focus:border-indigo-405 transition-colors placeholder:text-slate-400"
                />
              </div>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-xs animate-pulse text-slate-400 font-mono">
                REFRESHING CLASS ENROLLMENTS...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center text-slate-350">
                <Users className="h-10 w-10 mx-auto text-slate-205 mb-2" />
                <p className="text-xs font-bold">No Students Match Search Criteria</p>
                <p className="text-[10px] text-slate-400 mt-1">Double check spelling or remove filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs" id="roster-table">
                  <thead>
                    <tr className="border-b border-slate-105 text-[10px] font-bold text-slate-450 uppercase tracking-wide select-none">
                      <th className="py-2.5">Name / Reg Roll No</th>
                      <th className="py-2.5">Department</th>
                      <th className="py-2.5">Academic Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/50" id={`student-roster-row-${st.id}`}>
                        <td className="py-3 font-semibold text-slate-900 pr-2">
                          <p>{st.fullName}</p>
                          <code className="text-[10px] text-slate-400 mt-0.5 font-mono block">ID: {st.rollNumber}</code>
                        </td>
                        <td className="py-3 text-slate-600 uppercase">
                          {st.department}
                        </td>
                        <td className="py-3 font-mono font-bold text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200/50 text-slate-600 uppercase">
                            Sem {st.semester}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
