import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import { 
  FilePieChart, 
  Download, 
  FileText, 
  Loader2, 
  TrendingUp, 
  Award,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

interface SubjectBreakdown {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  attended: number;
  total: number;
  percentage: number;
}

interface AnalyticsData {
  present: number;
  late: number;
  absent: number;
  overallPercentage: number;
  totalClassesCount: number;
  totalAttendedCount: number;
  subjectBreakdown: SubjectBreakdown[];
}

export const StudentReports: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [exportMessage, setExportMessage] = useState('');

  const fetchAnalytics = async () => {
    try {
      const response = await api.get<AnalyticsData>('/api/student/attendance/analytics');
      setData(response);
    } catch (err) {
      console.error("Failed to fetch analytics for reporting:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = async (type: 'pdf' | 'excel') => {
    setExporting(type);
    setExportMessage('');
    try {
      // Execute the real download simulator endpoints
      const responseText = await api.get<string>(`/api/student/reports/export/${type}`);
      
      // Simulate creating and downloading actual document payloads directly in the browser
      const blob = new Blob([
        `==================================================\n`,
        `APEX INSTITUTE OF TECHNOLOGY - ACADEMIC ATTENDANCE REPORT\n`,
        `==================================================\n\n`,
        `Overall Attendance Score: ${data?.overallPercentage ?? 0}%\n`,
        `Total Tracked Lectures: ${data?.totalClassesCount ?? 0}\n`,
        `Attended: ${data?.totalAttendedCount ?? 0} lectures\n`,
        `Present Logs: ${data?.present ?? 0}\n`,
        `Late Logs: ${data?.late ?? 0}\n`,
        `Absent Logs: ${data?.absent ?? 0}\n\n`,
        `SUBJECT PROGRESS BREAKDOWN:\n`,
        (data?.subjectBreakdown ?? []).map(s => ` - [${s.subjectCode}] ${s.subjectName}: ${s.percentage}% (${s.attended}/${s.total})`).join('\n'),
        `\n\nGenerated payload details: ${responseText}`
      ], { type: 'text/plain' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Apex_Attendance_Report_${new Date().toISOString().split('T')[0]}.${type === 'pdf' ? 'txt' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportMessage(`Success: ${type.toUpperCase()} copy downloaded successfully.`);
    } catch (err) {
      console.error(`Export to ${type} failed:`, err);
      setExportMessage('Error: Generation stalled. Please review connection profiles.');
    } finally {
      // Auto fade message after 4 seconds
      setTimeout(() => {
        setExporting(null);
        setExportMessage('');
      }, 4000);
    }
  };

  if (loading) {
    return (
      <div id="reports-loading" className="flex items-center justify-center min-h-[40vh] bg-[#F8F9FA]">
        <div className="text-center select-none">
          <Loader2 className="h-8 w-8 text-[#0071E3] animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#6E6E73] font-mono uppercase tracking-wider">Compiling statistics directory...</p>
        </div>
      </div>
    );
  }

  const presents = data?.present ?? 0;
  const lates = data?.late ?? 0;
  const absents = data?.absent ?? 0;
  const totalSlots = presents + lates + absents;

  const presentPercentage = totalSlots > 0 ? Math.round((presents / totalSlots) * 100) : 0;
  const latePercentage = totalSlots > 0 ? Math.round((lates / totalSlots) * 100) : 0;
  const absentPercentage = totalSlots > 0 ? Math.round((absents / totalSlots) * 100) : 0;

  return (
    <div id="student-reports-logs-root" className="space-y-6 text-[#1D1D1F]">
      
      {/* Title segment */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="select-none">
          <h2 className="text-2xl font-bold text-[#1D1D1F]">Analytics Reports</h2>
          <p className="text-xs text-[#6E6E73] mt-1">Compile and print check-in audit trails, performance indices, and admit approval letters.</p>
        </div>

        {/* Download Buttons Simulators */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            id="export-pdf-report-btn"
            className="saas-button-secondary flex items-center gap-2 text-xs py-2 px-3.5"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#FF3B30]" />
            ) : (
              <FileText className="h-4 w-4 text-[#FF3B30]" />
            )}
            <span>PDF Print</span>
          </button>

          <button
            onClick={() => handleExport('excel')}
            id="export-excel-report-btn"
            disabled={exporting !== null}
            className="saas-button-secondary flex items-center gap-2 text-xs py-2 px-3.5"
          >
            {exporting === 'excel' ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#34C759]" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-[#34C759]" />
            )}
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* Export state messaging */}
      {exportMessage && (
        <div id="export-message-alert" className={`p-3.5 rounded-xl text-xs font-bold border select-none ${
          exportMessage.startsWith('Success') 
            ? 'bg-[#EAFBEF] border-[#34C759]/20 text-[#34C759]' 
            : 'bg-[#FDF2F2] border-[#FF3B30]/20 text-[#FF3B30]'
        }`}>
          {exportMessage}
        </div>
      )}

      {/* Grid: Left (Ratio pie visualizer), Right (Exam clearance Admit card) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left: Check-in statistics ratio diagram */}
        <div className="md:col-span-7 saas-card p-6 space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73] select-none">Status distribution index</h3>

          {/* Simple Animated CSS ratio bar */}
          <div className="space-y-4">
            
            {/* Present stats bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase text-[#6E6E73] select-none">
                <span>Present</span>
                <span className="text-[#34C759]">{presents} logs ({presentPercentage}%)</span>
              </div>
              <div className="h-2 bg-[#EAEAEA] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#34C759] rounded-full transition-all duration-550"
                  style={{ width: `${presentPercentage}%` }}
                />
              </div>
            </div>

            {/* Late stats bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase text-[#6E6E73] select-none">
                <span>Late Arrivals</span>
                <span className="text-[#FF9500]">{lates} logs ({latePercentage}%)</span>
              </div>
              <div className="h-2 bg-[#EAEAEA] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#FF9500] rounded-full transition-all duration-550"
                  style={{ width: `${latePercentage}%` }}
                />
              </div>
            </div>

            {/* Absent weight index bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase text-[#6E6E73] select-none">
                <span>Absents & Missing</span>
                <span className="text-[#FF3B30]">{absents} logs ({absentPercentage}%)</span>
              </div>
              <div className="h-2 bg-[#EAEAEA] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#FF3B30] rounded-full transition-all duration-550"
                  style={{ width: `${absentPercentage}%` }}
                />
              </div>
            </div>

          </div>

          <div className="p-4 bg-[#F8F9FA] border border-[#D2D2D7]/55 rounded-2xl flex items-center gap-3.5 select-none">
            <TrendingUp className="h-4.5 w-4.5 text-[#34C759] shrink-0" />
            <p className="text-[10px] text-[#6E6E73] leading-normal uppercase font-bold tracking-wider">
              Your class participation index has improved by <span className="text-[#34C759] font-extrabold">&bull; 4.2%</span> over the course of the preceding two weeks of instruction.
            </p>
          </div>
        </div>

        {/* Right: Academic Admit stance status card */}
        <div className="md:col-span-5 saas-card p-6 flex flex-col justify-between h-fit space-y-4">
          <div>
            <div className="flex items-center gap-2 text-[#0071E3] mb-4 select-none">
              <Award className="h-4.5 w-4.5" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider">Admit Approval Stance</h3>
            </div>

            <p className="text-xs text-[#6E6E73] leading-relaxed font-medium">
              Apex University mandates that students secure a minimum check-in average ratio of <span className="text-[#1D1D1F] font-bold">75%</span> to qualify for standard academic admit permissions. Below this boundary, exam halls remain locked until manually cleared.
            </p>

            {/* Overall clearance status display */}
            {(() => {
              const eligible = (data?.overallPercentage ?? 0) >= 75;
              return (
                <div className={`mt-6 p-5 rounded-2xl border text-center select-none ${
                  eligible 
                    ? 'bg-[#EAFBEF] border-[#34C759]/20 text-[#34C759]' 
                    : 'bg-[#FDF2F2] border-[#FF3B30]/20 text-[#FF3B30]'
                }`}>
                  <span className="text-[9px] uppercase font-mono block font-bold tracking-widest text-[#6E6E73]">Qualify Status</span>
                  <span className="text-xl font-extrabold block mt-1 tracking-tight">
                    {eligible ? 'EXAM ADMIT GRANTED' : 'EXAM CHANNELS MOUNTED'}
                  </span>
                  <span className="text-[10px] block mt-2 font-mono font-bold uppercase tracking-wide text-[#6E6E73]">
                    Current Rating: {data?.overallPercentage ?? 0}%
                  </span>
                </div>
              );
            })()}
          </div>

          <p className="text-[10px] text-[#6E6E73] leading-relaxed uppercase mt-4 font-bold tracking-wider text-center select-none">
            Print this receipt and bring it to any administrator to finalize physical qualification slips.
          </p>
        </div>

      </div>

    </div>
  );
};
