import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { QRSession, Subject } from '../../types.js';
import QRCode from 'qrcode';
import { io } from 'socket.io-client';
import { 
  QrCode, 
  Clock, 
  RefreshCw, 
  X, 
  Power, 
  Sparkles,
  Play
} from 'lucide-react';

export const TeacherQR: React.FC = () => {
  const { teacher, token } = useAuth();
  const [sessions, setSessions] = useState<QRSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [duration, setDuration] = useState('10'); // Standard 10 minutes default
  const [activeQRModal, setActiveQRModal] = useState<QRSession | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');

  // Remaining tick timer state for inspected QR
  const [inspectedTimeLeft, setInspectedTimeLeft] = useState<string>('');
  const [tokenSecsLeft, setTokenSecsLeft] = useState<number>(30);

  // Compute Anti-Proxy Token Rotation Countdown Live
  useEffect(() => {
    if (!activeQRModal || activeQRModal.status !== 'Active') return;
    
    const updateCountdown = () => {
      const msElapsed = Date.now() - new Date(activeQRModal.lastRegeneratedAt || activeQRModal.generatedTime).getTime();
      const secs = 30 - Math.floor(msElapsed / 1000);
      setTokenSecsLeft(secs > 0 ? (secs % 31) : 30);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeQRModal]);

  // Handle client-side qrcode library generation
  useEffect(() => {
    if (!activeQRModal) {
      setQrUrl('');
      return;
    }

    const qrData = activeQRModal.id + '|' + (activeQRModal.qrToken || activeQRModal.sessionCode);
    
    QRCode.toDataURL(qrData, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#1d1d1f', // SF charcoal text
        light: '#ffffff'
      }
    })
      .then(url => {
        setQrUrl(url);
      })
      .catch(err => {
        console.error('[CLIENT QR ERROR]: Failed to generate code locally', err);
      });
  }, [activeQRModal?.id, activeQRModal?.qrToken, activeQRModal?.sessionCode]);

  // Setup active QR real-time socket updates for rotating token
  useEffect(() => {
    if (!token || !activeQRModal) return;

    // Connect to websocket namespace for live updates
    const socket = io(import.meta.env.VITE_API_URL || window.location.origin, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('[SOCKET CLIENT] Listening for token rotations on QR modal');
    });

    socket.on('sessionTokenUpdated', (data: { sessionId: string; qrToken: string; lastRegeneratedAt: string }) => {
      if (activeQRModal.id === data.sessionId) {
        console.log('[SOCKET EVENT] Synchronizing rotating token dynamically on QR client:', data.qrToken);
        setActiveQRModal(prev => {
          if (!prev) return null;
          return {
            ...prev,
            qrToken: data.qrToken,
            lastRegeneratedAt: data.lastRegeneratedAt
          };
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, activeQRModal?.id]);

  const loadSessionsData = async () => {
    if (!teacher) return;
    try {
      const [allSessions, mySubjects] = await Promise.all([
        api.get<QRSession[]>('/api/qr-sessions'),
        api.get<Subject[]>('/api/teacher/subjects')
      ]);

      // Filter only this teacher's sessions
      const mySessions = allSessions.filter(s => s.teacherId === teacher.id);

      // Sort sessions: active first, then most recently generated down
      const sorted = [...mySessions].sort((a, b) => {
        const aActive = a.status === 'Active' && new Date(a.expiryTime) > new Date();
        const bActive = b.status === 'Active' && new Date(b.expiryTime) > new Date();
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return new Date(b.generatedTime).getTime() - new Date(a.generatedTime).getTime();
      });

      setSessions(sorted);
      setSubjects(mySubjects);

      if (mySubjects.length && !selectedSubjectId) {
        setSelectedSubjectId(mySubjects[0].id);
      }

      // Sync active watched QR modal if open
      if (activeQRModal) {
        const matching = mySessions.find(s => s.id === activeQRModal.id);
        if (matching) {
          setActiveQRModal(matching);
        }
      }
    } catch (e) {
      console.error("Failed to load QR session history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionsData();
    const interval = setInterval(loadSessionsData, 8000);
    return () => clearInterval(interval);
  }, [teacher?.id, activeQRModal?.id]);

  // Live timer tick for active inspected modal
  useEffect(() => {
    if (!activeQRModal) return;

    const isCurrentActive = activeQRModal.status === 'Active' && new Date(activeQRModal.expiryTime) > new Date();
    if (!isCurrentActive) {
      setInspectedTimeLeft('Expired');
      return;
    }

    const timer = setInterval(() => {
      const limit = new Date(activeQRModal.expiryTime).getTime();
      const current = new Date().getTime();
      const difference = limit - current;

      if (difference <= 0) {
        setInspectedTimeLeft('Expired');
        handleForceExpire(activeQRModal.id); // Trigger API expiration immediately
        clearInterval(timer);
      } else {
        const mins = Math.floor(difference / (1000 * 60));
        const secs = Math.floor((difference % (1000 * 60)) / 1000);
        setInspectedTimeLeft(
          `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQRModal]);

  const handleLaunchSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      alert('Syllabus subject not selected.');
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const durationMinutes = parseInt(duration, 10);
          const res = await api.post<QRSession>('/api/teacher/attendance/session', {
            subjectId: selectedSubjectId,
            durationMinutes,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });

          // Show active QR Modal right away
          setActiveQRModal(res);
          loadSessionsData();
        } catch (err: any) {
          alert(err.message || 'QR creation failed.');
        }
      },
      async (error) => {
        console.warn("Could not retrieve teacher's exact GPS. Initializing session at campus coordinates.", error);
        try {
          const durationMinutes = parseInt(duration, 10);
          const res = await api.post<QRSession>('/api/teacher/attendance/session', {
            subjectId: selectedSubjectId,
            durationMinutes,
            latitude: 18.5204, // Default Apex Campus
            longitude: 73.8567
          });

          // Show active QR Modal right away
          setActiveQRModal(res);
          loadSessionsData();
        } catch (err: any) {
          alert(err.message || 'QR creation failed.');
        }
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleForceExpire = async (id: string) => {
    try {
      const updated = await api.put<QRSession>('/api/teacher/attendance/session/end', { sessionId: id });
      if (activeQRModal && activeQRModal.id === id) {
        setActiveQRModal(updated);
      }
      loadSessionsData();
    } catch (e: any) {
      console.error("Force expiring error:", e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="teacher-qr-generator-view">
      <div>
        <h1 className="text-2xl font-bold font-sans text-[#1D1D1F] tracking-tight">Broadcasting Gateways</h1>
        <p className="text-xs text-[#6E6E73] mt-1">
          Spin up distinct classroom key codes, supervise timers, and end gates manually when student entries are completed.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse text-xs text-[#6E6E73] font-mono">
          LOADING ACTIVE ATTENDANCE BROADCASTS...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form to create QR Code */}
          <div className="saas-card p-6 lg:col-span-1 h-fit">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#D2D2D7] font-bold">
              <QrCode className="h-4.5 w-4.5 text-[#0071E3] animate-pulse" />
              <span className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">Publish Attendance Gate</span>
            </div>

            {subjects.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#6E6E73] font-semibold leading-relaxed">
                You aren't associated with any subjects to issue entries.
              </div>
            ) : (
              <form onSubmit={handleLaunchSession} className="space-y-4 text-xs font-semibold text-[#1D1D1F]">
                <div>
                  <label className="block text-xs font-bold text-[#6E6E73] uppercase tracking-wide mb-2">
                    Choose Syllabus Course
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="saas-input cursor-pointer font-medium"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6E6E73] uppercase tracking-wide mb-2">
                    Active Expiry Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="saas-input cursor-pointer font-medium"
                  >
                    <option value="5">5 Minutes (Short Demo)</option>
                    <option value="10">10 Minutes (Recommended)</option>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">60 Minutes (Examination)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="saas-button-primary w-full mt-4 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start Entry Broadcast</span>
                </button>
              </form>
            )}

            <div className="mt-6 p-4 rounded-xl bg-[#F8F9FA] border border-[#D2D2D7] text-[11px] text-[#6E6E73] leading-relaxed">
              <Sparkles className="h-4 w-4 mb-2 text-[#0071E3] shrink-0" />
              Dynamic check-in tokens contain secure parameters. Students scan keys with their devices. Late scans trigger access denial warnings automatically.
            </div>
          </div>

          {/* Teacher Broadcast History List */}
          <div className="lg:col-span-2 saas-card p-6">
            <div className="flex items-center justify-between border-b border-[#D2D2D7] pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#1D1D1F]">My Broadcast History</h3>
              <button
                onClick={loadSessionsData}
                className="text-xs text-[#0071E3] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Sync List</span>
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="py-20 text-center text-[#6E6E73] bg-[#F8F9FA] border border-dashed border-[#D2D2D7] rounded-xl select-none">
                <QrCode className="h-10 w-10 mx-auto text-slate-350 mb-3" />
                <p className="text-xs font-bold leading-normal text-[#1D1D1F]">No Session Access Tokens Issued</p>
                <p className="text-[10px] text-[#6E6E73] mt-1 max-w-sm mx-auto">Click "Start Entry Broadcast" above to spin up your very first active check-in transaction entry!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs" id="teacher-sessions-table">
                  <thead>
                    <tr className="border-b border-[#D2D2D7] text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider select-none">
                      <th className="py-3">Course / Key Code</th>
                      <th className="py-3">Released Time</th>
                      <th className="py-3">Broadcaster Status</th>
                      <th className="py-3 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2D2D7] text-[#1D1D1F]">
                    {sessions.map((sess) => {
                      const isSessActive = sess.status === 'Active' && new Date(sess.expiryTime) > new Date();
                      return (
                        <tr key={sess.id} className="hover:bg-[#F8F9FA]/60" id={`teacher-session-${sess.id}`}>
                          <td className="py-3.5 font-bold text-[#1D1D1F] pr-2">
                            <p className="leading-snug">{sess.subjectName}</p>
                            <code className="text-[10px] font-mono text-[#6E6E73] mt-1 block">Token: {sess.sessionCode.slice(0, 18)}...</code>
                          </td>
                          <td className="py-3.5 text-[#6E6E73] font-mono">
                            {new Date(sess.generatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="text-[9px] text-[#6E6E73] block mt-0.5">{new Date(sess.generatedTime).toLocaleDateString()}</span>
                          </td>
                          <td className="py-3.5">
                            {isSessActive ? (
                              <span className="saas-pill-success w-fit">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]" />
                                ACTIVE
                              </span>
                            ) : (
                              <span className="apple-badge w-fit">
                                EXPIRED
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setInspectedTimeLeft('');
                                  setActiveQRModal(sess);
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold text-[#0071E3] hover:text-[#0062C4] bg-[#0071E3]/10 hover:bg-[#0071E3]/20 rounded-lg transition-colors cursor-pointer"
                              >
                                View QR
                              </button>
                              {isSessActive && (
                                <button
                                  onClick={() => handleForceExpire(sess.id)}
                                  className="p-1.5 text-[#FF3B30] hover:text-[#E03026] hover:bg-[#FF3B30]/10 rounded-lg transition-colors cursor-pointer"
                                  title="Force Close Session"
                                >
                                  <Power className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic QR Full Display Screen Dialog */}
      {activeQRModal && (
        <div className="fixed inset-0 bg-[#1D1D1F]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#D2D2D7] shadow-xl overflow-hidden text-center animate-zoom-in relative">
            
            {/* Modal header details */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#F8F9FA] border-b border-[#D2D2D7] select-none relative z-10">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#34C759] animate-ping" />
                <span className="text-[10px] font-mono text-[#6E6E73] uppercase tracking-widest leading-none font-bold">Encrypted Gate Broadcaster</span>
              </div>
              <button 
                onClick={() => setActiveQRModal(null)}
                className="text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer bg-[#F8F9FA] hover:bg-[#E5E5EA] p-1.5 rounded-lg border border-[#D2D2D7]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content body */}
            <div className="p-8 space-y-6 flex flex-col items-center relative z-10">
              <div>
                <h3 className="font-bold text-[#1D1D1F] text-xl leading-snug">{activeQRModal.subjectName}</h3>
                <p className="text-xs text-[#0071E3] mt-1 uppercase font-semibold tracking-wider font-mono">BROADCAST GATEWAY CODE: {activeQRModal.sessionCode}</p>
              </div>

              {/* QR Image container */}
              <div className="bg-[#F8F9FA] p-6 rounded-2xl border border-[#D2D2D7] relative shrink-0">
                <div className="relative bg-white p-4 rounded-xl border border-[#D2D2D7]">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="Dynamic Session Attendance Check-in QR Code"
                      className="h-52 w-52 object-contain select-none transition-all duration-500 hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-52 w-52 flex items-center justify-center">
                      <RefreshCw className="h-7 w-7 animate-spin text-[#0071E3]" />
                    </div>
                  )}

                  {/* Expired overlay screen */}
                  {(!(activeQRModal.status === 'Active' && new Date(activeQRModal.expiryTime) > new Date()) || inspectedTimeLeft === 'Expired') && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 rounded-xl select-none text-[#FF3B30] z-20">
                      <div className="h-12 w-12 rounded-full bg-[#FF3B30]/10 border border-[#FF3B30]/30 flex items-center justify-center text-[#FF3B30] mb-3">
                        <X className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#1D1D1F]">Attendance Vault Locked</span>
                      <span className="text-[11px] text-[#6E6E73] block mt-1.5 font-semibold">Broadcasting window closed</span>
                    </div>
                  )}
                </div>
              </div>

              {activeQRModal.status === 'Active' && inspectedTimeLeft !== 'Expired' && (
                <div className="text-center select-none shrink-0 w-full space-y-2.5">
                  <span className="text-[10px] font-mono font-bold text-[#0071E3] bg-[#0071E3]/10 border border-[#0071E3]/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-block">
                    Anti-Proxy Code: <span className="text-[#1D1D1F] font-extrabold font-mono">{activeQRModal.qrToken ? activeQRModal.qrToken.split('_')[1] || activeQRModal.qrToken.slice(0, 10) : 'PENDING'}</span>
                  </span>
                  <p className="text-[11px] text-[#34C759] mt-1 font-mono flex items-center justify-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0 text-[#34C759]" />
                    Checking for dynamic check-ins. Rotating token: <b className="font-extrabold text-[#1D1D1F] text-md pl-1">{tokenSecsLeft}s</b>
                  </p>
                </div>
              )}

              {/* Countdown clock segment */}
              <div className="w-full bg-[#F8F9FA] p-5 rounded-2xl border border-[#D2D2D7] shrink-0">
                <span className="text-[10px] text-[#6E6E73] uppercase font-bold block tracking-widest mb-1">Time Remaining till Expiry</span>
                
                {(activeQRModal.status === 'Active' && new Date(activeQRModal.expiryTime) > new Date()) && inspectedTimeLeft !== 'Expired' ? (
                  <div className="flex items-center justify-center gap-2.5 mt-2">
                    <Clock className="h-5 w-5 text-[#0071E3] animate-pulse shrink-0" />
                    <span className="text-4xl font-mono font-bold text-[#1D1D1F] tracking-tight">
                      {inspectedTimeLeft || '--:--'}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-[#6E6E73] mt-1.5 block uppercase tracking-wide">Gateway Vault Sealed</span>
                )}
              </div>

              {/* Force Deactivate */}
              {(activeQRModal.status === 'Active' && new Date(activeQRModal.expiryTime) > new Date()) && inspectedTimeLeft !== 'Expired' && (
                <button
                  onClick={() => handleForceExpire(activeQRModal.id)}
                  className="w-full bg-[#FF3B30] hover:bg-[#E03026] text-white font-semibold text-sm py-3.5 rounded-xl transition-all active:scale-[0.98] shrink-0"
                >
                  Close Gateway Instantly
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
