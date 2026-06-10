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
  Sparkles,
  Play
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
    // Refresh sessions status every 5 seconds
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
    <div className="space-y-6 animate-fade-in" id="qr-sessions-view">
      {/* Header element */}
      <div>
        <h1 className="text-2xl font-bold text-[#134E4A] tracking-tight">Active Dynamic QR Gateway</h1>
        <p className="text-[#64748B] text-xs mt-1">Generate dynamic student check-in QR codes, regulate expiration triggers, and supervise active sessions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* QR Session Spawning Tool Panel */}
        <div className="saas-card p-6 lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 pb-3.5 border-b border-[#E2E8F0] mb-4">
            <QrCode className="h-4 w-4 text-[#0F766E] animate-pulse" />
            <span className="text-xs font-bold text-[#134E4A] uppercase tracking-wider">Generate Dynamic QR</span>
          </div>

          {subjects.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#64748B]">
              Create subjects inside the "Subjects" directory first!
            </div>
          ) : (
            <form onSubmit={handleLaunchSession} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wide mb-2">
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
                <label className="block text-xs font-semibold text-[#134E4A] uppercase tracking-wide mb-2">
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
                className="w-full mt-4 saas-button-primary flex items-center justify-center gap-2 py-3"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Publish QR Attendance Session</span>
              </button>
            </form>
          )}

          <div className="mt-6 p-4 rounded-md bg-[#EAF5F5] border border-[#14B8A6] text-[11px] text-[#0F766E] leading-relaxed">
            <Sparkles className="h-4 w-4 mb-2 text-[#0F766E] shrink-0" />
            Each distinct session publishes an unique, encodable payload token. Students scanning in after expiration will trigger rejection notices!
          </div>
        </div>

        {/* Supervision Audit Table List */}
        <div className="lg:col-span-2 saas-card p-6">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5 mb-4">
            <h3 className="text-sm font-bold text-[#134E4A]">Attendance QR Session History</h3>
            <button
              onClick={loadSessionsData}
              className="text-xs text-[#0F766E] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Hard Refresh</span>
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="py-20 text-center text-[#64748B] bg-[#FFFBF5] border-2 border-dashed border-[#E2E8F0] rounded-md">
              <QrCode className="h-10 w-10 mx-auto text-[#64748B] mb-3" />
              <p className="text-xs font-bold">No Sessions Records Avaible</p>
              <p className="text-[11px] text-[#64748B] mt-1">Specify parameters on the left to activate first code transaction gateway!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs" id="sessions-table">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[10px] font-bold text-[#64748B] uppercase tracking-wider select-none">
                    <th className="py-3">Syllabus Subject</th>
                    <th className="py-3">Faculty Lecturer</th>
                    <th className="py-3">Generated Time</th>
                    <th className="py-3">Status Flag</th>
                    <th className="py-3 text-right">Gate Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#134E4A]">
                  {sessions.map((sess) => {
                    const isSessionActive = sess.status === 'Active' && new Date(sess.expiryTime) > new Date();
                    return (
                      <tr key={sess.id} className="hover:bg-[#FFFBF5] group" id={`session-row-${sess.id}`}>
                        {/* Course info */}
                        <td className="py-3.5 font-semibold text-[#134E4A] pr-2">
                          <p className="leading-snug">{sess.subjectName}</p>
                          <code className="text-[10px] text-[#64748B] mt-1 font-mono block">Code: {sess.sessionCode.slice(0, 16)}...</code>
                        </td>

                        {/* faculty */}
                        <td className="py-3.5 text-[#64748B]">
                          {sess.teacherName}
                        </td>

                        {/* generated time */}
                        <td className="py-3.5 font-mono text-[#64748B]">
                          {new Date(sess.generatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-[9px] text-[#64748B] block mt-0.5">{new Date(sess.generatedTime).toLocaleDateString()}</span>
                        </td>

                        {/* status badge */}
                        <td className="py-3.5">
                          {isSessionActive ? (
                            <span className="px-2.5 py-0.5 rounded-full border border-[#14B8A6] bg-[#EAF5F5] text-[#0F766E] text-[9px] font-extrabold flex items-center gap-1 w-fit animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A6]" />
                              ACTIVE
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full border border-[#E2E8F0] bg-[#FFFBF5] text-[#64748B] text-[9px] font-extrabold flex items-center gap-1 w-fit">
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
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#0F766E] hover:text-[#134E4A] bg-[#EAF5F5] hover:bg-[#CCECEC] rounded-md transition-colors cursor-pointer"
                            >
                              Display QR
                            </button>

                            {isSessionActive && (
                              <button
                                onClick={() => handleForceExpire(sess.id)}
                                id={`expire-session-btn-${sess.id}`}
                                title="Force deactivate session"
                                className="p-1.5 text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-md transition-colors cursor-pointer"
                              >
                                <Power className="h-4 w-4" />
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-sm shadow-2xl border border-[#E2E8F0] overflow-hidden text-center animate-zoom-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#FFFBF5]">
              <span className="text-xs font-mono text-[#64748B] uppercase tracking-widest leading-none">Attendance QR Terminal</span>
              <button 
                onClick={() => setActiveQRModal(null)} 
                className="text-[#64748B] hover:text-[#134E4A] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main content body */}
            <div className="p-6 space-y-5 flex flex-col items-center">
              <div>
                <h3 className="font-extrabold text-[#134E4A] text-md leading-tight">{activeQRModal.subjectName}</h3>
                <p className="text-[11px] text-[#64748B] mt-1 uppercase tracking-wide font-sans">{activeQRModal.teacherName}</p>
              </div>

              {/* Real dynamic image from qrserver API */}
              <div className="bg-white p-4 rounded-md border border-[#E2E8F0] shadow-md ring-1 ring-[#E2E8F0] relative shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeQRModal.sessionCode)}`}
                  alt="Dynamic Session Attendance Check-in QR Code"
                  referrerPolicy="no-referrer"
                  className="h-48 w-48 object-contain select-none opacity-95 group-hover:opacity-100 transition-opacity"
                />
                
                {/* Overlay badge if Expired */}
                {(activeQRModal.status === 'Expired' || inspectedTimeLeft === 'Expired') && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in select-none">
                    <X className="h-8 w-8 text-[#EF4444] mb-2" />
                    <span className="text-xs font-bold text-[#134E4A] uppercase tracking-wider">QR Code Expired</span>
                    <span className="text-[10px] text-[#64748B] block mt-1">This entry key has expired</span>
                  </div>
                )}
              </div>

              {/* Expiry display widget */}
              <div className="w-full bg-[#FFFBF5] p-4 rounded-md border border-[#E2E8F0] shrink-0">
                <span className="text-[9px] text-[#64748B] uppercase font-bold block tracking-wider font-sans">Remaining Access Time</span>
                
                {activeQRModal.status === 'Active' && inspectedTimeLeft !== 'Expired' ? (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Clock className="h-5 w-5 text-[#0F766E] animate-pulse shrink-0" />
                    <span className="text-3xl font-mono font-extrabold text-[#134E4A] tracking-tight">
                      {inspectedTimeLeft || '--:--'}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-[#64748B] mt-1.5 block">Access Revoked</span>
                )}
              </div>

              {/* Simulative Scans Notice */}
              <span className="text-[10px] text-[#64748B] block max-w-xs leading-normal">
                Instruct student devices to aim their sensors at this canvas. Scan simulator runs are available under <b>Control Console</b>.
              </span>

              {/* Force Deactivate */}
              {activeQRModal.status === 'Active' && inspectedTimeLeft !== 'Expired' && (
                <button
                  onClick={() => handleForceExpire(activeQRModal.id)}
                  id="close-terminal-btn"
                  className="w-full bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-xs py-3 rounded-md transition-colors shrink-0 cursor-pointer"
                >
                  Force Close Entry Gate
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
