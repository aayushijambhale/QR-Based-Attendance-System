import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { Subject, Student } from '../../types.js';
import { 
  GraduationCap, 
  Users, 
  Search, 
  Layers, 
  BookOpen, 
  ArrowLeft, 
  Sparkles,
  BookMarked,
  Plus,
  X
} from 'lucide-react';

export const TeacherSubjects: React.FC = () => {
  const { teacher } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected single subject detail view state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [subjectDetail, setSubjectDetail] = useState<Subject | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Modal forms states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectSemester, setNewSubjectSemester] = useState('Semester 1');
  const [creating, setCreating] = useState(false);

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

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName || !newSubjectCode) return;

    setCreating(true);
    try {
      await api.post('/api/subjects', {
        name: newSubjectName,
        code: newSubjectCode,
        department: teacher?.department || 'Computer Science',
        semester: newSubjectSemester,
        teacherId: teacher?.id || ''
      });
      
      // Reset form and reload list
      setNewSubjectName('');
      setNewSubjectCode('');
      setNewSubjectSemester('Semester 1');
      setShowAddModal(false);
      loadSubjects();
    } catch (err: any) {
      alert(err.message || 'Failed to create subject.');
    } finally {
      setCreating(false);
    }
  };

  const filteredStudents = enrolledStudents.filter(st => {
    const q = studentSearch.toLowerCase();
    return st.fullName.toLowerCase().includes(q) || 
           st.rollNumber.toLowerCase().includes(q) || 
           st.semester.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="py-20 text-center animate-pulse text-xs text-[#6E6E73] font-mono">
        LOADING FACULTY SYLLABUS DIRECTORY...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="teacher-subjects-view">
      {/* Dynamic Header based on active details expansion view */}
      {!selectedSubjectId ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
          <div>
            <h1 className="text-2xl font-bold font-sans text-[#1D1D1F] tracking-tight">Syllabus Courses</h1>
            <p className="text-xs text-[#6E6E73] mt-1">
              Browse and inspect subjects assigned to you by the Principal Dean. Manage student class lists and rosters.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            id="teacher-add-subject-btn"
            className="saas-button-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Subject</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleBack}
          id="back-to-subjects-list-btn"
          className="saas-button-secondary py-1.5 px-3 text-xs flex items-center gap-2 w-fit"
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
              className="saas-card saas-card-hover p-6 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {/* tag code */}
                  <code className="apple-badge">
                    {sub.code}
                  </code>
                  
                  {/* Department flag */}
                  <span className="text-[10px] bg-[#F8F9FA] text-[#6E6E73] border border-[#D2D2D7] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {sub.department}
                  </span>
                </div>

                <div>
                  <h3 className="text-md font-bold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors leading-snug">
                    {sub.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#6E6E73] mt-2">
                    <BookOpen className="h-3 w-3 inline" />
                    <span>Lec: 3h/Week • Sem {sub.semester}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#D2D2D7] flex items-center justify-between text-xs text-[#6E6E73] font-bold">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>CS Roster</span>
                </div>
                <span className="text-[#0071E3] group-hover:underline">Examine Class →</span>
              </div>
            </div>
          ))}

          {subjects.length === 0 && (
            <div className="col-span-full py-20 text-center text-[#6E6E73] bg-[#F8F9FA] rounded-xl border border-dashed border-[#D2D2D7]">
              <BookMarked className="h-10 w-10 mx-auto text-slate-350 mb-2" />
              <p className="text-xs font-bold text-[#1D1D1F]">You aren't currently assigned to any subjects.</p>
              <p className="text-[10px] text-[#6E6E73] mt-1">Click "Create Subject" above to add your very first academic course syllabus!</p>
            </div>
          )}
        </div>
      ) : (
        // Expanded Detail view
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subject Meta Details Bento Panel */}
          <div className="saas-card p-6 lg:col-span-1 h-fit space-y-5">
            <div className="flex items-center gap-2 pb-3 mb-1 border-b border-[#D2D2D7]">
              <Layers className="h-4.5 w-4.5 text-[#0071E3] shrink-0" />
              <span className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">Syllabus Overview</span>
            </div>

            {subjectDetail && (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#6E6E73] font-bold uppercase tracking-wide">Course Identifier</span>
                  <div className="flex justify-between items-center mt-1">
                    <h3 className="text-base font-bold text-[#1D1D1F] leading-tight">{subjectDetail.name}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#D2D2D7]">
                  <div>
                    <span className="text-[10px] text-[#6E6E73] uppercase font-bold block">Course Code</span>
                    <code className="text-[11px] font-mono font-bold text-[#1D1D1F] block mt-1">{subjectDetail.code}</code>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6E6E73] uppercase font-bold block">Target Semester</span>
                    <span className="text-[11px] font-bold text-[#1D1D1F] block mt-1">Semester {subjectDetail.semester}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#D2D2D7]">
                  <div>
                    <span className="text-[10px] text-[#6E6E73] uppercase font-bold block">Faculty Department</span>
                    <span className="text-[11px] font-bold text-[#1D1D1F] block mt-1">{subjectDetail.department}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6E6E73] uppercase font-bold block">Tally Allocated</span>
                    <span className="text-[11px] font-bold text-[#0071E3] block mt-1 font-mono">{enrolledStudents.length} Students</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#D2D2D7] text-[11px] text-[#6E6E73] leading-normal">
                  <Sparkles className="h-4 w-4 mb-2 text-[#0071E3] shrink-0" />
                  Roster students belong to the <b>{subjectDetail.department} department</b> in Semester <b>{subjectDetail.semester}</b>, matching standard Academic rules.
                </div>
              </div>
            )}
          </div>

          {/* Student list */}
          <div className="saas-card p-6 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#D2D2D7] gap-4 mb-5">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F]">Class Roster Enrolled Students</h3>
                <p className="text-[11px] text-[#6E6E73] mt-0.5">List of students eligible for the check-in key generator.</p>
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
                  className="saas-input py-2 pl-9 pr-4 font-medium"
                />
              </div>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-xs animate-pulse text-[#6E6E73] font-mono">
                REFRESHING CLASS ENROLLMENTS...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center text-[#6E6E73]">
                <Users className="h-10 w-10 mx-auto text-slate-200 mb-2" />
                <p className="text-xs font-bold text-[#1D1D1F]">No Students Match Search Criteria</p>
                <p className="text-[10px] text-[#6E6E73] mt-1">Double check spelling or remove filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs" id="roster-table">
                  <thead>
                    <tr className="border-b border-[#D2D2D7] text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wide select-none">
                      <th className="py-2.5">Name / Reg Roll No</th>
                      <th className="py-2.5">Department</th>
                      <th className="py-2.5">Academic Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2D2D7] text-[#1D1D1F]">
                    {filteredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-[#F8F9FA]/60" id={`student-roster-row-${st.id}`}>
                        <td className="py-3 font-semibold text-[#1D1D1F] pr-2">
                          <p>{st.fullName}</p>
                          <code className="text-[10px] text-[#6E6E73] mt-0.5 font-mono block">ID: {st.rollNumber}</code>
                        </td>
                        <td className="py-3 text-[#6E6E73] uppercase font-medium">
                          {st.department}
                        </td>
                        <td className="py-3">
                          <span className="apple-badge">
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

      {/* Create Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#1D1D1F]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#D2D2D7] shadow-xl overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#F8F9FA] border-b border-[#D2D2D7] select-none">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#0071E3]" />
                <span className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">Create New Subject</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#6E6E73] hover:text-[#1D1D1F] transition-colors bg-[#F8F9FA] hover:bg-[#E5E5EA] p-1.5 rounded-lg border border-[#D2D2D7]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCreateSubject} className="p-6 space-y-4 text-xs font-semibold text-[#1D1D1F]">
              <div>
                <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wide mb-1.5">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Machine Learning"
                  className="saas-input"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wide mb-1.5">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  placeholder="e.g. CS-401"
                  className="saas-input"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wide mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={teacher?.department || ''}
                  disabled
                  title="Subjects are created under your assigned department"
                  className="saas-input bg-[#F8F9FA] text-[#6E6E73] cursor-not-allowed border-[#D2D2D7]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#6E6E73] uppercase font-bold tracking-wide mb-1.5">
                  Target Semester
                </label>
                <select
                  value={newSubjectSemester}
                  onChange={(e) => setNewSubjectSemester(e.target.value)}
                  className="saas-input cursor-pointer font-medium"
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full saas-button-primary flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{creating ? 'Creating Subject...' : 'Create Subject'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
