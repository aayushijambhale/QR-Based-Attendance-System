import React, { useState } from 'react';
import { api } from '../../utils/api.js';
import { 
  QrCode, 
  Camera, 
  Upload, 
  Keyboard, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Lock,
  Sparkles,
  RefreshCcw,
  ArrowRight
} from 'lucide-react';

export const StudentQRScanner: React.FC = () => {
  const [activeMethod, setActiveMethod] = useState<'camera' | 'upload' | 'manual'>('manual');
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Custom Toast/Modal states for immediate audit result feedback
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      studentName: string;
      subjectName: string;
      status: string;
      time: string;
      date: string;
    }
  } | null>(null);

  const handleSubmitCode = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        record: {
          studentName: string;
          subjectName: string;
          status: string;
          time: string;
          date: string;
        };
      }>('/api/student/scan-attendance', { sessionCode: code.trim() });

      setResult({
        success: true,
        message: response.message,
        details: response.record
      });
      setManualCode('');
    } catch (err: any) {
      setResult({
        success: false,
        message: err.error || err.message || 'Verification failed. Please review your session code.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    // Simulate reading QR code from uploaded image
    setTimeout(() => {
      // Prompt user with active simulations
      const mockClassCode = "QR_ATT_CS-401_SIMULATED";
      handleSubmitCode(mockClassCode);
    }, 1500);
  };

  const [simulatedCameraScanning, setSimulatedCameraScanning] = useState(false);
  const handleSimulateCameraTrigger = () => {
    setSimulatedCameraScanning(true);
    // Mimics reading a QR Code within 3 seconds
    setTimeout(() => {
      setSimulatedCameraScanning(false);
      // Fetches active sessions or passes a standard dummy CS course code
      handleSubmitCode("QR_ATT_CS-302_SIMULATED");
    }, 2500);
  };

  return (
    <div id="student-qr-scanner-container" className="max-w-2xl mx-auto space-y-6">
      
      {/* Title block */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-slate-100 flex items-center justify-center gap-2">
          <QrCode className="h-5.5 w-5.5 text-emerald-400" />
          <span>Dynamic QR Check-In</span>
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Verify your classroom presence immediately. Select your preferred method below to scan and submit attendance records.
        </p>
      </div>

      {/* Tabs Menu selectors */}
      <div className="grid grid-cols-3 p-1 bg-slate-950 rounded-xl border border-slate-900">
        <button
          onClick={() => { setActiveMethod('manual'); setResult(null); }}
          id="tab-manual-entry"
          className={`py-2 px-3 text-xs font-semibold rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMethod === 'manual' 
              ? 'bg-slate-900 border border-slate-800 text-emerald-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Keyboard className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Manual Code</span>
        </button>

        <button
          onClick={() => { setActiveMethod('upload'); setResult(null); }}
          id="tab-image-upload"
          className={`py-2 px-3 text-xs font-semibold rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMethod === 'upload' 
              ? 'bg-slate-900 border border-slate-800 text-emerald-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Upload Image</span>
        </button>

        <button
          onClick={() => { setActiveMethod('camera'); setResult(null); }}
          id="tab-camera-scan"
          className={`py-2 px-3 text-xs font-semibold rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMethod === 'camera' 
              ? 'bg-slate-900 border border-slate-800 text-emerald-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Camera className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Camera Live</span>
        </button>
      </div>

      {/* Method panels */}
      <div id="method-panels-body" className="p-8 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 min-h-[220px] flex items-center justify-center">
        
        {/* PANEL A: Manual Code Input */}
        {activeMethod === 'manual' && (
          <div id="panel-manual-entry" className="w-full max-w-md space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Attendance Session Code
              </label>
              
              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. QR_ATT_CS-401_K93J1A"
                  id="session-code-input-field"
                  className="flex-1 bg-slate-950 border border-slate-850 px-4 py-3 text-sm rounded-xl text-slate-105 placeholder:text-slate-650 focus:outline-none focus:border-emerald-550 focus:ring-1 focus:ring-emerald-555 font-mono"
                />
                
                <button
                  onClick={() => handleSubmitCode(manualCode)}
                  id="submit-session-code-btn"
                  disabled={loading || !manualCode.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl px-4.5 font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Submit</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              * Note: In development/iframe settings, developers can simply copy the active code from the teacher's generator screen and submit it here.
            </p>
          </div>
        )}

        {/* PANEL B: QR Image upload */}
        {activeMethod === 'upload' && (
          <div id="panel-image-upload" className="w-full text-center space-y-4">
            <div className="max-w-xs mx-auto">
              <label className="border-2 border-dashed border-slate-800 hover:border-emerald-550 bg-slate-950 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
                
                {loading ? (
                  <div className="space-y-2 py-2">
                    <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mx-auto" />
                    <p className="text-xs text-slate-350">Analyzing QR segments...</p>
                  </div>
                ) : (
                  <div className="space-y-2 py-2 text-slate-450">
                    <Upload className="h-8 w-8 mx-auto" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">Select QR Image</span>
                    <span className="text-[10px] text-slate-500 block leading-normal mt-1">Upload a snapshot or saved screenshot of the lecture QR</span>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* PANEL C: Camera Simulation */}
        {activeMethod === 'camera' && (
          <div id="panel-camera" className="w-full max-w-xs text-center space-y-6">
            
            {/* Visual Viewfinder framing box styling */}
            <div className="relative aspect-square max-w-[200px] mx-auto bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-center overflow-hidden">
              {/* Pulsing corners styling */}
              <div className="absolute top-3 left-3 h-4 w-4 border-t-2 border-l-2 border-emerald-400 animate-pulse" />
              <div className="absolute top-3 right-3 h-4 w-4 border-t-2 border-r-2 border-emerald-400 animate-pulse" />
              <div className="absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-emerald-400 animate-pulse" />
              <div className="absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-emerald-400 animate-pulse" />

              {simulatedCameraScanning ? (
                <div className="space-y-2 text-center animate-pulse z-10">
                  <div className="h-1 bg-emerald-500/80 w-32 rounded-full mx-auto" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Focusing lens...</p>
                </div>
              ) : (
                <div className="text-slate-600 flex flex-col items-center justify-center">
                  <Camera className="h-8 w-8 animate-bounce mb-3 text-slate-650" />
                  <span className="text-[9px] font-extrabold text-slate-450 tracking-widest uppercase mt-1">Camera Feed</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSimulateCameraTrigger}
              id="simulate-camera-scan-btn"
              disabled={simulatedCameraScanning || loading}
              className="bg-slate-950 border border-slate-850 hover:bg-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 transition-colors uppercase gap-2 items-center inline-flex select-none cursor-pointer"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${simulatedCameraScanning ? 'animate-spin' : ''}`} />
              <span>{simulatedCameraScanning ? 'Reading Code...' : 'Trigger Scan simulation'}</span>
            </button>
          </div>
        )}

      </div>

      {/* RESULT/FEEDBACK PRESENTATION TILES AND MODALS */}
      {result && (
        <div 
          id="verification-result-panel"
          className={`p-6 rounded-2xl border flex flex-col gap-4 animate-fade-in ${
            result.success 
              ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
              : 'bg-rose-500/5 border-rose-500/10 text-rose-450'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <span className="shrink-0 mt-0.5">
              {result.success ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              ) : (
                <XCircle className="h-6 w-6 text-rose-455" />
              )}
            </span>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-extrabold uppercase tracking-wide">
                {result.success ? 'Attendance Verified' : 'Check-In Blocked'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                {result.message}
              </p>
            </div>
          </div>

          {result.success && result.details && (
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 grid grid-cols-2 gap-3 text-xs text-slate-400 font-semibold uppercase">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Enrolled Student</span>
                <span className="text-slate-205 mt-0.5 block font-bold">{result.details.studentName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Subject Course</span>
                <span className="text-slate-205 mt-0.5 block font-bold">{result.details.subjectName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Attainment status</span>
                <span className="text-emerald-450 mt-0.5 font-extrabold block">{result.details.status}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Recorded time</span>
                <span className="text-slate-205 mt-0.5 block font-mono">{result.details.time} &bull; {result.details.date}</span>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
