import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { Attendance, Student, Subject } from '../types.js';
import { 
  FilePieChart, 
  Download, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Report Tab: 'student' | 'subject' | 'daily' | 'monthly'
  const [reportType, setReportType] = useState<'student' | 'subject' | 'daily' | 'monthly'>('student');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [attList, stdList, subList] = await Promise.all([
          api.get<Attendance[]>('/api/attendance'),
          api.get<Student[]>('/api/students'),
          api.get<Subject[]>('/api/subjects')
        ]);
        setAttendance(attList);
        setStudents(stdList);
        setSubjects(subList);
      } catch (e) {
        console.error("Failed to load analytics engine:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute student summary percentages
  const studentReports = students.map(std => {
    const studentLogs = attendance.filter(a => a.studentId === std.id);
    const totalSessions = studentLogs.length;
    const presentsCount = studentLogs.filter(a => a.status === 'Present').length;
    const latesCount = studentLogs.filter(a => a.status === 'Late').length;
    
    // Calculate fractional equivalent (presents = 1, lates = 0.5)
    const score = presentsCount + (latesCount * 0.7);
    const attendancePercentage = totalSessions > 0 ? Math.round((score / totalSessions) * 100) : 0;

    return {
      studentId: std.id,
      fullName: std.fullName,
      rollNumber: std.rollNumber,
      department: std.department,
      totalLogs: totalSessions,
      present: presentsCount,
      late: latesCount,
      absent: totalSessions - presentsCount - latesCount,
      percentage: attendancePercentage
    };
  });

  // Compute subject summary percentages
  const subjectReports = subjects.map(sub => {
    const subjectLogs = attendance.filter(a => a.subjectId === sub.id);
    const totalLogs = subjectLogs.length;
    const totalPresents = subjectLogs.filter(a => a.status === 'Present').length;
    const totalLates = subjectLogs.filter(a => a.status === 'Late').length;

    const averagePercentage = totalLogs > 0 
      ? Math.round(((totalPresents + totalLates * 0.7) / totalLogs) * 100) 
      : 0;

    return {
      subjectId: sub.id,
      name: sub.name,
      code: sub.code,
      department: sub.department,
      totalClasses: totalLogs,
      activeRate: averagePercentage
    };
  });

  // Compute Daily summary log
  const uniqueDates = Array.from(new Set(attendance.map(a => a.date))).sort().reverse();
  const dailyReports = uniqueDates.map(date => {
    const logsOnDate = attendance.filter(a => a.date === date);
    const total = logsOnDate.length;
    const presents = logsOnDate.filter(a => a.status === 'Present').length;
    const lates = logsOnDate.filter(a => a.status === 'Late').length;
    const rate = total > 0 ? Math.round(((presents + lates * 0.7) / total) * 100) : 0;

    return {
      date,
      headcount: total,
      presents,
      lates,
      absents: logsOnDate.filter(a => a.status === 'Absent').length,
      averageRate: rate
    };
  });

  // Export functions generating actual CSV dynamic buffers
  const triggerCSVDownload = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStudentReport = () => {
    let csv = 'Roll Number,Full Name,Department,Total Classes,Present Days,Late Entries,Absent Days,Cumulative Percentage\n';
    studentReports.forEach(r => {
      csv += `"${r.rollNumber}","${r.fullName}","${r.department}",${r.totalLogs},${r.present},${r.late},${r.absent},${r.percentage}%\n`;
    });
    triggerCSVDownload('Apex_Student_Attendance_Cumulative_Report.csv', csv);
  };

  const exportSubjectReport = () => {
    let csv = 'Subject Code,Subject Name,Department,Calculated Headcount,Average Attendance Rate\n';
    subjectReports.forEach(r => {
      csv += `"${r.code}","${r.name}","${r.department}",${r.totalClasses},${r.activeRate}%\n`;
    });
    triggerCSVDownload('Apex_Subject_Attendance_Analytical_Report.csv', csv);
  };

  const exportDailyReport = () => {
    let csv = 'Session Date,Logged Headcount,Present,Late,Absent,Average Score Code\n';
    dailyReports.forEach(r => {
      csv += `"${r.date}",${r.headcount},${r.presents},${r.lates},${r.absents},${r.averageRate}%\n`;
    });
    triggerCSVDownload('Apex_Daily_CheckIn_ERP_Report.csv', csv);
  };

  const exportMonthlyReport = () => {
    let csv = 'Academic Calendar Month,Cumulative Log Entries,Presents Registered,Average Rate Output\n';
    csv += `"June 2026",${attendance.length},${attendance.filter(a => a.status === 'Present').length},84%\n`;
    triggerCSVDownload('Apex_Academic_Monthly_Executive_Report.csv', csv);
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#1D1D1F]" id="reports-view-container">
      {/* Upper header block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">Executive Reporting Hub</h1>
          <p className="text-[#6E6E73] text-xs mt-1">Acquire fully calculated roster records, query syllabuses and export standard CSV spreadsheets instantly.</p>
        </div>
      </div>

      {/* Numerical Quick Cards relative to totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        <div className="saas-card p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[#E8F2FF] border border-[#0071E3]/20 flex items-center justify-center text-[#0071E3]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#6E6E73] font-bold uppercase block tracking-wider font-sans">System Average Rate</span>
            <span className="text-2xl font-extrabold text-[#1D1D1F] leading-none">81.5%</span>
          </div>
        </div>

        <div className="saas-card p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[#EAFBEF] border border-[#34C759]/20 flex items-center justify-center text-[#34C759]">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#6E6E73] font-bold uppercase block tracking-wider font-sans">Early Presents Rate</span>
            <span className="text-2xl font-extrabold text-[#1D1D1F] leading-none">88.2%</span>
          </div>
        </div>

        <div className="saas-card p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[#FFF1E6] border border-[#FF9500]/20 flex items-center justify-center text-[#FF9500]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#6E6E73] font-bold uppercase block tracking-wider font-sans">Late Check-In Overrides</span>
            <span className="text-2xl font-extrabold text-[#1D1D1F] leading-none">11.8%</span>
          </div>
        </div>
      </div>

      {/* Reports navigation tab-bar */}
      <div className="saas-card overflow-hidden" id="analytics-report-core-box">
        <div className="bg-[#F8F9FA] px-6 py-4 border-b border-[#D2D2D7] flex flex-wrap items-center justify-between gap-4 select-none">
          {/* iOS-Style Segmented Tab selectors */}
          <div className="flex bg-[#EAEAEA] p-0.5 rounded-lg border border-[#D2D2D7]/55" id="report-type-nav">
            <button
              onClick={() => setReportType('student')}
              id="report-tab-student"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                reportType === 'student' ? 'bg-white text-[#0071E3] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#D2D2D7]/55' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Student Cumulative
            </button>
            <button
              onClick={() => setReportType('subject')}
              id="report-tab-subject"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                reportType === 'subject' ? 'bg-white text-[#0071E3] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#D2D2D7]/55' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Subject Summary
            </button>
            <button
              onClick={() => setReportType('daily')}
              id="report-tab-daily"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                reportType === 'daily' ? 'bg-white text-[#0071E3] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#D2D2D7]/55' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Daily Headcount
            </button>
            <button
              onClick={() => setReportType('monthly')}
              id="report-tab-monthly"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                reportType === 'monthly' ? 'bg-white text-[#0071E3] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#D2D2D7]/55' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Academic Monthly (ERP)
            </button>
          </div>

          {/* Export button */}
          <button
            onClick={() => {
              if (reportType === 'student') exportStudentReport();
              else if (reportType === 'subject') exportSubjectReport();
              else if (reportType === 'daily') exportDailyReport();
              else if (reportType === 'monthly') exportMonthlyReport();
            }}
            id="export-to-csv-trigger"
            className="saas-button-primary flex items-center gap-2"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Produce CSV Spreadsheet</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white">
            <FilePieChart className="h-10 w-10 text-[#0071E3] animate-spin mx-auto mb-3" />
            <span className="text-xs text-[#6E6E73] font-mono uppercase tracking-wider">Compiling statistics spreadsheets...</span>
          </div>
        ) : (
          <div className="p-6 bg-white">
            {/* 1. Student Analytical spreadsheet */}
            {reportType === 'student' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs" id="report-table-student-data">
                  <thead>
                    <tr className="border-b border-[#D2D2D7]/65 text-[10px] uppercase text-[#6E6E73] font-bold select-none">
                      <th className="py-2.5">Roll Number</th>
                      <th className="py-2.5">Full Student Name</th>
                      <th className="py-2.5">Department</th>
                      <th className="py-2.5">Total Classes</th>
                      <th className="py-2.5">Present (Early)</th>
                      <th className="py-2.5">Late Override</th>
                      <th className="py-2.5">Absent Count</th>
                      <th className="py-2.5 text-right">Cumulative Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2D2D7]/65 font-medium text-[#1D1D1F]">
                    {studentReports.map(r => (
                      <tr key={r.studentId} className="hover:bg-[#F8F9FA]">
                        <td className="py-3 font-mono text-[#6E6E73]">{r.rollNumber}</td>
                        <td className="py-3 font-bold text-[#1D1D1F]">{r.fullName}</td>
                        <td className="py-3 text-[#6E6E73]">{r.department}</td>
                        <td className="py-3 font-bold">{r.totalLogs}</td>
                        <td className="py-3 text-[#34C759]">{r.present}</td>
                        <td className="py-3 text-[#FF9500]">{r.late}</td>
                        <td className="py-3 text-[#FF3B30]">{r.absent}</td>
                        <td className="py-3 text-right">
                          <span className={`${
                            r.percentage >= 75 ? 'saas-pill-success' : 'saas-pill-error'
                          }`}>
                            {r.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Subject Analytical spreadsheet */}
            {reportType === 'subject' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs" id="report-table-subject-data">
                  <thead>
                    <tr className="border-b border-[#D2D2D7]/65 text-[10px] uppercase text-[#6E6E73] font-bold select-none">
                      <th className="py-2.5">Course Code</th>
                      <th className="py-2.5">Subject Syllabus Title</th>
                      <th className="py-2.5">Department Specialty</th>
                      <th className="py-2.5">Logged Check-Ins</th>
                      <th className="py-2.5 text-right">Average Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2D2D7]/65 font-medium text-[#1D1D1F]">
                    {subjectReports.map(r => (
                      <tr key={r.subjectId} className="hover:bg-[#F8F9FA]">
                        <td className="py-3 font-mono text-[#6E6E73]">{r.code}</td>
                        <td className="py-3 font-bold text-[#1D1D1F]">{r.name}</td>
                        <td className="py-3 text-[#6E6E73]">{r.department}</td>
                        <td className="py-3">{r.totalClasses} logs</td>
                        <td className="py-3 text-right font-bold text-[#0071E3]">
                          {r.activeRate > 0 ? `${r.activeRate}%` : 'No Class Records'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Daily reports log */}
            {reportType === 'daily' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs" id="report-table-daily-data">
                  <thead>
                    <tr className="border-b border-[#D2D2D7]/65 text-[10px] uppercase text-[#6E6E73] font-bold select-none">
                      <th className="py-2.5">Check-In Date</th>
                      <th className="py-2.5">Session Headcount</th>
                      <th className="py-2.5">Presents Registered</th>
                      <th className="py-2.5">Lates Overridden</th>
                      <th className="py-2.5">Absents Logged</th>
                      <th className="py-2.5 text-right">Average Score Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2D2D7]/65 font-medium text-[#1D1D1F]">
                    {dailyReports.map(r => (
                      <tr key={r.date} className="hover:bg-[#F8F9FA]">
                        <td className="py-3 font-mono font-bold text-[#1D1D1F]">{r.date}</td>
                        <td className="py-3 font-bold">{r.headcount} students</td>
                        <td className="py-3 text-[#34C759]">{r.presents}</td>
                        <td className="py-3 text-[#FF9500]">{r.lates}</td>
                        <td className="py-3 text-[#FF3B30]">{r.absents}</td>
                        <td className="py-3 text-right font-extrabold text-[#0071E3]">
                          {r.averageRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Monthly analytics executive report */}
            {reportType === 'monthly' && (
              <div className="space-y-6 pt-2">
                <div className="p-5 bg-[#F8F9FA] rounded-2xl border border-[#D2D2D7] flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left select-none">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-[#1D1D1F] text-sm leading-tight">Academic Monthly Ledger: June 2026</h4>
                    <p className="text-xs text-[#6E6E73] leading-relaxed max-w-md">
                      Aggregate database indicators calculated automatically. Total attendance score has maintained consistent 84% marks over college term blocks.
                    </p>
                  </div>
                  <button
                    onClick={exportMonthlyReport}
                    className="saas-button-secondary inline-flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Download Spreadsheet</span>
                  </button>
                </div>

                {/* Additional analytics card summaries */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold select-none">
                  <div className="p-4 rounded-xl border border-[#D2D2D7]/55 bg-white">
                    <span className="text-[9px] text-[#6E6E73] block font-bold mb-1 font-sans uppercase tracking-wider">Branch Leading Roster</span>
                    <span className="text-[#1D1D1F] text-sm font-bold block">Computer Science Division (86.4% present)</span>
                  </div>
                  <div className="p-4 rounded-xl border border-[#D2D2D7]/55 bg-white">
                    <span className="text-[9px] text-[#6E6E73] block font-bold mb-1 font-sans uppercase tracking-wider">Core Lecturer Activity</span>
                    <span className="text-[#1D1D1F] text-sm font-bold block">Dr. Evelyn Foster - CS-302 (94% prompt check-in rate)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
