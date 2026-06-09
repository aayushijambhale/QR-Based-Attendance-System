import React, { useState } from 'react';
import { QRSession, Attendance, Student, Subject } from '../../types.js';
import { Calendar, Search, ChevronLeft, ChevronRight, Eye, Printer, X, CheckCircle, Clock, AlertTriangle, Users } from 'lucide-react';

interface Props {
  sessions: QRSession[];
  attendance: Attendance[];
  students: Student[];
  subjects: Subject[];
  onViewSessionDetails?: (session: QRSession) => void;
}

export const TeacherPastSessions: React.FC<Props> = ({ sessions, attendance, students, subjects, onViewSessionDetails }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<QRSession | null>(null);
  
  const itemsPerPage = 5;

  // Filter sessions by teacher already done in parent, but let's filter by query here
  const filteredSessions = sessions.filter(sess => {
    return sess.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           sess.sessionCode.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate pagination bounds
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + itemsPerPage);

  // Compute stats for a specific session code/subject
  const getSessionStats = (sess: QRSession) => {
    const sessionDate = new Date(sess.generatedTime).toISOString().split('T')[0];
    const sessLogs = attendance.filter(
      log => log.subjectId === sess.subjectId && log.date === sessionDate
    );
    const present = sessLogs.filter(log => log.status === 'Present').length;
    const late = sessLogs.filter(log => log.status === 'Late').length;
    
    return {
      totalPresent: present + late,
      present,
      late,
      dateFormatted: new Date(sess.generatedTime).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      timeFormatted: new Date(sess.generatedTime).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  // Student roster for selected session details
  const getSessionRoster = (sess: QRSession) => {
    const sessionDate = new Date(sess.generatedTime).toISOString().split('T')[0];
    
    // Find matching subject to identify department
    const subject = subjects.find(s => s.id === sess.subjectId);
    if (!subject) return [];

    // Get all students enrolled in this department
    const deptStudents = students.filter(
      s => s.department.toLowerCase() === subject.department.toLowerCase()
    );

    // Map each student to their attendance status or mark them Absent if missing
    return deptStudents.map(student => {
      const matchLog = attendance.find(
        a => a.studentId === student.id && a.subjectId === sess.subjectId && a.date === sessionDate
      );

      return {
        id: student.id,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        status: matchLog ? matchLog.status : 'Absent',
        time: matchLog ? matchLog.time : '--:--:--'
      };
    }).sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleViewDetails = (sess: QRSession) => {
    setSelectedSession(sess);
    if (onViewSessionDetails) {
      onViewSessionDetails(sess);
    }
  };

  const currentRoster = selectedSession ? getSessionRoster(selectedSession) : [];
  const selectedStats = selectedSession ? getSessionStats(selectedSession) : null;
  const totalStudentsInDept = selectedSession ? currentRoster.length : 0;
  const presentCount = selectedSession ? currentRoster.filter(r => r.status === 'Present' || r.status === 'Late').length : 0;
  const absentCount = selectedSession ? currentRoster.filter(r => r.status === 'Absent').length : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs" id="teacher-past-sessions-subcomponent">
      {/* Header and Search controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-50 mb-4 select-none">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Activity Journal</h3>
          <p className="text-[10px] text-slate-400 font-medium">Chronological catalog of conducted gates and student check-ins.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Subject or Code..."
            className="w-full bg-slate-50 border border-slate-205 text-xs rounded-xl py-2 pl-9 pr-4 outline-none focus:border-indigo-505 placeholder:text-slate-400 font-medium"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Main sessions table */}
      {filteredSessions.length === 0 ? (
        <div className="py-12 text-center text-slate-350 bg-slate-50/20 border border-dashed border-slate-100 rounded-2xl select-none">
          <Calendar className="h-8 w-8 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-500">No Session Logs Match Search</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                  <th className="py-3">Release Date & Time</th>
                  <th className="py-3">Course Name</th>
                  <th className="py-3 text-center">Students Checked-in</th>
                  <th className="py-3 text-right">Integrity Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-55/60 text-slate-700">
                {paginatedSessions.map((sess) => {
                  const stats = getSessionStats(sess);
                  return (
                    <tr key={sess.id} className="hover:bg-slate-50/50 transition-colors" id={`past-sess-${sess.id}`}>
                      <td className="py-3.5 font-mono text-slate-600">
                        <span className="font-semibold text-slate-800">{stats.dateFormatted}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{stats.timeFormatted}</span>
                      </td>
                      <td className="py-3.5 font-bold text-slate-900">
                        <p>{sess.subjectName}</p>
                        <code className="text-[10px] font-mono text-slate-450 block mt-0.5 font-normal uppercase">Code: {sess.sessionCode.slice(-9)}</code>
                      </td>
                      <td className="py-3.5 text-center font-bold text-slate-800 font-mono">
                        <span className="px-2 py-1 bg-indigo-50/60 rounded-lg text-indigo-700 border border-indigo-100 text-[10px]">
                          {stats.totalPresent} Present
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleViewDetails(sess)}
                          className="text-indigo-600 hover:text-indigo-805 bg-slate-50 hover:bg-slate-100/80 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-slate-205 transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-50 pt-4 text-xs select-none">
              <span className="text-slate-455 font-medium">
                Showing <strong className="font-bold text-slate-800">{startIndex + 1}</strong> to <strong className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredSessions.length)}</strong> of <strong className="font-bold text-slate-800">{filteredSessions.length}</strong> items
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 font-semibold text-slate-705">
                  Page <strong className="font-bold text-slate-800">{currentPage}</strong> of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Roster detail sheet modal */}
      {selectedSession && selectedStats && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-zoom-in"
            id="printable-session-detail"
          >
            {/* Header print display / standard display */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 shrink-0 select-none print:bg-white print:border-b-2 print:border-black">
              <div className="text-left">
                <h4 className="font-mono text-[9px] text-indigo-650 font-bold tracking-widest uppercase block print:text-black">APEX ATTENDANCE ERP PORTAL</h4>
                <h3 className="font-extrabold text-slate-900 text-sm leading-tight print:text-lg">Session Attendance Report</h3>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-705 text-white hover:shadow-md rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Generate paper summary or PDF"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Summary</span>
                </button>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Syllabus details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-55/30 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-600 print:border-black print:rounded-none">
                <div className="space-y-2">
                  <p><span className="text-slate-400 uppercase font-bold text-[9px] block">Course Name:</span>
                    <strong className="text-slate-900 font-bold text-sm block print:text-black mt-0.5">{selectedSession.subjectName}</strong>
                  </p>
                  <p><span className="text-slate-400 uppercase font-bold text-[9px] block">Released Date/Time:</span>
                    <span className="font-mono text-slate-700 block mt-0.5">{selectedStats.dateFormatted} @ {selectedStats.timeFormatted}</span>
                  </p>
                  <p><span className="text-slate-400 uppercase font-bold text-[9px] block">Authorized Faculty:</span>
                    <span className="text-slate-700 block mt-0.5">{selectedSession.teacherName}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <p><span className="text-slate-400 uppercase font-bold text-[9px] block">Security Session Code:</span>
                    <code className="text-[11px] font-mono block text-indigo-700 bg-indigo-50 border border-indigo-100 p-1 rounded-md w-fit font-bold mt-0.5 print:text-black print:bg-white print:border-none print:p-0">
                      {selectedSession.sessionCode}
                    </code>
                  </p>
                  <p><span className="text-slate-400 uppercase font-bold text-[9px] block">Session Status:</span>
                    <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 text-[9px] font-extrabold rounded-full ${
                      selectedSession.status === 'Active' ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' : 'bg-slate-100 border border-slate-200 text-slate-400'
                    }`}>
                      {selectedSession.status.toUpperCase()}
                    </span>
                  </p>
                  <div className="flex items-center gap-4 mt-2 bg-white/80 p-2.5 rounded-xl border border-slate-55 shrink-0 print:border-none print:p-0">
                    <div className="flex items-center gap-1.5 text-indigo-650">
                      <Users className="h-4.5 w-4.5" />
                      <div className="leading-none text-left">
                        <span className="text-[10px] text-slate-400 block font-normal">Present Ratios</span>
                        <strong className="text-xs font-mono font-extrabold text-slate-800">{presentCount} / {totalStudentsInDept}</strong>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-slate-100" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Absences Registered</span>
                      <strong className="text-xs text-red-500 font-mono font-bold">{absentCount} Absent</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance list table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide select-none print:text-black">Participant Check-in Records</h4>
                
                <div className="border border-slate-100 rounded-2xl overflow-hidden print:border-black print:rounded-none">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 print:bg-white print:border-b-2 print:border-black print:text-black">
                        <th className="py-2.5 px-4">Roll Number</th>
                        <th className="py-2.5 px-4">Student Name</th>
                        <th className="py-2.5 px-4">Recorded Time</th>
                        <th className="py-2.5 px-4 text-right">Gate Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {currentRoster.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/40">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900 print:text-black">
                            {item.rollNumber}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-700 print:text-black">
                            {item.fullName}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500 print:text-black">
                            {item.time}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {item.status === 'Present' && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-extrabold print:text-black print:bg-white print:border-none">
                                PRESENT
                              </span>
                            )}
                            {item.status === 'Late' && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-extrabold print:text-black print:bg-white print:border-none font-sans">
                                LATE
                              </span>
                            )}
                            {item.status === 'Absent' && (
                              <span className="px-2 py-0.5 rounded-lg bg-red-40/10 text-red-700 border border-red-100 text-[9px] font-extrabold print:text-black print:bg-white print:border-none">
                                ABSENT
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {currentRoster.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400 font-bold">
                            No students enrolled in this course department.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Printed visual signature row (visible only in print view!) */}
              <div className="hidden print:flex justify-between items-end mt-20 pt-10 border-t border-dashed border-slate-300">
                <div className="text-xs text-left">
                  <p className="font-semibold">{selectedSession.teacherName}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">Faculty Lector Signature</p>
                  <p className="text-[9px] text-gray-400 font-mono mt-1">Date: ________________________</p>
                </div>
                <div className="text-xs text-right">
                  <p className="font-semibold text-slate-800">Apex Administration Office</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5 font-bold">ERP GATEWAY SEAL</p>
                  <p className="text-[9px] text-gray-400 font-mono mt-1">Printed: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
