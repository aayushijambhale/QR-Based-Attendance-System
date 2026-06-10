import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Student } from '../types.js';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Eye, 
  X,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Download,
  CheckSquare
} from 'lucide-react';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal Control
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form Field States
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('TE');
  const [division, setDivision] = useState('A');
  const [profilePhoto, setProfilePhoto] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Sorting State
  const [sortField, setSortField] = useState<'fullName' | 'rollNumber'>('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await api.get<Student[]>('/api/students', {
        q: searchQuery,
        department: deptFilter,
        year: yearFilter
      });
      setStudents(data);
      setSelectedIds([]); // Clear selection when filters change
      setCurrentPage(1); // Reset to base page
    } catch (e) {
      console.error("Failed to load students list", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    const selectedStudents = students.filter(s => selectedIds.includes(s.id));
    const headers = ['ID', 'Full Name', 'Roll Number', 'Email', 'Department', 'Year', 'Division'];
    const csvRows = [
      headers.join(','),
      ...selectedStudents.map(s => [
        s.id,
        `"${s.fullName.replace(/"/g, '""')}"`,
        s.rollNumber,
        s.email,
        s.department,
        s.year,
        s.division
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `apex_students_bulk_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (count === 0) return;
    const confirmed = window.confirm(`Are you sure you want to deregister the ${count} selected students? This will delete all of their history forever.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => api.delete(`/api/students/${id}`)));
      setSelectedIds([]);
      await fetchStudents();
      alert(`Successfully deregistered ${count} students.`);
    } catch (err: any) {
      alert(err.message || 'Bulk delete failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, deptFilter, yearFilter]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedStudent(null);
    setFullName('');
    setRollNumber('');
    setEmail('');
    setDepartment('Computer Science');
    setYear('TE');
    setDivision('A');
    setProfilePhoto('');
    setShowModal(true);
  };

  const handleOpenEdit = (student: Student) => {
    setModalMode('edit');
    setSelectedStudent(student);
    setFullName(student.fullName);
    setRollNumber(student.rollNumber);
    setEmail(student.email);
    setDepartment(student.department);
    setYear(student.year);
    setDivision(student.division);
    setProfilePhoto(student.profilePhoto || '');
    setShowModal(true);
  };

  const handleOpenView = (student: Student) => {
    setModalMode('view');
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleDelete = async (studentId: string, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to completely deregister student "${name}"? This deletes all associated attendance history logs permanent!`);
    if (!confirmed) return;

    try {
      await api.delete(`/api/students/${studentId}`);
      fetchStudents();
    } catch (e: any) {
      alert(e.message || 'Deregistation failed.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !rollNumber || !email) {
      alert('Required registration fields are incomplete.');
      return;
    }

    try {
      if (modalMode === 'add') {
        await api.post('/api/students', {
          fullName,
          rollNumber,
          email,
          department,
          year,
          division,
          profilePhoto
        });
      } else if (modalMode === 'edit' && selectedStudent) {
        await api.put(`/api/students/${selectedStudent.id}`, {
          fullName,
          rollNumber,
          email,
          department,
          year,
          division,
          profilePhoto
        });
      }
      setShowModal(false);
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Form operation failed.');
    }
  };

  // Sorting triggers
  const triggerSort = (field: 'fullName' | 'rollNumber') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sort and paginate computed students arrays
  const sortedStudents = [...students].sort((a, b) => {
    let checkA = a[sortField].toLowerCase();
    let checkB = b[sortField].toLowerCase();
    if (sortOrder === 'asc') {
      return checkA > checkB ? 1 : -1;
    } else {
      return checkA < checkB ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = sortedStudents.slice(startIndex, startIndex + itemsPerPage);

  const departmentsList = ['Computer Science', 'Electronics', 'Mechanical', 'Electrical', 'Information Technology'];
  const yearsList = ['FE', 'SE', 'TE', 'BE'];

  return (
    <div className="space-y-6 animate-fade-in" id="students-view-container">
      {/* Header and Add Student Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#134E4A] tracking-tight">Student Enrollment Registry</h1>
          <p className="text-[#64748B] text-xs mt-1">Register, configure, and inspect all student roster parameters.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          id="add-student-trigger"
          className="saas-button-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Roster Controls Tool Belt */}
      <div className="saas-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Searchbar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search roster by name, roll, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="saas-input pl-9 py-2.5"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#64748B] select-none">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="saas-input py-2"
            >
              <option value="All">All Departments</option>
              {departmentsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#64748B] select-none">Year:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="saas-input py-2"
            >
              <option value="All">All Years</option>
              {yearsList.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk action selection bar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#EAF5F5] border border-[#14B8A6] rounded-lg p-4 flex items-center justify-between animate-fade-in" id="students-bulk-actions-bar">
          <div className="flex items-center gap-2 text-[#0F766E] text-xs font-semibold">
            <CheckSquare className="h-4 w-4 text-[#14B8A6]" />
            <span>Selected {selectedIds.length} students</span>
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

      {/* Main Table View */}
      {loading ? (
        <div className="text-center py-20 saas-card">
          <GraduationCap className="h-10 w-10 text-[#0F766E] animate-pulse mx-auto mb-3" />
          <p className="text-xs text-[#64748B]">Filtering student registrations...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="saas-card p-12 text-center">
          <GraduationCap className="h-12 w-12 text-[#64748B] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#134E4A]">No Roster Entries Match</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-4">
            No registrations exist for the current filter settings. Click "Add New Student" to enroll.
          </p>
        </div>
      ) : (
        <div className="saas-card overflow-hidden" id="students-table-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left" id="students-table">
              <thead>
                <tr className="bg-transparent text-[10px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#F1F5F9] select-none">
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedIds.includes(s.id))}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          const pageIds = paginatedStudents.map(s => s.id);
                          setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
                        } else {
                          const pageIds = paginatedStudents.map(s => s.id);
                          setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
                        }
                      }}
                      className="accent-[#0F766E] h-4 w-4 rounded border-[#E2E8F0]"
                    />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-[#0F766E] transition-colors" onClick={() => triggerSort('fullName')}>
                    Full Name {sortField === 'fullName' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-[#0F766E] transition-colors" onClick={() => triggerSort('rollNumber')}>
                    Roll Number {sortField === 'rollNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4">Department / Division</th>
                  <th className="px-6 py-4">Year Level</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-sm text-[#134E4A]">
                {paginatedStudents.map((std) => (
                  <tr key={std.id} className={`hover:bg-[#F8FAFC] transition-colors ${selectedIds.includes(std.id) ? 'bg-[#EAF5F5]' : ''}`} id={`student-row-${std.id}`}>
                    {/* Checkbox column */}
                    <td className="px-6 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(std.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            setSelectedIds(prev => [...prev, std.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== std.id));
                          }
                        }}
                        className="accent-[#0F766E] h-4 w-4 rounded border-[#E2E8F0] cursor-pointer"
                      />
                    </td>
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={std.profilePhoto}
                          alt={std.fullName}
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-md object-cover ring-1 ring-[#E2E8F0] shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-[#134E4A] leading-tight">{std.fullName}</p>
                          <p className="text-xs text-[#64748B] truncate mt-0.5">{std.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Roll */}
                    <td className="px-6 py-4 font-mono font-medium text-[#64748B]">
                      {std.rollNumber}
                    </td>

                    {/* Dept */}
                    <td className="px-6 py-4">
                      <span className="font-medium text-[#134E4A] block text-sm">{std.department}</span>
                      <span className="text-xs text-[#64748B] block mt-0.5">Division: {std.division}</span>
                    </td>

                    {/* Year level badges */}
                    <td className="px-6 py-4">
                      <span className="saas-pill-success">
                        {std.year}
                      </span>
                    </td>

                    {/* Actions tools */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenView(std)}
                          id={`student-view-${std.id}`}
                          title="View student card"
                          className="p-1.5 text-[#64748B] hover:text-[#0F766E] hover:bg-[#EAF5F5] rounded-md transition-all cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(std)}
                          id={`student-edit-${std.id}`}
                          title="Edit student particulars"
                          className="p-1.5 text-[#64748B] hover:text-[#F59E0B] hover:bg-[#FEF3C7] rounded-md transition-all cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(std.id, std.fullName)}
                          id={`student-delete-${std.id}`}
                          title="Deregister student"
                          className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-md transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="bg-white border-t border-[#F1F5F9] px-6 py-4 flex items-center justify-between" id="students-pagination">
              <span className="text-sm text-[#64748B]">
                Displaying <b>{startIndex + 1} - {Math.min(startIndex + itemsPerPage, students.length)}</b> of <b>{students.length}</b> enrolled
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="p-1.5 rounded-md border border-[#E2E8F0] bg-white hover:bg-[#FFFBF5] text-[#64748B] disabled:opacity-40 select-none cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="mx-2 text-sm font-medium text-[#134E4A]">Page {currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="p-1.5 rounded-md border border-[#E2E8F0] bg-white hover:bg-[#FFFBF5] text-[#64748B] disabled:opacity-40 select-none cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Roster form dialog / Popups */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl border border-[#E2E8F0] overflow-hidden text-left animate-zoom-in">
            {/* Title segment */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#FFFBF5]">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#0F766E]" />
                <h3 className="font-semibold text-[#134E4A] text-base tracking-tight">
                  {modalMode === 'add' && 'Enroll New Student'}
                  {modalMode === 'edit' && 'Edit Student Record'}
                  {modalMode === 'view' && 'Inspection Profile Card'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#134E4A] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalMode === 'view' && selectedStudent ? (
              // Display Detail card
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left border-b border-[#E2E8F0] pb-5">
                  <img
                    src={selectedStudent.profilePhoto}
                    alt={selectedStudent.fullName}
                    referrerPolicy="no-referrer"
                    className="h-24 w-24 rounded-md object-cover ring-1 ring-[#E2E8F0]"
                  />
                  <div>
                    <h4 className="text-xl font-bold text-[#134E4A]">{selectedStudent.fullName}</h4>
                    <span className="text-xs bg-[#EAF5F5] text-[#0F766E] border border-[#14B8A6] rounded-md px-2.5 py-1 inline-block mt-2 font-medium uppercase">
                      {selectedStudent.year}
                    </span>
                    <span className="text-xs text-[#64748B] block mt-2">Registration ID: {selectedStudent.id}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-[#FFFBF5] p-3.5 rounded-md border border-[#E2E8F0]">
                    <span className="block text-[#64748B] mb-1 font-semibold uppercase tracking-wider text-[10px]">Class Roll Number</span>
                    <span className="font-mono font-medium text-[#134E4A]">{selectedStudent.rollNumber}</span>
                  </div>
                  <div className="bg-[#FFFBF5] p-3.5 rounded-md border border-[#E2E8F0]">
                    <span className="block text-[#64748B] mb-1 font-semibold uppercase tracking-wider text-[10px]">Enrolled Department</span>
                    <span className="font-medium text-[#134E4A]">{selectedStudent.department}</span>
                  </div>
                  <div className="bg-[#FFFBF5] p-3.5 rounded-md border border-[#E2E8F0]">
                    <span className="block text-[#64748B] mb-1 font-semibold uppercase tracking-wider text-[10px]">Class Division</span>
                    <span className="font-mono font-medium text-[#134E4A]">Division {selectedStudent.division}</span>
                  </div>
                  <div className="bg-[#FFFBF5] p-3.5 rounded-md border border-[#E2E8F0]">
                    <span className="block text-[#64748B] mb-1 font-semibold uppercase tracking-wider text-[10px]">Email Coordinates</span>
                    <span className="font-medium text-[#134E4A] truncate block">{selectedStudent.email}</span>
                  </div>
                </div>

                <div className="text-right pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="saas-button-secondary"
                  >
                    Close Sheet
                  </button>
                </div>
              </div>
            ) : (
              // Add or Edit Fields Form
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Aayushi Jambhale"
                      className="saas-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">Class Roll Number *</label>
                    <input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="CS-2023-45"
                      className="saas-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">Email Identity *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@student.edu"
                      className="saas-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">Roster Department *</label>
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

                  <div>
                    <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">Division Identity *</label>
                    <select
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className="saas-input"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">Academics Year Level *</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="saas-input"
                    >
                      <option value="FE">FE (First Year)</option>
                      <option value="SE">SE (Second Year)</option>
                      <option value="TE">TE (Third Year)</option>
                      <option value="BE">BE (Fourth Year)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wider mb-2">Profile Photo URL (Optional)</label>
                    <input
                      type="url"
                      value={profilePhoto}
                      onChange={(e) => setProfilePhoto(e.target.value)}
                      placeholder="https://..."
                      className="saas-input"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="saas-button-secondary"
                  >
                    Cancel Action
                  </button>
                  <button
                    type="submit"
                    className="saas-button-primary"
                  >
                    {modalMode === 'add' ? 'Confirm Registry' : 'Save Changes'}
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
