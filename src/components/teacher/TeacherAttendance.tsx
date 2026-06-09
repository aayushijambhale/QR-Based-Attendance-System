import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import { Attendance, Subject } from '../../types.js';
import { 
  History, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar,
  Layers,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';

export const TeacherAttendance: React.FC = () => {
  const [logs, setLogs] = useState<Attendance[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateQuery, setDateQuery] = useState('');

  const loadAttendanceAndSubjects = async () => {
    try {
      const [hist, mySubjects] = await Promise.all([
        api.get<Attendance[]>('/api/teacher/attendance/history'),
        api.get<Subject[]>('/api/teacher/subjects')
      ]);

      // Sort logs by date and time descending
      const sorted = [...hist].sort((a, b) => {
        const fullA = new Date(`${a.date}T${a.time}`).getTime();
        const fullB = new Date(`${b.date}T${b.time}`).getTime();
        return fullB - fullA;
      });

      setLogs(sorted);
      setSubjects(mySubjects);
    } catch (e) {
      console.error("Failed to load attendance logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceAndSubjects();
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSubjectFilter('ALL');
    setStatusFilter('ALL');
    setDateQuery('');
  };

  const filteredLogs = logs.filter(log => {
    // 1. Search Query
    const searchMatch = 
      log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Subject Filter
    const subjectMatch = subjectFilter === 'ALL' || log.subjectId === subjectFilter;

    // 3. Status Filter
    const statusMatch = statusFilter === 'ALL' || log.status === statusFilter;

    // 4. Date Filter
    const dateMatch = !dateQuery || log.date === dateQuery;

    return searchMatch && subjectMatch && statusMatch && dateMatch;
  });

  if (loading) {
    return (
      <div className="py-20 text-center animate-pulse text-xs text-slate-400 font-mono">
        COLLECTING ACADEMIC RECORDS...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="teacher-attendance-logs-view">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">Log Records</h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervise chronological student entry transactions, apply filters, and audit historical record metrics.
          </p>
        </div>
        <button
          onClick={loadAttendanceAndSubjects}
          className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer w-fit"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reload Logs</span>
        </button>
      </div>

      {/* Filter Bento Panel */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3.5 border-b border-slate-50 font-bold">
          <Filter className="h-4 w-4 text-indigo-550" />
          <span className="text-xs text-slate-800 uppercase tracking-wider">Search Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
          {/* Search Roll / Name */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1.5">
              Query Enrolled Student
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Name or Roll No..."
                className="w-full bg-slate-50 border border-slate-205 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-indigo-505"
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1.5">
              Course Syllabus
            </label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 outline-none focus:border-indigo-505 cursor-pointer font-medium"
            >
              <option value="ALL">All Assigned Subjects</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1.5">
              Access Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 outline-none focus:border-indigo-505 cursor-pointer font-medium"
            >
              <option value="ALL">All Status Types</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1.5">
              Specific Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateQuery}
                onChange={(e) => setDateQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 outline-none focus:border-indigo-505 cursor-pointer font-medium pl-8 pr-4"
              />
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-430 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Clear query toggle */}
        {(searchQuery || subjectFilter !== 'ALL' || statusFilter !== 'ALL' || dateQuery) && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleResetFilters}
              className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table Output */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-50 mb-4 select-none">
          <h3 className="text-sm font-bold text-slate-800">Attendance Log Database</h3>
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
            {filteredLogs.length} matching rows
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-slate-350 bg-slate-50/20 border-2 border-dashed border-slate-100 rounded-2xl">
            <History className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold leading-normal">No Matching Student Entries</p>
            <p className="text-[10px] text-slate-400 mt-1">Try to expand filter options or trigger simulator check-ins!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs" id="attendance-tally-table">
              <thead>
                <tr className="border-b border-slate-105 text-[10px] font-bold text-slate-405 uppercase tracking-wider select-none">
                  <th className="py-3">Enrolled Student</th>
                  <th className="py-3">Subject / Course</th>
                  <th className="py-3">Recorded Date & Time</th>
                  <th className="py-3 text-right">Access Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50" id={`attendance-log-${log.id}`}>
                    {/* Student card */}
                    <td className="py-3.5 font-bold text-slate-900 pr-2">
                      <p>{log.studentName}</p>
                      <code className="text-[10px] font-mono text-slate-400 mt-1 block">Roll: {log.rollNumber}</code>
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 font-medium text-slate-600">
                      {log.subjectName}
                    </td>

                    {/* Date and dynamic clock time */}
                    <td className="py-3.5 font-mono text-slate-550 leading-relaxed">
                      <span>{log.date}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{log.time}</span>
                    </td>

                    {/* Access Status pill */}
                    <td className="py-3.5 text-right">
                      {log.status === 'Present' && (
                        <span className="px-2.5 py-0.5 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-800 text-[9px] font-extrabold inline-flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 shrink-0" />
                          PRESENT
                        </span>
                      )}
                      {log.status === 'Late' && (
                        <span className="px-2.5 py-0.5 rounded-full border border-amber-100 bg-amber-50 text-amber-805 text-[9px] font-extrabold inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          LATE
                        </span>
                      )}
                      {log.status === 'Absent' && (
                        <span className="px-2.5 py-0.5 rounded-full border border-red-105 bg-red-41/10 text-red-751 text-[9px] font-extrabold inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          ABSENT
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
