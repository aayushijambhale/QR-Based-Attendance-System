import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { QRSession, Subject } from '../types.js';
import { 
  Plus, 
  QrCode, 
  Clock, 
  RefreshCw, 
  X, 
  Power, 
  Sparkles
} from 'lucide-react';

export const QRSessions: React.FC = () => {
  const [sessions, setSessions] = useState<QRSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [duration, setDuration] = useState('10'); // Standard 10 minutes default
  const [activeQRModal, setActiveQRModal] = useState<QRSession | null>(null);

  // Remaining ticking seconds state for currently inspected active Session
  const [inspectedTimeLeft, setInspectedTimeLeft] = useState<string>('');

  const loadSessionsData = async () => {
    try {
      const [allSessions, allSubjects] = await Promise.all([
        api.get<QRSession[]>('/api/qr-sessions'),
        api.get<Subject[]>('/api/subjects')
      ]);

      // Sort sessions: active first, then by generatedTime down
      const sorted = [...allSessions].sort((a, b) => {
        if (a.status === 'Active' && b.status !== 'Active') return -1;
        if (a.status !== 'Active' && b.status === 'Active') return 1;
        return new Date(b.generatedTime).getTime() - new Date(a.generatedTime).getTime();
      });

      setSessions(sorted);
      setSubjects(allSubjects);

      if (allSubjects.length && !selectedSubjectId) {
        setSelectedSubjectId(allSubjects[0].id);
      }

      // If there's an active modal QR being watched, keep its state matched
      if (activeQRModal) {
        const matchingSess = allSessions.find(s => s.id === activeQRModal.id);
        if (matchingSess) {
          setActiveQRModal(matchingSess);
        }
      }
    } catch (e) {
      console.error("Failed to load QR metadata:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionsData();
    // Refresh sessions status every 8 seconds
    const interval = setInterval(loadSessionsData, 8000);
    return () => clearInterval(interval);
  }, [activeQRModal?.id]);

  // Live Timer Countdown ticking segment for active modal card
  useEffect(() => {
    if (!activeQRModal || activeQRModal.status === 'Expired') {
      setInspectedTimeLeft('Expired');
      return;
    }

    const intervalTimer = setInterval(() => {
      const limit = new Date(activeQRModal.expiryTime).getTime();
      const current = new Date().getTime();
      const difference = limit - current;

      if (difference <= 0) {
        setInspectedTimeLeft('Expired');
        handleForceExpire(activeQRModal.id); // Trigger state expire
        clearInterval(intervalTimer);
      } else {
        const minTicks = Math.floor(difference / (1000 * 60));
        const secTicks = Math.floor((difference % (1000 * 60)) / 1000);
        setInspectedTimeLeft(
          `${minTicks.toString().padStart(2, '0')}:${secTicks.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(intervalTimer);
  }, [activeQRModal]);

  const handleLaunchSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      alert('Syllabus subject not selected.');
      return;
    }

    try {
      const durationMinutes = parseInt(duration, 10);
      const res = await api.post<QRSession>('/api/qr-sessions', {
        subjectId: selectedSubjectId,
        durationMinutes
      });

      // Automatically display the newly spawned QR Session Modal
      setActiveQRModal(res);
      loadSessionsData();
    } catch (err: any) {
      alert(err.message || 'QR creation failed.');
    }
  };

  const handleForceExpire = async (id: string) => {
    try {
      const expiredSession = await api.put<QRSession>(`/api/qr-sessions/${id}/expire`, {});
      if (activeQRModal && activeQRModal.id === id) {
        setActiveQRModal(expiredSession);
      }
      loadSessionsData();
    } catch (e: any) {
      console.error("Expiring error:", e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#1D1D1F]" id="qr-sessions-view">
      {/* Header element */}
      <div className="select-none">
        <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">QR Broadcast Hub</h1>
        <p className="text-[#6E6E73] text-xs mt-1">Generate dynamic student check-in QR codes, regulate expiration triggers, and supervise active gates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* QR Session Spawning Tool Panel */}
        <div className="saas-card p-5 lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 pb-3.5 border-b border-[#D2D2D7]/55 mb-4 select-none">
            <QrCode className="h-4 w-4 text-[#0071E3]" />
            <span className="text-[10px] font-bold text-[#1D1D1F] uppercase tracking-wider">Generate Dynamic QR</span>
          </div>

          {subjects.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#6E6E73]">
              Create subjects inside the "Subjects" directory first!
            </div>
          ) : (
            <form onSubmit={handleLaunchSession} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">
                  Choose Syllabus Course
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="saas-input"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2">
                  Session Expiry Window
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="saas-input"
                >
                  <option value="5">5 Minutes (Short Demo)</option>
                  <option value="10">10 Minutes (Standard)</option>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes (Examination)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-4 saas-button-primary flex items-center justify-center gap-2 py-2.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Publish Session Gate</span>
              </button>
            </form>
          )}

          <div className="mt-5 p-4 rounded-xl bg-[#E8F2FF] border border-[#0071E3]/15 text-xs text-[#6E6E73] leading-relaxed">
            <div className="flex items-center gap-1.5 text-[#0071E3] font-bold uppercase text-[9px] mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Security Token Service</span>
            </div>
            Each session publishes an unique, encrypted payload token. Students scanning in after expiration will trigger rejection notices!
          </div>
        </div>

        {/* Supervision Audit Table List */}
        <div className="lg:col-span-2 saas-card p-5">
          <div className="flex items-center justify-between border-b border-[#D2D2D7]/55 pb-3.5 mb-4 select-none">
            <h3 className="text-sm font-bold text-[#1D1D1F]">QR Gate Broadcast History</h3>
            <button
              onClick={loadSessionsData}
              className="text-xs text-[#0071E3] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh History</span>
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="py-20 text-center text-[#6E6E73] bg-[#F8F9FA] border border-dashed border-[#D2D2D7] rounded-2xl">
              <QrCode className="h-8 w-8 mx-auto text-[#6E6E73] mb-3" />
              <p className="text-xs font-bold text-[#1D1D1F]">No Broadcasts Yet</p>
              <p className="text-xs text-[#6E6E73] mt-1 max-w-xs mx-auto">Publish parameters on the left to activate the first attendance gate.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs" id="sessions-table">
                <thead>
                  <tr className="border-b border-[#D2D2D7]/65 text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider select-none">
                    <th className="py-3">Syllabus Subject</th>
                    <th className="py-3">Faculty Lecturer</th>
                    <th className="py-3">Generated Time</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 text-right">Gate Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2D2D7]/65 text-[#1D1D1F]">
                  {sessions.map((sess) => {
                    const isSessionActive = sess.status === 'Active' && new Date(sess.expiryTime) > new Date();
                    return (
                      <tr key={sess.id} className="hover:bg-[#F8F9FA] group" id={`session-row-${sess.id}`}>
                        {/* Course info */}
                        <td className="py-3.5 font-bold text-[#1D1D1F] pr-2">
                          <p className="leading-snug">{sess.subjectName}</p>
                          <code className="text-[10px] text-[#6E6E73] mt-1 font-mono block font-medium">Code: {sess.sessionCode.slice(0, 12)}...</code>
                        </td>

                        {/* faculty */}
                        <td className="py-3.5 text-[#6E6E73] font-medium">
                          {sess.teacherName}
                        </td>

                        {/* generated time */}
                        <td className="py-3.5 font-mono text-[#6E6E73]">
                          {new Date(sess.generatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-[9px] text-[#6E6E73] block mt-0.5">{new Date(sess.generatedTime).toLocaleDateString()}</span>
                        </td>

                        {/* status badge */}
                        <td className="py-3.5">
                          {isSessionActive ? (
                            <span className="saas-pill-success flex items-center gap-1 w-fit">
                              <span className="h-1 w-1 rounded-full bg-[#34C759] animate-pulse" />
                              ACTIVE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full border border-[#D2D2D7] bg-[#F5F5F7] text-[#6E6E73] text-[9px] font-bold flex items-center gap-1 w-fit">
                              EXPIRED
                            </span>
                          )}
                        </td>

                        {/* action options */}
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setInspectedTimeLeft('');
                                setActiveQRModal(sess);
                              }}
                              id={`open-qr-btn-${sess.id}`}
                              className="px-2.5 py-1 text-[11px] font-bold text-[#0071E3] hover:text-[#0062C4] bg-[#E8F2FF] rounded-lg transition-colors cursor-pointer"
                            >
                              Display QR
                            </button>

                            {isSessionActive && (
                              <button
                                onClick={() => handleForceExpire(sess.id)}
                                id={`expire-session-btn-${sess.id}`}
                                title="Force deactivate session"
                                className="p-1.5 text-[#FF3B30] hover:text-[#E03026] hover:bg-[#FDF2F2] rounded-lg transition-colors cursor-pointer"
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

      {/* Dynamic QR Full Display Popups Screen */}
      {activeQRModal && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-[#D2D2D7] overflow-hidden text-center animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D2D2D7] select-none">
              <span className="text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider leading-none">Attendance Gate</span>
              <button 
                onClick={() => setActiveQRModal(null)} 
                className="text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main content body */}
            <div className="p-6 space-y-5 flex flex-col items-center">
              <div>
                <h3 className="font-bold text-[#1D1D1F] text-base leading-tight">{activeQRModal.subjectName}</h3>
                <p className="text-xs text-[#6E6E73] mt-1 font-semibold uppercase tracking-wider">{activeQRModal.teacherName}</p>
              </div>

              {/* Real dynamic image from qrserver API */}
              <div className="bg-white p-4 rounded-xl border border-[#D2D2D7] shadow-sm relative shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeQRModal.sessionCode)}`}
                  alt="Dynamic Session Attendance Check-in QR Code"
                  referrerPolicy="no-referrer"
                  className="h-44 w-44 object-contain select-none"
                />
                
                {/* Overlay badge if Expired */}
                {(activeQRModal.status === 'Expired' || inspectedTimeLeft === 'Expired') && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in select-none">
                    <X className="h-8 w-8 text-[#FF3B30] mb-2" />
                    <span className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">Gate Expired</span>
                    <span className="text-[10px] text-[#6E6E73] block mt-1">This token key is invalid</span>
                  </div>
                )}
              </div>

              {/* Expiry display widget */}
              <div className="w-full bg-[#F8F9FA] p-3.5 rounded-xl border border-[#D2D2D7] shrink-0 select-none">
                <span className="text-[9px] text-[#6E6E73] uppercase font-bold block tracking-wider">Remaining Access Time</span>
                
                {activeQRModal.status === 'Active' && inspectedTimeLeft !== 'Expired' ? (
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <Clock className="h-4 w-4 text-[#0071E3] shrink-0" />
                    <span className="text-2xl font-mono font-extrabold text-[#1D1D1F] tracking-tight">
                      {inspectedTimeLeft || '--:--'}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-[#FF3B30] mt-1 block">Gate Closed</span>
                )}
              </div>

              {/* Force Deactivate */}
              {activeQRModal.status === 'Active' && inspectedTimeLeft !== 'Expired' && (
                <button
                  onClick={() => handleForceExpire(activeQRModal.id)}
                  id="close-terminal-btn"
                  className="w-full apple-button-danger py-2.5 shrink-0 cursor-pointer"
                >
                  Force Close Gate
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
