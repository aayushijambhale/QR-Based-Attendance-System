import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import { 
  Calendar, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Download,
  Loader2,
  ListFilter
} from 'lucide-react';

interface AttendanceLog {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  subjectId: string;
  subjectName: string;
  date: string;
  time: string;
  status: 'Present' | 'Late' | 'Absent';
  teacherId: string;
  teacherName: string;
}

export const StudentAttendance: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Present' | 'Late' | 'Absent'>('All');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Fetches current student historical attendance matching search parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const response = await api.get<AttendanceLog[]>(`/api/student/attendance/history?${params.toString()}`);
      setLogs(response);
    } catch (err) {
      console.error("Failed to load historical check-ins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchQuery, statusFilter]);

  // Aggregate stats from the fetched records
  const total = logs.length;
  const present = logs.filter(l => l.status === 'Present').length;
  const late = logs.filter(l => l.status === 'Late').length;
  const absent = logs.filter(l => l.status === 'Absent').length;

  return (
    <div id="student-attendance-logs-root" className="space-y-6">
      
      {/* Overview stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Lectures</span>
          <p className="text-2xl font-black text-slate-100 mt-1">{total}</p>
        </div>
        <div className="p-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Present</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{present}</p>
        </div>
        <div className="p-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Late Arrivals</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{late}</p>
        </div>
        <div className="p-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-505 tracking-wider">Absents</span>
          <p className="text-2xl font-black text-rose-450 mt-1">{absent}</p>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center justify-between">
        
        {/* Search bar inputs */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject or faculty name..."
            id="search-attendance-logs-field"
            className="w-full bg-slate-900/60 border border-slate-800 pl-10 pr-4 py-2.5 text-xs rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-semibold"
          />
        </div>

        {/* Status Dropdowns */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 border border-slate-900 rounded-xl gap-1">
            {(['All', 'Present', 'Late', 'Absent'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                id={`status-filter-btn-${st}`}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg select-none cursor-pointer ${
                  statusFilter === st 
                    ? 'bg-slate-900 text-emerald-400 border border-slate-800' 
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Main Results Board */}
      <div className="p-6 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Attendance Logs Terminal</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="pb-3 pl-2">Session Date & Time</th>
                  <th className="pb-3">Course / Curricula Item</th>
                  <th className="pb-3">Assigned Faculty</th>
                  <th className="pb-3 text-right pr-2">Attainment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40">
                {logs.map((log) => {
                  const isLate = log.status === 'Late';
                  const isAbsent = log.status === 'Absent';
                  return (
                    <tr key={log.id} id={`log-row-${log.id}`} className="text-xs text-slate-300 hover:bg-slate-950/25 transition-colors">
                      <td className="py-4 pl-2 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <div>
                            <span className="block text-slate-200">{log.date}</span>
                            <span className="block text-[10px] text-slate-505 font-mono mt-0.5">{log.time}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="block font-bold text-slate-200">{log.subjectName}</span>
                        <span className="block text-[10px] text-slate-450 mt-1 uppercase">Department Criteria Match</span>
                      </td>
                      <td className="py-4 font-semibold text-slate-300">{log.teacherName}</td>
                      <td className="py-4 text-right pr-2">
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

                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-14 text-center text-xs text-slate-550 italic">
                      No matches found. Select alternate filter scopes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
