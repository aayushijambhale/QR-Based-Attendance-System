import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import { 
  Calendar, 
  Search, 
  Clock, 
  Loader2
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
    <div id="student-attendance-logs-root" className="space-y-6 text-[#1D1D1F]">
      
      {/* Overview stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 select-none">
        <div className="saas-card p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-[#6E6E73] tracking-wider">Total Lectures</span>
          <p className="text-2xl font-extrabold text-[#1D1D1F] mt-1">{total}</p>
        </div>
        <div className="saas-card p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-[#6E6E73] tracking-wider">Present</span>
          <p className="text-2xl font-extrabold text-[#34C759] mt-1">{present}</p>
        </div>
        <div className="saas-card p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-[#6E6E73] tracking-wider">Late Arrivals</span>
          <p className="text-2xl font-extrabold text-[#FF9500] mt-1">{late}</p>
        </div>
        <div className="saas-card p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-[#6E6E73] tracking-wider">Absents</span>
          <p className="text-2xl font-extrabold text-[#FF3B30] mt-1">{absent}</p>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center justify-between">
        
        {/* Search bar inputs */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6E6E73]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject or lecturer name..."
            id="search-attendance-logs-field"
            className="saas-input pl-9"
          />
        </div>

        {/* Status Dropdowns Segmented Control */}
        <div className="flex items-center gap-2 select-none">
          <div className="flex bg-[#EAEAEA] p-0.5 border border-[#D2D2D7]/55 rounded-lg gap-0.5">
            {(['All', 'Present', 'Late', 'Absent'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                id={`status-filter-btn-${st}`}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                  statusFilter === st 
                    ? 'bg-white text-[#0071E3] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#D2D2D7]/55' 
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Main Results Board */}
      <div className="saas-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D2D2D7]/55 select-none bg-[#F8F9FA]">
          <h3 className="text-[10px] font-bold text-[#1D1D1F] uppercase tracking-wider">Attendance Ledger History</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white">
            <Loader2 className="h-7 w-7 text-[#0071E3] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D2D2D7]/65 text-[10px] font-bold uppercase text-[#6E6E73] tracking-wider select-none">
                  <th className="py-3 px-6">Session Date & Time</th>
                  <th className="py-3 px-6">Subject Course</th>
                  <th className="py-3 px-6">Assigned Faculty</th>
                  <th className="py-3 px-6 text-right pr-6">Check-In Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2D2D7]/65 text-xs text-[#1D1D1F]">
                {logs.map((log) => {
                  const statusColors: any = {
                    Present: 'saas-pill-success',
                    Late: 'saas-pill-warning',
                    Absent: 'saas-pill-error'
                  };
                  return (
                    <tr key={log.id} id={`log-row-${log.id}`} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="py-4 px-6 font-semibold">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-[#6E6E73]" />
                          <div>
                            <span className="block text-[#1D1D1F]">{log.date}</span>
                            <span className="block text-[10px] text-[#6E6E73] font-mono mt-0.5">{log.time}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="block font-bold text-[#1D1D1F]">{log.subjectName}</span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-[#6E6E73]">{log.teacherName}</td>
                      <td className="py-4 px-6 text-right pr-6">
                        <span className={`${statusColors[log.status] || 'saas-pill-warning'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-14 text-center text-xs text-[#6E6E73] italic select-none">
                      No matching records found.
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
