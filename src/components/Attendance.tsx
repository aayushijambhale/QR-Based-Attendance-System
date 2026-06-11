import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Attendance, Student, Subject, Teacher } from '../types.js';
import { 
  CalendarCheck, 
  Search, 
  Calendar, 
  BookOpen, 
  Filter, 
  Plus, 
  X,
  UserCheck
} from 'lucide-react';

export const AttendanceLogs: React.FC = () => {
  const [logs, setLogs] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [studentFilter, setStudentFilter] = useState('All');
  const [teacherFilter, setTeacherFilter] = useState('All');

  // Manual logging modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [manStudentId, setManStudentId] = useState('');
  const [manSubjectId, setManSubjectId] = useState('');
  const [manStatus, setManStatus] = useState<'Present' | 'Late' | 'Absent'>('Present');
  const [manDate, setManDate] = useState(new Date().toISOString().split('T')[0]);
  const [manTime, setManTime] = useState(new Date().toTimeString().split(' ')[0]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allLogs, allStudents, allSubjects, allTeachers] = await Promise.all([
        api.get<Attendance[]>('/api/attendance', {
          q: searchQuery,
          date: dateFilter,
          subjectId: subjectFilter,
          studentId: studentFilter,
          teacherId: teacherFilter
        }),
        api.get<Student[]>('/api/students'),
        api.get<Subject[]>('/api/subjects'),
        api.get<Teacher[]>('/api/teachers')
      ]);

      setLogs(allLogs);
      setStudents(allStudents);
      setSubjects(allSubjects);
      setTeachers(allTeachers);

      // Pre-select first values for manual logs
      if (allStudents.length && !manStudentId) setManStudentId(allStudents[0].id);
      if (allSubjects.length && !manSubjectId) setManSubjectId(allSubjects[0].id);
    } catch (e) {
      console.error("Failed to load attendance metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, dateFilter, subjectFilter, studentFilter, teacherFilter]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manStudentId || !manSubjectId) {
      alert('Selected elements are invalid.');
      return;
    }

    try {
      await api.post('/api/attendance', {
        studentId: manStudentId,
        subjectId: manSubjectId,
        date: manDate,
        time: manTime,
        status: manStatus
      });
      setShowLogModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Logging error.');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('');
    setSubjectFilter('All');
    setStudentFilter('All');
    setTeacherFilter('All');
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const rollMatch = log.rollNumber ? log.rollNumber.toLowerCase().includes(query) : false;
    const subjectMatch = log.subjectName ? log.subjectName.toLowerCase().includes(query) : false;
    const studentMatch = log.studentName ? log.studentName.toLowerCase().includes(query) : false;
    return rollMatch || subjectMatch || studentMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in text-[#1D1D1F]" id="attendance-logs-view">
      {/* Header and Manual Logging Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">Attendance Ledger</h1>
          <p className="text-[#6E6E73] text-xs mt-1">Review live check-ins, apply filters, and manually override history logs.</p>
        </div>
        <button
          onClick={() => setShowLogModal(true)}
          id="manual-log-btn"
          className="saas-button-primary inline-flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Manual Entry Override</span>
        </button>
      </div>

      {/* Robust Advanced Filter Board */}
      <div className="saas-card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#D2D2D7]/55 select-none">
          <Filter className="h-3.5 w-3.5 text-[#0071E3]" />
          <span className="text-[10px] font-bold text-[#1D1D1F] uppercase tracking-wider">Advanced Filter Suite</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          {/* Text Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E6E73]" />
            <input
              type="text"
              placeholder="Search roll number or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="saas-input pl-9"
            />
          </div>

          {/* Date Picker */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E6E73] pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="saas-input pl-9"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="saas-input"
          >
            <option value="All">All Course Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

          {/* Student Filter */}
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="saas-input"
          >
            <option value="All">All Students</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>

          {/* Teacher Filter */}
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="saas-input"
          >
            <option value="All">All Instructors</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.fullName}</option>
            ))}
          </select>
        </div>

        {(searchQuery || dateFilter || subjectFilter !== 'All' || studentFilter !== 'All' || teacherFilter !== 'All') && (
          <div className="flex justify-end pt-1 select-none">
            <button
              onClick={clearFilters}
              className="text-[10px] text-[#FF3B30] hover:text-[#E03026] hover:underline transition-all min-w-[100px] text-right p-1 font-bold uppercase tracking-wider cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Table grid listing */}
      {loading ? (
        <div className="text-center py-20 saas-card">
          <CalendarCheck className="h-10 w-10 text-[#0071E3] animate-pulse mx-auto mb-3" />
          <p className="text-xs text-[#6E6E73] font-mono uppercase tracking-wider">Loading ledger registry...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="saas-card p-12 text-center">
          <CalendarCheck className="h-10 w-10 text-[#6E6E73] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#1D1D1F]">No Logs Listed</h3>
          <p className="text-xs text-[#6E6E73] max-w-sm mx-auto mt-1 mb-4">
            No active attendance roll-calls found matching your filters.
          </p>
        </div>
      ) : (
        <div className="saas-card overflow-hidden" id="attendance-table-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left" id="attendance-table">
              <thead>
                <tr className="bg-transparent text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider border-b border-[#D2D2D7]/65 select-none">
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Roll Designator</th>
                  <th className="px-6 py-4">Academic Subject</th>
                  <th className="px-6 py-4">Session Date/Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Lecturer Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2D2D7]/65 text-sm text-[#1D1D1F]">
                {filteredLogs.map((log) => {
                  const statusColors: any = {
                    Present: 'saas-pill-success',
                    Late: 'saas-pill-warning',
                    Absent: 'saas-pill-error'
                  };

                  return (
                    <tr key={log.id} className="hover:bg-[#F8F9FA] transition-colors" id={`attendance-row-${log.id}`}>
                      {/* Name */}
                      <td className="px-6 py-4 font-bold text-[#1D1D1F]">
                        {log.studentName}
                      </td>

                      {/* Roll */}
                      <td className="px-6 py-4 font-mono font-semibold text-[#6E6E73]">
                        {log.rollNumber}
                      </td>

                      {/* Course */}
                      <td className="px-6 py-4 font-bold text-[#1D1D1F]">
                        {log.subjectName}
                      </td>

                      {/* Date details */}
                      <td className="px-6 py-4 font-mono text-[#6E6E73]">
                        <span>{log.date}</span>
                        <span className="text-[10px] text-[#6E6E73] block mt-0.5">{log.time}</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`${statusColors[log.status] || 'saas-pill-warning'}`}>
                          {log.status}
                        </span>
                      </td>

                      {/* Teacher name */}
                      <td className="px-6 py-4 text-[#6E6E73] font-medium">
                        {log.teacherName}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual log modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-[#D2D2D7] overflow-hidden text-left animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D2D2D7]">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#0071E3]" />
                <h3 className="font-bold text-[#1D1D1F] text-base tracking-tight">Manual Attendance Override</h3>
              </div>
              <button onClick={() => setShowLogModal(false)} className="text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">1. Choose Student</label>
                <select
                  value={manStudentId}
                  onChange={(e) => setManStudentId(e.target.value)}
                  className="saas-input"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">2. Academic Subject Course</label>
                <select
                  value={manSubjectId}
                  onChange={(e) => setManSubjectId(e.target.value)}
                  className="saas-input"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">Check-in Status</label>
                  <select
                    value={manStatus}
                    onChange={(e) => setManStatus(e.target.value as any)}
                    className="saas-input"
                  >
                    <option value="Present">Present (Early)</option>
                    <option value="Late">Late Entry</option>
                    <option value="Absent">Absent (Excused)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">Execution Date</label>
                  <input
                    type="date"
                    required
                    value={manDate}
                    onChange={(e) => setManDate(e.target.value)}
                    className="saas-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">Timestamp Time</label>
                <input
                  type="text"
                  required
                  value={manTime}
                  onChange={(e) => setManTime(e.target.value)}
                  placeholder="09:15:00"
                  className="saas-input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D2D2D7]">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="saas-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="saas-button-primary"
                >
                  Write Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
