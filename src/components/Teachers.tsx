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
          <h1 className="text-2xl font-bold text-[#134E4A] tracking-tight">Faculty & Faculty Registry</h1>
          <p className="text-[#64748B] text-xs mt-1">Manage core educational system lectures and professors.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          id="add-teacher-trigger"
          className="saas-button-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Faculty</span>
        </button>
      </div>

      {/* Faculty Tools Controls */}
      <div className="saas-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search faculty by name, employee code..."
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

      {/* Selection Control Bar / Bulk Actions */}
      <div className="flex items-center gap-2 select-none text-xs">
        <label className="inline-flex items-center gap-2 cursor-pointer text-[#64748B] hover:text-[#0F766E] font-medium transition-colors">
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
            className="accent-[#0F766E] h-4 w-4 rounded border-[#E2E8F0]"
          />
          <span>Select All Faculty ({teachers.length})</span>
        </label>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-[#EAF5F5] border border-[#14B8A6] rounded-lg p-4 flex items-center justify-between animate-fade-in" id="teachers-bulk-actions-bar">
          <div className="flex items-center gap-2 text-[#0F766E] text-xs font-semibold">
            <CheckSquare className="h-4 w-4 text-[#14B8A6]" />
            <span>Selected {selectedIds.length} faculty members</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleBulkExport}
              className="saas-button-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Bulk Export (CSV)</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-[11px] font-bold px-3.5 py-1.5 rounded-md transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Bulk Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      {loading ? (
        <div className="text-center py-20 saas-card">
          <GraduationCap className="h-10 w-10 text-[#0F766E] animate-pulse mx-auto mb-3" />
          <p className="text-xs text-[#64748B]">Inspecting records of faculties...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div className="saas-card p-12 text-center">
          <GraduationCap className="h-12 w-12 text-[#64748B] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#134E4A]">No Instructor Registered</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-4">
            No active faculty matches your filtering parameters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="teachers-grid">
          {teachers.map((teach) => (
            <div 
              key={teach.id}
              className={`saas-card saas-card-hover relative group p-6 ${
                selectedIds.includes(teach.id) ? 'border-[#14B8A6] ring-1 ring-[#14B8A6]' : ''
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
                  className="accent-[#0F766E] h-4.5 w-4.5 rounded border-[#E2E8F0] cursor-pointer"
                />
              </div>
              {/* Profile Top header section */}
              <div className="flex items-start gap-4 mb-5 border-b border-[#E2E8F0] pb-4">
                <img
                  src={teach.profilePhoto}
                  alt={teach.fullName}
                  referrerPolicy="no-referrer"
                  className="h-14 w-14 rounded-md object-cover ring-1 ring-[#E2E8F0] shadow-sm"
                />
                <div className="overflow-hidden">
                  <h3 className="font-semibold text-[#134E4A] group-hover:text-[#0F766E] transition-colors truncate">{teach.fullName}</h3>
                  <span className="text-[10px] font-mono bg-[#FFFBF5] text-[#64748B] font-medium px-2 py-0.5 rounded border border-[#E2E8F0] mt-1.5 inline-block">
                    {teach.employeeId}
                  </span>
                </div>
              </div>

              {/* Specific info rows */}
              <div className="space-y-2.5 text-sm text-[#64748B] mb-6">
                <div className="flex items-center gap-2.5">
                  <Building className="h-4 w-4 text-[#14B8A6] shrink-0" />
                  <span className="truncate">{teach.department} Department</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-[#14B8A6] shrink-0" />
                  <span className="truncate">{teach.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-[#14B8A6] shrink-0" />
                  <span className="truncate">{teach.phoneNumber}</span>
                </div>
              </div>

              {/* Action operations row */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                <button
                  onClick={() => handleOpenView(teach)}
                  id={`view-teacher-btn-${teach.id}`}
                  className="text-xs text-[#0F766E] hover:text-[#134E4A] font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Bio</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(teach)}
                    id={`edit-teacher-btn-${teach.id}`}
                    className="p-1.5 text-[#64748B] hover:text-[#F59E0B] hover:bg-[#FEF3C7] rounded-md transition-colors cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(teach.id, teach.fullName)}
                    id={`delete-teacher-btn-${teach.id}`}
                    className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-md transition-colors cursor-pointer"
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
          <div className="bg-white rounded-lg w-full max-w-md shadow-2xl border border-[#E2E8F0] overflow-hidden text-left animate-zoom-in">
            {/* Title Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#FFFBF5]">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#0F766E]" />
                <h3 className="font-semibold text-[#134E4A] text-base tracking-tight">
                  {modalMode === 'add' && 'Register New Faculty'}
                  {modalMode === 'edit' && 'Edit Faculty Credentials'}
                  {modalMode === 'view' && 'Faculty Member Profile'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#134E4A] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalMode === 'view' && selectedTeacher ? (
              <div className="p-6 space-y-5 text-sm text-[#64748B]">
                <div className="text-center border-b border-[#E2E8F0] pb-5">
                  <img
                    src={selectedTeacher.profilePhoto}
                    alt={selectedTeacher.fullName}
                    referrerPolicy="no-referrer"
                    className="h-20 w-20 rounded-md object-cover ring-1 ring-[#E2E8F0] shadow-sm mx-auto mb-3"
                  />
                  <h4 className="text-lg font-bold text-[#134E4A]">{selectedTeacher.fullName}</h4>
                  <span className="text-[10px] uppercase font-mono bg-[#FFFBF5] text-[#64748B] font-bold px-2.5 py-1 rounded-md mt-1.5 inline-block border border-[#E2E8F0]">
                    ID: {selectedTeacher.employeeId}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B] font-medium font-sans uppercase text-[10px]">Academic Department</span>
                    <span className="font-semibold text-[#134E4A]">{selectedTeacher.department}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B] font-medium font-sans uppercase text-[10px]">Official Email</span>
                    <span className="font-semibold text-[#134E4A] truncate select-all">{selectedTeacher.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B] font-medium font-sans uppercase text-[10px]">Phone contact</span>
                    <span className="font-semibold text-[#134E4A] select-all">{selectedTeacher.phoneNumber}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full mt-4 saas-button-secondary"
                >
                  Close Profile card
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-1.5">Full Instructor Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Julia Roberts"
                    className="saas-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-1.5">Employee ID Code *</label>
                    <input
                      type="text"
                      required
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="EMP-CS-999"
                      className="saas-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-1.5">Division/Dept *</label>
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

                <div>
                  <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-1.5">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="saas-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-1.5">Phone Contact Number *</label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 0122_EXT"
                    className="saas-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-1.5">Faculty Avatar Photo URL</label>
                  <input
                    type="url"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    placeholder="https://..."
                    className="saas-input"
                  />
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
