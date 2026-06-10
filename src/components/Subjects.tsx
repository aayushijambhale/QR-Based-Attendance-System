import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Subject, Teacher } from '../types.js';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  BookOpen, 
  User, 
  X,
  GraduationCap
} from 'lucide-react';

export const Subjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Modal control
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Form Field States
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [semester, setSemester] = useState('Semester 1');
  const [teacherId, setTeacherId] = useState('');

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [subjectsList, teachersList] = await Promise.all([
        api.get<Subject[]>('/api/subjects', {
          q: searchQuery,
          department: deptFilter
        }),
        api.get<Teacher[]>('/api/teachers')
      ]);

      setSubjects(subjectsList);
      setTeachers(teachersList);
    } catch (e) {
      console.error("Failed to fetch subjects details", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [searchQuery, deptFilter]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedSubject(null);
    setName('');
    setCode('');
    setDepartment('Computer Science');
    setSemester('Semester 1');
    setTeacherId(teachers.length ? teachers[0].id : '');
    setShowModal(true);
  };

  const handleOpenEdit = (s: Subject) => {
    setModalMode('edit');
    setSelectedSubject(s);
    setName(s.name);
    setCode(s.code);
    setDepartment(s.department);
    setSemester(s.semester);
    setTeacherId(s.teacherId);
    setShowModal(true);
  };

  const handleDelete = async (id: string, code: string) => {
    const confirmed = window.confirm(`Permanently remove subject "${code}"? This automatically stops all associated generated QR sessions and wipes historical attendance logs!`);
    if (!confirmed) return;

    try {
      await api.delete(`/api/subjects/${id}`);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Subject deletion failed.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      alert('Required particulars remain incomplete.');
      return;
    }

    try {
      if (modalMode === 'add') {
        await api.post('/api/subjects', {
          name,
          code,
          department,
          semester,
          teacherId
        });
      } else if (modalMode === 'edit' && selectedSubject) {
        await api.put(`/api/subjects/${selectedSubject.id}`, {
          name,
          code,
          department,
          semester,
          teacherId
        });
      }
      setShowModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const departmentsList = ['Computer Science', 'Electronics', 'Mechanical', 'Electrical', 'Information Technology'];
  const semestersList = [
    'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
    'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="subjects-view-container">
      {/* Header and Create Subject Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#134E4A] tracking-tight">Academic Subject Directory</h1>
          <p className="text-[#64748B] text-xs mt-1">Configure study syllabuses, codes, semesters, and assign default lecturing faculty.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          id="add-subject-trigger"
          className="saas-button-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Roster controls */}
      <div className="saas-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search academic syllabus by name, keycode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="saas-input pl-9 py-2.5"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-[#64748B] select-none">Branch:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="saas-input py-2 w-full sm:w-auto"
          >
            <option value="All">All Departments</option>
            {departmentsList.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid Card Lists */}
      {loading ? (
        <div className="text-center py-20 saas-card">
          <BookOpen className="h-10 w-10 text-[#0F766E] animate-pulse mx-auto mb-3" />
          <p className="text-xs text-[#64748B]">Loading comprehensive syllabus...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="saas-card p-12 text-center">
          <BookOpen className="h-12 w-12 text-[#64748B] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#134E4A]">No Subject Exists</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-4">
            No academic course matches your parameters. Enroll a syllabus using "Add New Subject".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="subjects-grid">
          {subjects.map((subj) => {
            const assignedTeacher = teachers.find(t => t.id === subj.teacherId);
            return (
              <div 
                key={subj.id}
                className="saas-card saas-card-hover relative group p-6 flex flex-col justify-between"
                id={`subject-card-${subj.id}`}
              >
                <div>
                  {/* Top section with Semester */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#EAF5F5] text-[#0F766E] uppercase border border-[#14B8A6]">
                      {subj.semester}
                    </span>
                    <span className="text-xs font-bold text-[#64748B] font-mono">
                      {subj.code}
                    </span>
                  </div>

                  {/* Name and Department */}
                  <div className="mb-6">
                    <h3 className="font-bold text-[#134E4A] text-base leading-snug group-hover:text-[#0F766E] transition-colors">
                      {subj.name}
                    </h3>
                    <p className="text-xs text-[#64748B] font-medium mt-1 uppercase tracking-wide">
                      {subj.department} Branch
                    </p>
                  </div>
                </div>

                {/* Assigned Faculty Section */}
                <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                    {assignedTeacher ? (
                      <>
                        <img
                          src={assignedTeacher.profilePhoto}
                          alt={assignedTeacher.fullName}
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 rounded-md object-cover ring-1 ring-[#E2E8F0]"
                        />
                        <div className="overflow-hidden">
                          <span className="text-[10px] text-[#64748B] block leading-none">Lecturing Faculty</span>
                          <span className="text-xs font-semibold text-[#134E4A] truncate block mt-1">{assignedTeacher.fullName}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-8 w-8 rounded-md bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center text-[#EF4444]">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-[#EF4444] block font-medium">Faculty Unassigned</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions keys */}
                  <div className="flex items-center gap-1 shrink-0 bg-[#FFFBF5] p-1 rounded-md border border-[#E2E8F0]">
                    <button
                      onClick={() => handleOpenEdit(subj)}
                      id={`edit-subject-btn-${subj.id}`}
                      className="p-1 px-1.5 text-[#64748B] hover:text-[#F59E0B] transition-colors cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(subj.id, subj.name)}
                      id={`delete-subject-btn-${subj.id}`}
                      className="p-1 px-1.5 text-[#64748B] hover:text-[#EF4444] transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog popup */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-2xl border border-[#E2E8F0] overflow-hidden text-left animate-zoom-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#FFFBF5]">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#0F766E]" />
                <h3 className="font-semibold text-[#134E4A] text-base tracking-tight">
                  {modalMode === 'add' ? 'Add Syllabus Course' : 'Edit Syllabus Course'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#134E4A] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">Course Subject Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Numerical Methods & Statistics"
                  className="saas-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">Subject Course Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="MTH-304"
                    className="saas-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">Branch Branch *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="saas-input"
                  >
                    {departmentsList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">Yearly Semester *</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="saas-input"
                  >
                    {semestersList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">Assign Default Faculty</label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="saas-input"
                  >
                    <option value="">Unassigned (Select Lecturer)</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName} ({t.department[0]}E)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="saas-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="saas-button-primary"
                >
                  {modalMode === 'add' ? 'Create Syllabus' : 'Save Syllabus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
