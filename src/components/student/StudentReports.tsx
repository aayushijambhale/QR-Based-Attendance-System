import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import { 
  BarChart3, 
  Download, 
  FileText, 
  HelpCircle, 
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
      }, 4005);
    }
  };

  if (loading) {
    return (
      <div id="reports-loading" className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-505 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Compiling statistics matrix...</p>
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
  const absentPercentage = totalSlots > 0 ? Math.round((absents / totalSlots) * 150) : 0; // standard simulated absent weight index

  return (
    <div id="student-reports-logs-root" className="space-y-6">
      
      {/* Title segment */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Analytics Reports</h2>
          <p className="text-xs text-slate-400 mt-1">Compile and print official check-in audit trails, performance indices, and admit approval letters.</p>
        </div>

        {/* Download Buttons Simulators */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            id="export-pdf-report-btn"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-350 text-xs font-bold uppercase tracking-wider select-none cursor-pointer"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-400" />
            ) : (
              <FileText className="h-4 w-4 text-red-500" />
            )}
            <span>PDF Print</span>
          </button>

          <button
            onClick={() => handleExport('excel')}
            id="export-excel-report-btn"
            disabled={exporting !== null}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-350 text-xs font-bold uppercase tracking-wider select-none cursor-pointer"
          >
            {exporting === 'excel' ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-450" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            )}
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* Export state messaging */}
      {exportMessage && (
        <div id="export-message-alert" className={`p-3.5 rounded-xl text-xs uppercase font-extrabold tracking-wider border ${
          exportMessage.startsWith('Success') 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {exportMessage}
        </div>
      )}

      {/* Grid: Left (Ratio pie visualizer), Right (Exam clearance Admit card) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left: Check-in statistics ratio diagram */}
        <div className="md:col-span-7 p-6 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl space-y-6">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-350">Status distribution index</h3>

          {/* Simple Animated CSS ratio bar */}
          <div className="space-y-4">
            
            {/* Present stats bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold uppercase font-mono text-slate-400">
                <span>Present</span>
                <span className="text-emerald-400 font-bold">{presents} logs ({presentPercentage}%)</span>
              </div>
              <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${presentPercentage}%` }}
                />
              </div>
            </div>

            {/* Late stats bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold uppercase font-mono text-slate-400">
                <span>Late Arrivals</span>
                <span className="text-amber-400 font-bold">{lates} logs ({latePercentage}%)</span>
              </div>
              <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${latePercentage}%` }}
                />
              </div>
            </div>

            {/* Absent weight index bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold uppercase font-mono text-slate-400">
                <span>Absents & Missing</span>
                <span className="text-rose-450 font-bold">{absents} logs ({absentPercentage}%)</span>
              </div>
              <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(absentPercentage, 100)}%` }}
                />
              </div>
            </div>

          </div>

          <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl flex items-center gap-3.5">
            <TrendingUp className="h-5 w-5 text-emerald-400 shrink-0" />
            <p className="text-[11px] text-slate-500 leading-normal uppercase font-bold tracking-wide">
              Your class participation index has improved by <span className="text-emerald-400">&bull; 4.2%</span> over the course of the preceding two weeks of instruction.
            </p>
          </div>
        </div>

        {/* Right: Academic Admit stance status card */}
        <div className="md:col-span-5 p-6 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-4">
              <Award className="h-4 w-4" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-450">Admit Approval Stance</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Apex University mandates that students secure a minimum check-in average ratio of <span className="text-slate-200 font-bold">75%</span> to qualify for standard academic admit permissions. Below this boundary, exam halls remain locked until manually cleared.
            </p>

            {/* Overall clearance status display */}
            {(() => {
              const eligible = (data?.overallPercentage ?? 0) >= 75;
              return (
                <div className={`mt-6 p-5 rounded-2xl border text-center ${
                  eligible 
                    ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400' 
                    : 'bg-rose-500/5 border-rose-500/15 text-rose-450'
                }`}>
                  <span className="text-[10px] uppercase font-mono block font-bold tracking-widest text-slate-500">Qualify Status</span>
                  <span className="text-2xl font-black block mt-1 tracking-tight">
                    {eligible ? 'EXAM ADMIT GRANTED' : 'EXAM CHANNELS MOUNTED'}
                  </span>
                  <span className="text-[11px] block mt-2 font-mono uppercase tracking-wide text-slate-400">
                    Current Rating: {data?.overallPercentage ?? 0}%
                  </span>
                </div>
              );
            })()}
          </div>

          <p className="text-[10px] text-slate-505 leading-relaxed uppercase mt-4 font-bold tracking-wide text-center">
            Print this receipt and bring it to any administrator to finalize physical qualification slips.
          </p>
        </div>

      </div>

    </div>
  );
};
