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
    // Mimics reading a QR Code within 2 seconds
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
    <div id="student-qr-scanner-container" className="max-w-2xl mx-auto space-y-6 text-[#1D1D1F]">
      
      {/* Title block */}
      <div className="text-center space-y-2 select-none">
        <h2 className="text-xl font-bold text-[#1D1D1F] flex items-center justify-center gap-2">
          <QrCode className="h-5.5 w-5.5 text-[#0071E3]" />
          <span>Security Verification Check-In</span>
        </h2>
        <p className="text-xs text-[#6E6E73] max-w-sm mx-auto">
          Verify your physical presence and identity. The system conducts safe geodesic coordinate bounds checking and facial matching.
        </p>
      </div>

      {/* Campus GPS Tracker & Face Match Status indicator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card A: GPS Lock */}
        <div className="saas-card p-4 flex items-center gap-3">
          <div className={`p-2.5 rounded-full ${coords.latitude === 18.5204 ? 'bg-[#EAFBEF] text-[#34C759]' : 'bg-[#FFF1E6] text-[#FF9500]'}`}>
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 select-none">
              <span className="text-[9px] uppercase font-bold tracking-wider text-[#6E6E73] block">Campus GPS Boundary</span>
              <span className={`h-1.5 w-1.5 rounded-full ${coords.latitude === 18.5204 ? 'bg-[#34C759]' : 'bg-[#FF9500]'}`} />
            </div>
            <p className="text-xs text-[#1D1D1F] mt-1 font-mono font-semibold">
              Lat: {coords.latitude.toFixed(4)}, Lon: {coords.longitude.toFixed(4)}
            </p>
            <span className="text-[9px] text-[#6E6E73] block mt-0.5 select-none">
              {coords.latitude === 18.5204 ? 'Apex Campus (200m Perimeter Locked)' : 'Off-Campus (Limits violated, will trigger block)'}
            </span>
          </div>
        </div>

        {/* Card B: Biometrics matched status */}
        <div className="saas-card p-4 flex items-center gap-3">
          <div className="p-2.5 bg-[#EAFBEF] text-[#34C759] rounded-full">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#6E6E73] block select-none">Biometric Identity</span>
            <p className="text-xs text-[#1D1D1F] mt-1 font-bold flex items-center gap-1.5">
              Profile: Aiden Mitchell
              <span className={`px-1.5 py-0.5 text-[8px] rounded-full uppercase tracking-wider ${biometricSim === 'match' ? 'bg-[#EAFBEF] text-[#34C759]' : 'bg-[#FDF2F2] text-[#FF3B30]'}`}>
                {biometricSim === 'match' ? 'Matched ID' : 'Proxy Error'}
              </span>
            </p>
            <span className="text-[9px] text-[#6E6E73] block mt-0.5 select-none">
              {biometricSim === 'match' ? 'Euclidean descriptor vector active' : 'Biometric matching threshold exceeded'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Menu selectors / Segmented control layout */}
      <div className="flex bg-[#EAEAEA] p-0.5 rounded-lg border border-[#D2D2D7]/55 select-none">
        <button
          onClick={() => { setActiveMethod('manual'); setResult(null); }}
          id="tab-manual-entry"
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMethod === 'manual' 
              ? 'bg-white text-[#0071E3] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#D2D2D7]/55' 
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <Keyboard className="h-3.5 w-3.5" />
          <span>Manual Code</span>
        </button>

        <button
          onClick={() => { setActiveMethod('upload'); setResult(null); }}
          id="tab-image-upload"
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMethod === 'upload' 
              ? 'bg-white text-[#0071E3] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#D2D2D7]/55' 
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload QR</span>
        </button>

        <button
          onClick={() => { setActiveMethod('camera'); setResult(null); }}
          id="tab-camera-scan"
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMethod === 'camera' 
              ? 'bg-white text-[#0071E3] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#D2D2D7]/55' 
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          }`}
        >
          <Camera className="h-3.5 w-3.5" />
          <span>Camera Live</span>
        </button>
      </div>

      {/* Method panels */}
      <div id="method-panels-body" className="saas-card p-8 min-h-[220px] flex items-center justify-center">
        
        {/* PANEL A: Manual Code Input */}
        {activeMethod === 'manual' && (
          <div id="panel-manual-entry" className="w-full max-w-md space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] uppercase font-bold text-[#6E6E73] tracking-wider select-none">
                Session Code (Format: session_id|dynamic_token)
              </label>
              
              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. session_q2|ACTIVE_TOKEN_23910"
                  id="session-code-input-field"
                  className="saas-input flex-1 font-mono text-xs py-2.5"
                />
                
                <button
                  onClick={() => handleSubmitCode(manualCode)}
                  id="submit-session-code-btn"
                  disabled={loading || !manualCode.trim()}
                  className="saas-button-primary px-5 font-semibold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Submit</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[9px] text-[#6E6E73] text-center font-bold uppercase tracking-wider select-none">
              * Broadcast session code is session_q2|ACTIVE_TOKEN_23910 by default
            </p>
          </div>
        )}

        {/* PANEL B: QR Image upload */}
        {activeMethod === 'upload' && (
          <div id="panel-image-upload" className="w-full text-center space-y-4">
            <div className="max-w-xs mx-auto">
              <label className="border-2 border-dashed border-[#D2D2D7] hover:border-[#0071E3] bg-[#F8F9FA] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
                
                {loading ? (
                  <div className="space-y-2 py-2">
                    <Loader2 className="h-8 w-8 text-[#0071E3] animate-spin mx-auto" />
                    <p className="text-xs text-[#6E6E73] font-semibold">Scanning screenshot layers...</p>
                  </div>
                ) : (
                  <div className="space-y-2 py-2 text-[#6E6E73] select-none">
                    <Upload className="h-8 w-8 mx-auto text-[#0071E3]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] block">Select QR Image</span>
                    <span className="text-[10px] text-[#6E6E73] block leading-normal mt-1">Upload a screenshot of the lecture check-in screen</span>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* PANEL C: Camera Simulation */}
        {activeMethod === 'camera' && (
          <div id="panel-camera" className="w-full max-w-sm text-center space-y-6">
            
            {/* Visual Viewfinder framing box styling */}
            <div className="relative aspect-square max-w-[240px] mx-auto bg-black border border-[#D2D2D7] rounded-3xl flex items-center justify-center overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] group select-none">
              {/* Pulsing corners styling with thick sci-fi bracket style borders */}
              <div className="absolute top-5 left-5 h-6 w-6 border-t-4 border-l-4 border-[#34C759] rounded-tl" />
              <div className="absolute top-5 right-5 h-6 w-6 border-t-4 border-r-4 border-[#34C759] rounded-tr" />
              <div className="absolute bottom-5 left-5 h-6 w-6 border-b-4 border-l-4 border-[#34C759] rounded-bl" />
              <div className="absolute bottom-5 right-5 h-6 w-6 border-b-4 border-r-4 border-[#34C759] rounded-br" />

              {/* Glowing camera lens / ring indicator background decoration */}
              <div className="absolute inset-8 rounded-full border border-[#34C759]/10 pointer-events-none flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-[#34C759]/5 animate-pulse" />
              </div>

              {simulatedCameraScanning ? (
                <>
                  {/* Flashing target center reticle */}
                  <div className="absolute h-5 w-5 border border-dashed border-[#34C759]/40 rounded-full animate-ping z-20" />
                  
                  {/* Animated laser horizontal beam spanning entire frame width */}
                  <div className="scanner-laser z-20" />
                  
                  <div className="space-y-1.5 text-center z-10 animate-pulse text-white">
                    <p className="text-[10px] text-[#34C759] font-mono font-bold uppercase tracking-widest">Decoding matrix...</p>
                    <p className="text-[9px] text-[#AEAEB2] font-semibold font-mono tracking-wider">LATENCY: 24ms</p>
                  </div>
                </>
              ) : (
                <div className="text-[#AEAEB2] flex flex-col items-center justify-center z-10 transition-all duration-300">
                  <div className="h-12 w-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center mb-3">
                    <Camera className="h-5 w-5 text-[#34C759]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#E5E5EA] tracking-wider uppercase block">VIEWFINDER STANDBY</span>
                  <span className="text-[9px] font-semibold text-[#8E8E93] block mt-1 uppercase">Ready to commence scan</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSimulateCameraTrigger}
              id="simulate-camera-scan-btn"
              disabled={simulatedCameraScanning || loading}
              className="saas-button-primary flex items-center justify-center gap-2 py-2.5 cursor-pointer select-none active:scale-95"
            >
              <RefreshCcw className={`h-4 w-4 text-white ${simulatedCameraScanning ? 'animate-spin' : ''}`} />
              <span>{simulatedCameraScanning ? 'Scanning...' : 'Initiate Camera stream'}</span>
            </button>
          </div>
        )}

      </div>

      {/* RESULT/FEEDBACK PRESENTATION TILES AND MODALS */}
      {result && (
        <div 
          id="verification-result-panel"
          className={`p-5 rounded-2xl border flex flex-col gap-4 animate-fade-in ${
            result.success 
              ? 'bg-[#EAFBEF] border-[#34C759]/25 text-[#34C759]' 
              : 'bg-[#FDF2F2] border-[#FF3B30]/25 text-[#FF3B30]'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="shrink-0 mt-0.5">
              {result.success ? (
                <CheckCircle2 className="h-6 w-6 text-[#34C759]" />
              ) : (
                <XCircle className="h-6 w-6 text-[#FF3B30]" />
              )}
            </span>
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {result.success ? 'Attendance Verified' : 'Check-In Blocked'}
              </h4>
              <p className="text-xs text-[#1D1D1F] leading-relaxed font-semibold">
                {result.message}
              </p>
            </div>
          </div>

          {result.success && result.details && (
            <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#D2D2D7]/55 grid grid-cols-2 gap-3 text-xs text-[#6E6E73] font-bold uppercase select-none">
              <div>
                <span className="text-[9px] text-[#6E6E73] font-bold block">Enrolled Student</span>
                <span className="text-[#1D1D1F] mt-0.5 block font-bold">{result.details.studentName}</span>
              </div>
              <div>
                <span className="text-[9px] text-[#6E6E73] font-bold block">Subject Course</span>
                <span className="text-[#1D1D1F] mt-0.5 block font-bold">{result.details.subjectName}</span>
              </div>
              <div>
                <span className="text-[9px] text-[#6E6E73] font-bold block">Attainment Status</span>
                <span className="text-[#34C759] mt-0.5 font-extrabold block">{result.details.status}</span>
              </div>
              <div>
                <span className="text-[9px] text-[#6E6E73] font-bold block">Recorded Time</span>
                <span className="text-[#1D1D1F] mt-0.5 block font-mono font-semibold">{result.details.time} &bull; {result.details.date}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INTERACTIVE DEMO SETTINGS HELPER (ANTI-PROXY & GPS BOUNDS TESTING FRAME) */}
      <div className="saas-card p-5 text-xs text-[#6E6E73] space-y-3.5 select-none">
        <div className="flex items-center gap-1.5 text-[#1D1D1F] font-bold uppercase tracking-wider">
          <Smartphone className="h-4 w-4 text-[#0071E3]" />
          <span>Security Sandbox Lab Console</span>
        </div>
        <p className="text-[11px] text-[#6E6E73] leading-relaxed">
          Toggle parameters below to test geofencing perimeters and physical biometric protections live:
        </p>
        
        <div className="flex flex-wrap gap-3.5 pt-1">
          {/* GPS toggle button */}
          <button
            onClick={toggleSimulateOffCampus}
            className={`px-3 py-1.5 text-[10px] rounded-lg font-bold uppercase border transition-all cursor-pointer flex items-center gap-1 ${
              coords.latitude === 18.5204 
                ? 'bg-[#EAFBEF] text-[#34C759] border-[#34C759]/20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]' 
                : 'bg-[#FDF2F2] text-[#FF3B30] border-[#FF3B30]/20'
            }`}
          >
            <MapPin className="h-3 w-3" />
            <span>GPS: {coords.latitude === 18.5204 ? 'Inside Campus Boundary' : 'Simulating Off-Campus'}</span>
          </button>

          {/* Biometrics Toggle Button */}
          <button
            onClick={() => setBiometricSim(prev => prev === 'match' ? 'proxy' : 'match')}
            className={`px-3 py-1.5 text-[10px] rounded-lg font-bold uppercase border transition-all cursor-pointer flex items-center gap-1 ${
              biometricSim === 'match' 
                ? 'bg-[#EAFBEF] text-[#34C759] border-[#34C759]/20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]' 
                : 'bg-[#FDF2F2] text-[#FF3B30] border-[#FF3B30]/20'
            }`}
          >
            <UserCheck className="h-3 w-3" />
            <span>Face ID: {biometricSim === 'match' ? 'Aiden Match (0.1)' : 'Fake Proxy Scan (0.9)'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
