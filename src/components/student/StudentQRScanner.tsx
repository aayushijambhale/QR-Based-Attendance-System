import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  MapPin,
  UserCheck,
  Smartphone
} from 'lucide-react';

export const StudentQRScanner: React.FC = () => {
  const [activeMethod, setActiveMethod] = useState<'camera' | 'upload' | 'manual'>('manual');
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  // GPS State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 18.5204, // Default Apex Campus Latitude
    longitude: 73.8567 // Default Apex Campus Longitude
  });
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locked' | 'simulated' | 'error'>('simulated');
  const [gpsError, setGpsError] = useState('');

  // Biometrics Face ID State
  const [biometricSim, setBiometricSim] = useState<'match' | 'proxy'>('match');
  const [selfieSnapped, setSelfieSnapped] = useState<string>('');
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [faceMatchSuccess, setFaceMatchSuccess] = useState<boolean | null>(null);

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

  // Auto Geolocate on load
  const loadDeviceGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsError('Geolocation API not supported.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setGpsStatus('locked');
        setGpsLoading(false);
      },
      (err) => {
        // Fallback to simulated campus coords gracefully for dev preview convenience
        setCoords({ latitude: 18.5204, longitude: 73.8567 });
        setGpsStatus('simulated');
        setGpsLoading(false);
        console.warn(`GPS loading error: ${err.message}, using simulated campus bounds.`);
      },
      { timeout: 7000 }
    );
  };

  useEffect(() => {
    loadDeviceGPS();
  }, []);

  const handleSubmitCode = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    // Formulate a biometric fingerprint vector
    // Aidan Mitchell represents 0.1, matching standard profile descriptor
    const signatureValue = biometricSim === 'match' ? 0.1 : 0.95;
    const finalFaceDescriptor = Array(128).fill(signatureValue);

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
      }>('/api/student/scan-attendance', { 
        sessionCode: code.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        faceDescriptor: finalFaceDescriptor,
        selfieImage: selfieSnapped || `https://api.dicebear.com/7.x/pixel-art/svg?seed=Aiden`
      });

      setResult({
        success: true,
        message: response.message,
        details: response.record
      });
      setFaceMatchSuccess(true);
      setManualCode('');
    } catch (err: any) {
      setResult({
        success: false,
        message: err.error || err.message || 'Verification failed. Please review your session code.'
      });
      setFaceMatchSuccess(false);
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
      const mockClassCode = "session_q2|ACTIVE_TOKEN_23910";
      handleSubmitCode(mockClassCode);
    }, 1500);
  };

  const [simulatedCameraScanning, setSimulatedCameraScanning] = useState(false);
  const handleSimulateCameraTrigger = () => {
    setSimulatedCameraScanning(true);
    // Mimics reading a QR Code within 3 seconds
    setTimeout(() => {
      setSimulatedCameraScanning(false);
      // Fetches active sessions or passes a standard dummy Theory of Computation active session
      handleSubmitCode("session_q2|ACTIVE_TOKEN_23910");
    }, 2000);
  };

  const toggleSimulateOffCampus = () => {
    if (gpsStatus === 'simulated' && coords.latitude === 18.5204) {
      // Nudge completely outside campus boundary
      setCoords({ latitude: 19.076, longitude: 72.877 }); // Mumbai location
      setGpsStatus('simulated');
    } else {
      setCoords({ latitude: 18.5204, longitude: 73.8567 });
      setGpsStatus('simulated');
    }
  };

  return (
    <div id="student-qr-scanner-container" className="max-w-2xl mx-auto space-y-6">
      
      {/* Title block */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-slate-100 flex items-center justify-center gap-2">
          <QrCode className="h-5.5 w-5.5 text-emerald-400" />
          <span>Biometric & GPS Check-In</span>
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Verify your physical presence and identity. The system conducts safe geodesic coordinate bounds checking and facial matching.
        </p>
      </div>

      {/* Campus GPS Tracker & Face Match Status indicator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card A: GPS Lock */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${coords.latitude === 18.5204 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block">Campus GPS Boundary</span>
              <span className={`h-1.5 w-1.5 rounded-full ${coords.latitude === 18.5204 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </div>
            <p className="text-xs text-slate-200 mt-1 font-mono">
              Lat: {coords.latitude.toFixed(4)}, Lon: {coords.longitude.toFixed(4)}
            </p>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              {coords.latitude === 18.5204 ? 'Apex Campus (200m Geo Perimeter Locked)' : 'Off-Campus (Limits violated, will trigger block)'}
            </span>
          </div>
        </div>

        {/* Card B: Biometrics matched status */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block">Biometric Alignment</span>
            <p className="text-xs text-slate-200 mt-1 font-semibold flex items-center gap-1.5">
              Profile: Aiden Mitchell
              <span className={`px-1.5 py-0.5 text-[8px] rounded-full uppercase tracking-widest ${biometricSim === 'match' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-450'}`}>
                {biometricSim === 'match' ? 'Matched ID' : 'Proxy Simulation'}
              </span>
            </p>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              {biometricSim === 'match' ? 'Matching descriptor vector active' : 'Biometric Euclidean distance threshold exceeded'}
            </span>
          </div>
        </div>
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
          <span className="hidden sm:inline">Manual Entry</span>
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
          <span className="hidden sm:inline">Upload Screenshot</span>
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
                Full Session Code (Format: session_id|dynamic_token)
              </label>
              
              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. session_q2|ACTIVE_TOKEN_23910"
                  id="session-code-input-field"
                  className="flex-1 bg-slate-950 border border-slate-850 px-4 py-3 text-xs rounded-xl text-slate-105 placeholder:text-slate-650 focus:outline-none focus:border-emerald-550 focus:ring-1 focus:ring-emerald-555 font-mono"
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

            <p className="text-[9px] text-slate-500 text-center leading-relaxed font-semibold">
              * Tips: Copy code from any faculty generator window (active broadcast is session_q2|ACTIVE_TOKEN_23910 by default) and paste above.
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
                    <p className="text-xs text-slate-350">Scanning screenshot layers...</p>
                  </div>
                ) : (
                  <div className="space-y-2 py-2 text-slate-450">
                    <Upload className="h-8 w-8 mx-auto text-slate-50" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">Select QR Image</span>
                    <span className="text-[10px] text-slate-500 block leading-normal mt-1">Upload a screenshot of the lecture check-in screen</span>
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
            <div className="relative aspect-square max-w-[180px] mx-auto bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-center overflow-hidden">
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
                  <Camera className="h-8 w-8 animate-bounce mb-3 text-slate-450" />
                  <span className="text-[9px] font-extrabold text-slate-500 tracking-widest uppercase mt-1">Camera Feed</span>
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
              <span>{simulatedCameraScanning ? 'Decoding QR...' : 'Simulate Camera Frame'}</span>
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

      {/* INTERACTIVE DEMO SETTINGS HELPER (ANTI-PROXY & GPS BOUNDS TESTING FRAME) */}
      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 text-xs text-slate-400 space-y-4">
        <div className="flex items-center gap-1.5 text-slate-200 font-bold uppercase tracking-wide">
          <Smartphone className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>Security Sandbox Lab Console</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Toggle below to test geodesic GPS geofencing perimeter controls and physical facial recognition protections live:
        </p>
        
        <div className="flex flex-wrap gap-4 pt-1">
          {/* GPS toggle button */}
          <button
            onClick={toggleSimulateOffCampus}
            className={`px-3 py-1.5 text-[11px] rounded-xl font-bold uppercase border transition-all cursor-pointer flex items-center gap-1 ${
              coords.latitude === 18.5204 
                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900' 
                : 'bg-rose-950/30 text-rose-455 border-rose-900'
            }`}
          >
            <MapPin className="h-3 w-3" />
            <span>GPS: {coords.latitude === 18.5204 ? 'Inside Campus Boundary' : 'Simulating Off-Campus'}</span>
          </button>

          {/* Biometrics Toggle Button */}
          <button
            onClick={() => setBiometricSim(prev => prev === 'match' ? 'proxy' : 'match')}
            className={`px-3 py-1.5 text-[11px] rounded-xl font-bold uppercase border transition-all cursor-pointer flex items-center gap-1 ${
              biometricSim === 'match' 
                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900' 
                : 'bg-rose-950/30 text-rose-455 border-rose-900'
            }`}
          >
            <UserCheck className="h-3 w-3" />
            <span>Face ID: {biometricSim === 'match' ? 'Aiden Match (0.1 Vector)' : 'Fake Proxy Scan (0.9 Vector)'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};

