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
    <div className="space-y-6 animate-fade-in" id="attendance-logs-view">
      {/* Header and Manual Logging Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Ledger</h1>
          <p className="text-slate-500 text-xs mt-1">Review live check-ins, apply filters, and manually balance historical roll-calls.</p>
        </div>
        <button
          onClick={() => setShowLogModal(true)}
          id="manual-log-btn"
          className="bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 inline-flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Manual Entry Override</span>
        </button>
      </div>

      {/* Robust Advanced Filter Board */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-50 select-none">
          <Filter className="h-3.5 w-3.5 text-indigo-505" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Advanced Filter Suite</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Text Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search roll number or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-505 text-[11px] rounded-xl pl-9 pr-3 py-2.5 outline-none font-medium"
            />
          </div>

          {/* Date Picker */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-505 text-[11px] rounded-xl pl-9 pr-3 py-1.5 outline-none font-medium"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-[11px] font-medium rounded-xl p-2.5 outline-none focus:border-indigo-505"
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
            className="bg-slate-50 border border-slate-200 text-[11px] font-medium rounded-xl p-2.5 outline-none focus:border-indigo-505"
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
            className="bg-slate-50 border border-slate-200 text-[11px] font-medium rounded-xl p-2.5 outline-none focus:border-indigo-505"
          >
            <option value="All">All Instructors</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.fullName}</option>
            ))}
          </select>
        </div>

        {(searchQuery || dateFilter || subjectFilter !== 'All' || studentFilter !== 'All' || teacherFilter !== 'All') && (
          <div className="flex justify-end pt-1">
            <button
              onClick={clearFilters}
              className="text-[10px] text-red-500 hover:text-red-650 hover:underline transition-all min-w-[100px] text-right p-1 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Table grid listing */}
      {loading ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <CalendarCheck className="h-10 w-10 text-indigo-505 animate-pulse mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading ledger registry...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
          <CalendarCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Logs Listed</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            No active attendance roll-calls found matching your filters/query.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="attendance-table-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left" id="attendance-table">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 select-none">
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Roll Designator</th>
                  <th className="px-6 py-4">Academic Subject</th>
                  <th className="px-6 py-4">Session Date/Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Lecturer Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-xs text-slate-700">
                {filteredLogs.map((log) => {
                  const statusColors = {
                    Present: 'bg-emerald-50 border-emerald-100 text-emerald-800',
                    Late: 'bg-amber-50 border-amber-100 text-amber-800',
                    Absent: 'bg-red-50 border-red-100 text-red-800'
                  };

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors" id={`attendance-row-${log.id}`}>
                      {/* Name */}
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {log.studentName}
                      </td>

                      {/* Roll */}
                      <td className="px-6 py-4 font-mono font-medium text-slate-500">
                        {log.rollNumber}
                      </td>

                      {/* Course */}
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {log.subjectName}
                      </td>

                      {/* Date details */}
                      <td className="px-6 py-4 font-mono text-slate-600">
                        <span>{log.date}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{log.time}</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[log.status] || 'bg-slate-100'}`}>
                          {log.status}
                        </span>
                      </td>

                      {/* Teacher name */}
                      <td className="px-6 py-4 text-slate-500">
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden text-left animate-zoom-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-505" />
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">Manual Attendance Override</h3>
              </div>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1. Choose Student</label>
                <select
                  value={manStudentId}
                  onChange={(e) => setManStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">2. Academic Subject Course</label>
                <select
                  value={manSubjectId}
                  onChange={(e) => setManSubjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Check-in Status</label>
                  <select
                    value={manStatus}
                    onChange={(e) => setManStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505"
                  >
                    <option value="Present">Present (Early)</option>
                    <option value="Late">Late Entry</option>
                    <option value="Absent">Absent (Excused)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Execution Date</label>
                  <input
                    type="date"
                    required
                    value={manDate}
                    onChange={(e) => setManDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Timestamp Time</label>
                <input
                  type="text"
                  required
                  value={manTime}
                  onChange={(e) => setManTime(e.target.value)}
                  placeholder="09:15:00"
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
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
