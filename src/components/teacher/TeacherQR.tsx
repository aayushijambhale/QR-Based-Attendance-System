import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { QRSession, Subject } from '../../types.js';
import QRCode from 'qrcode';
import { io } from 'socket.io-client';
import { 
  Plus, 
  QrCode, 
  Clock, 
  RefreshCw, 
  X, 
  Power, 
  Sparkles,
  Play,
  CheckCircle2
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
        dark: '#0f172a', // slate-900 heading colors
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

    const socket = io(window.location.origin, {
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

    try {
      const durationMinutes = parseInt(duration, 10);
      const res = await api.post<QRSession>('/api/teacher/attendance/session', {
        subjectId: selectedSubjectId,
        durationMinutes
      });

      // Show active QR Modal right away
      setActiveQRModal(res);
      loadSessionsData();
    } catch (err: any) {
      alert(err.message || 'QR creation failed.');
    }
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
        <h1 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">Broadcasting Gateways</h1>
        <p className="text-xs text-slate-505 mt-1">
          Spin up distinct classroom key codes, supervise timers, and end gates manually when student entries are completed.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse text-xs text-slate-400 font-mono">
          LOADING ACTIVE ATTENDANCE BROADCASTS...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form to create QR Code */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 lg:col-span-1 h-fit shadow-xs">
            <div className="flex items-center gap-2 pb-3.5 border-b border-slate-50 mb-4 font-bold">
              <QrCode className="h-4.5 w-4.5 text-indigo-505 animate-pulse" />
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Publish Attendance Gate</span>
            </div>

            {subjects.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-semibold leading-relaxed">
                You aren't associated with any subjects to issue entries.
              </div>
            ) : (
              <form onSubmit={handleLaunchSession} className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase tracking-wide mb-2">
                    Choose Syllabus Course
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 font-medium cursor-pointer"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase tracking-wide mb-2">
                    Active Expiry Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-505 font-medium cursor-pointer"
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
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-710 text-white text-xs font-bold rounded-xl py-3 shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start Entry Broadcast</span>
                </button>
              </form>
            )}

            <div className="mt-6 p-4 rounded-xl bg-violet-50/50 border border-violet-100/60 text-[11px] text-indigo-805 leading-relaxed">
              <Sparkles className="h-4 w-4 mb-2 text-indigo-500 shrink-0" />
              Dynamic check-in tokens contain secure parameters. Students scan keys with their devices. Late scans trigger access denial warnings automatically.
            </div>
          </div>

          {/* Teacher Broadcast History List */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3.5 mb-4">
              <h3 className="text-sm font-bold text-slate-800">My Broadcast History</h3>
              <button
                onClick={loadSessionsData}
                className="text-xs text-indigo-505 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Sync List</span>
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="py-20 text-center text-slate-350 bg-slate-50/20 border border-dashed border-slate-100 rounded-2xl select-none">
                <QrCode className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                <p className="text-xs font-bold leading-normal">No Session Access Tokens Issued</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto">Click "Start Entry Broadcast" above to spin up your very first active check-in transaction entry!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs" id="teacher-sessions-table">
                  <thead>
                    <tr className="border-b border-slate-105 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                      <th className="py-3">Course / Key Code</th>
                      <th className="py-3">Released Time</th>
                      <th className="py-3">Broadcaster Status</th>
                      <th className="py-3 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {sessions.map((sess) => {
                      const isSessActive = sess.status === 'Active' && new Date(sess.expiryTime) > new Date();
                      return (
                        <tr key={sess.id} className="hover:bg-slate-50/50" id={`teacher-session-${sess.id}`}>
                          <td className="py-3.5 font-bold text-slate-900 pr-2">
                            <p className="leading-snug">{sess.subjectName}</p>
                            <code className="text-[10px] font-mono text-slate-400 mt-1 block">Token: {sess.sessionCode.slice(0, 18)}...</code>
                          </td>
                          <td className="py-3.5 text-slate-500 font-mono">
                            {new Date(sess.generatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="text-[9px] text-slate-400 block mt-0.5">{new Date(sess.generatedTime).toLocaleDateString()}</span>
                          </td>
                          <td className="py-3.5">
                            {isSessActive ? (
                              <span className="px-2.5 py-0.5 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-800 text-[9px] font-extrabold flex items-center gap-1 w-fit animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-400 text-[9px] font-extrabold flex items-center gap-1 w-fit">
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
                                className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-705 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                              >
                                View QR
                              </button>
                              {isSessActive && (
                                <button
                                  onClick={() => handleForceExpire(sess.id)}
                                  className="p-1.5 text-red-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-[36px] w-full max-w-md shadow-[0_30px_70px_rgba(2,6,23,0.8)] border border-white/10 overflow-hidden text-center animate-zoom-in relative">
            
            {/* Background cyber glow gradients */}
            <div className="absolute top-0 left-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-[60px] -translate-x-1/2 pointer-events-none" />
            
            {/* Modal header details */}
            <div className="flex items-center justify-between px-8 py-5 bg-white/[0.02] border-b border-white/5 select-none relative z-10">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none font-bold">Encrypted Gate Broadcaster</span>
              </div>
              <button 
                onClick={() => setActiveQRModal(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer bg-white/5 hover:bg-white/10 p-1.5 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content body */}
            <div className="p-8 space-y-6 flex flex-col items-center relative z-10">
              <div>
                <h3 className="font-extrabold text-white text-xl leading-snug">{activeQRModal.subjectName}</h3>
                <p className="text-xs text-blue-400 mt-1 uppercase font-semibold tracking-wider font-mono">BROADCAST GATEWAY CODE: {activeQRModal.sessionCode}</p>
              </div>

              {/* QR Image with neon border and pulse effect */}
              <div className="bg-slate-950 p-6 rounded-[32px] border border-white/10 shadow-2xl relative shrink-0">
                
                {/* Neon pulsating scan rings decoration */}
                <div className="absolute -inset-1 rounded-[34px] bg-gradient-to-tr from-blue-500 to-purple-600 opacity-20 blur-sm pulse-glow-ring" />
                
                <div className="relative bg-white p-4 rounded-2xl">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="Dynamic Session Attendance Check-in QR Code"
                      className="h-52 w-52 object-contain select-none transition-all duration-500 hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-52 w-52 flex items-center justify-center">
                      <RefreshCw className="h-7 w-7 animate-spin text-indigo-500" />
                    </div>
                  )}

                  {/* Expired overlay screen */}
                  {(!(activeQRModal.status === 'Active' && new Date(activeQRModal.expiryTime) > new Date()) || inspectedTimeLeft === 'Expired') && (
                    <div className="absolute inset-0 bg-slate-900/98 backdrop-blur-md flex flex-col items-center justify-center p-4 rounded-2xl select-none text-rose-450 z-20">
                      <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-3">
                        <X className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-white">Attendance Vault Locked</span>
                      <span className="text-[11px] text-slate-400 block mt-1.5 font-semibold">Broadcasting window closed</span>
                    </div>
                  )}
                </div>
              </div>

              {activeQRModal.status === 'Active' && inspectedTimeLeft !== 'Expired' && (
                <div className="text-center select-none shrink-0 w-full space-y-2.5">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-block">
                    Anti-Proxy Code: <span className="text-white font-extrabold font-mono">{activeQRModal.qrToken ? activeQRModal.qrToken.split('_')[1] || activeQRModal.qrToken.slice(0, 10) : 'PENDING'}</span>
                  </span>
                  <p className="text-[11px] text-emerald-400 mt-1 font-mono flex items-center justify-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0 text-emerald-400" />
                    Checking for dynamic check-ins. Rotating token: <b className="font-extrabold text-white text-md pl-1">{tokenSecsLeft}s</b>
                  </p>
                </div>
              )}

              {/* Countdown clock segment */}
              <div className="w-full bg-white/[0.02] p-5 rounded-2xl border border-white/5 shrink-0">
                <span className="text-[10px] text-slate-400 uppercase font-black block tracking-widest mb-1">Time Remaining till Expiry</span>
                
                {(activeQRModal.status === 'Active' && new Date(activeQRModal.expiryTime) > new Date()) && inspectedTimeLeft !== 'Expired' ? (
                  <div className="flex items-center justify-center gap-2.5 mt-2">
                    <Clock className="h-5 w-5 text-indigo-400 animate-pulse shrink-0" />
                    <span className="text-4xl font-mono font-extrabold text-white tracking-tight">
                      {inspectedTimeLeft || '--:--'}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-slate-450 mt-1.5 block uppercase tracking-wide">Gateway Vault Sealed</span>
                )}
              </div>

              {/* Force Deactivate */}
              {(activeQRModal.status === 'Active' && new Date(activeQRModal.expiryTime) > new Date()) && inspectedTimeLeft !== 'Expired' && (
                <button
                  onClick={() => handleForceExpire(activeQRModal.id)}
                  className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-rose-500/20 cursor-pointer active:scale-95 shrink-0"
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
