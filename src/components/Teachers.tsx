import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Teacher } from '../types.js';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Eye, 
  X,
  Phone,
  Mail,
  Building,
  GraduationCap,
  Download,
  CheckSquare
} from 'lucide-react';

export const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal control
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Form Field States
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const data = await api.get<Teacher[]>('/api/teachers', {
        q: searchQuery,
        department: deptFilter
      });
      setTeachers(data);
      setSelectedIds([]); // Clear selection when criteria change
    } catch (e) {
      console.error("Failed to fetch teachers", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    const selectedTeachers = teachers.filter(t => selectedIds.includes(t.id));
    const headers = ['ID', 'Full Name', 'Employee ID', 'Department', 'Email', 'Phone Number'];
    const csvRows = [
      headers.join(','),
      ...selectedTeachers.map(t => [
        t.id,
        `"${t.fullName.replace(/"/g, '""')}"`,
        t.employeeId,
        t.department,
        t.email,
        t.phoneNumber
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `apex_teachers_bulk_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (count === 0) return;
    const confirmed = window.confirm(`Are you sure you want to deregister the ${count} selected faculty members? This will unassign them from all classes.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => api.delete(`/api/teachers/${id}`)));
      setSelectedIds([]);
      await fetchTeachers();
      alert(`Successfully deregistered ${count} faculty members.`);
    } catch (err: any) {
      alert(err.message || 'Bulk delete failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [searchQuery, deptFilter]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedTeacher(null);
    setFullName('');
    setEmployeeId('');
    setEmail('');
    setDepartment('Computer Science');
    setPhoneNumber('');
    setProfilePhoto('');
    setShowModal(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setModalMode('edit');
    setSelectedTeacher(t);
    setFullName(t.fullName);
    setEmployeeId(t.employeeId);
    setEmail(t.email);
    setDepartment(t.department);
    setPhoneNumber(t.phoneNumber);
    setProfilePhoto(t.profilePhoto || '');
    setShowModal(true);
  };

  const handleOpenView = (t: Teacher) => {
    setModalMode('view');
    setSelectedTeacher(t);
    setShowModal(true);
  };

  const handleDelete = async (teacherId: string, name: string) => {
    const confirmed = window.confirm(`Really deregister department faculty "${name}"? This unassigns them from all core academic subjects!`);
    if (!confirmed) return;

    try {
      await api.delete(`/api/teachers/${teacherId}`);
      fetchTeachers();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !employeeId || !email || !phoneNumber) {
      alert('Required particulars remain empty.');
      return;
    }

    try {
      if (modalMode === 'add') {
        await api.post('/api/teachers', {
          fullName,
          employeeId,
          email,
          department,
          phoneNumber,
          profilePhoto
        });
      } else if (modalMode === 'edit' && selectedTeacher) {
        await api.put(`/api/teachers/${selectedTeacher.id}`, {
          fullName,
          employeeId,
          email,
          department,
          phoneNumber,
          profilePhoto
        });
      }
      setShowModal(false);
      fetchTeachers();
    } catch (err: any) {
      alert(err.message || 'Form submission failed.');
    }
  };

  const departmentsList = ['Computer Science', 'Electronics', 'Mechanical', 'Electrical', 'Information Technology'];

  return (
    <div className="space-y-6 animate-fade-in" id="teachers-view-container">
      {/* Header and Add Teacher Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty & Faculty Registry</h1>
          <p className="text-slate-500 text-xs mt-1">Manage core educational system lectures and professors.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          id="add-teacher-trigger"
          className="bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 inline-flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Faculty</span>
        </button>
      </div>

      {/* Faculty Tools Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty by name, employee code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-400 select-none">Branch:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl p-2 outline-none cursor-pointer focus:border-indigo-505 w-full sm:w-auto"
          >
            <option value="All">All Departments</option>
            {departmentsList.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selection Control Bar / Bulk Actions */}
      <div className="flex items-center gap-2 select-none text-xs">
        <label className="inline-flex items-center gap-2 cursor-pointer text-slate-500 hover:text-indigo-600 font-semibold transition-colors">
          <input
            type="checkbox"
            checked={teachers.length > 0 && teachers.every(t => selectedIds.includes(t.id))}
            onChange={(e) => {
              const checked = e.target.checked;
              if (checked) {
                setSelectedIds(teachers.map(t => t.id));
              } else {
                setSelectedIds([]);
              }
            }}
            className="accent-indigo-600 h-4 w-4 rounded border-slate-350"
          />
          <span>Select All Faculty ({teachers.length})</span>
        </label>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-4 flex items-center justify-between animate-fade-in" id="teachers-bulk-actions-bar">
          <div className="flex items-center gap-2 text-indigo-900 text-xs font-semibold">
            <CheckSquare className="h-4 w-4 text-indigo-600" />
            <span>Selected {selectedIds.length} faculty members</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleBulkExport}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Bulk Export (CSV)</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-red-650 hover:bg-red-700 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-red-600/10 cursor-pointer inline-flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Bulk Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      {loading ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <GraduationCap className="h-10 w-10 text-indigo-500 animate-pulse mx-auto mb-3" />
          <p className="text-xs text-slate-400">Inspecting records of faculties...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
          <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Instructor Registered</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            No active faculty matches your filtering parameters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="teachers-grid">
          {teachers.map((teach) => (
            <div 
              key={teach.id}
              className={`bg-white rounded-3xl border hover:border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative group p-6 ${
                selectedIds.includes(teach.id) ? 'border-indigo-300 ring-2 ring-indigo-100/50' : 'border-slate-100/85'
              }`}
              id={`teacher-card-${teach.id}`}
            >
              {/* Checkbox badge overlay in top-right */}
              <div className="absolute top-4 right-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(teach.id)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (checked) {
                      setSelectedIds(prev => [...prev, teach.id]);
                    } else {
                      setSelectedIds(prev => prev.filter(id => id !== teach.id));
                    }
                  }}
                  className="accent-indigo-600 h-4.5 w-4.5 rounded border-slate-300 cursor-pointer"
                />
              </div>
              {/* Profile Top header section */}
              <div className="flex items-start gap-4 mb-5 border-b border-slate-100/70 pb-4">
                <img
                  src={teach.profilePhoto}
                  alt={teach.fullName}
                  referrerPolicy="no-referrer"
                  className="h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
                />
                <div className="overflow-hidden">
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{teach.fullName}</h3>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-md mt-1.5 inline-block">
                    {teach.employeeId}
                  </span>
                </div>
              </div>

              {/* Specific info rows */}
              <div className="space-y-2.5 text-xs text-slate-600 mb-6">
                <div className="flex items-center gap-2.5">
                  <Building className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{teach.department} Department</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{teach.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{teach.phoneNumber}</span>
                </div>
              </div>

              {/* Action operations row */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100/70">
                <button
                  onClick={() => handleOpenView(teach)}
                  id={`view-teacher-btn-${teach.id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Bio</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(teach)}
                    id={`edit-teacher-btn-${teach.id}`}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(teach.id, teach.fullName)}
                    id={`delete-teacher-btn-${teach.id}`}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog Box modals */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden text-left animate-zoom-in">
            {/* Title Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">
                  {modalMode === 'add' && 'Register New Faculty'}
                  {modalMode === 'edit' && 'Edit Faculty Credentials'}
                  {modalMode === 'view' && 'Faculty Member Profile'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalMode === 'view' && selectedTeacher ? (
              <div className="p-6 space-y-5 text-xs text-slate-700">
                <div className="text-center border-b border-slate-100 pb-5">
                  <img
                    src={selectedTeacher.profilePhoto}
                    alt={selectedTeacher.fullName}
                    referrerPolicy="no-referrer"
                    className="h-20 w-20 rounded-2xl object-cover ring-4 ring-indigo-50 shadow-md mx-auto mb-3"
                  />
                  <h4 className="text-lg font-bold text-slate-900">{selectedTeacher.fullName}</h4>
                  <span className="text-[10px] uppercase font-mono bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded-md mt-1.5 inline-block border border-slate-200/50">
                    ID: {selectedTeacher.employeeId}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-medium font-sans uppercase text-[10px]">Academic Department</span>
                    <span className="font-semibold text-slate-800">{selectedTeacher.department}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-medium font-sans uppercase text-[10px]">Official Email</span>
                    <span className="font-semibold text-slate-800 truncate select-all">{selectedTeacher.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-medium font-sans uppercase text-[10px]">Phone contact</span>
                    <span className="font-semibold text-slate-800 select-all">{selectedTeacher.phoneNumber}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer"
                >
                  Close Profile card
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Instructor Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Julia Roberts"
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Employee ID Code *</label>
                    <input
                      type="text"
                      required
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="EMP-CS-999"
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Division/Dept *</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505"
                    >
                      {departmentsList.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Contact Number *</label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 0122_EXT"
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Faculty Avatar Photo URL</label>
                  <input
                    type="url"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
                  >
                    {modalMode === 'add' ? 'Confirm Credentials' : 'Commit Particulars'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
