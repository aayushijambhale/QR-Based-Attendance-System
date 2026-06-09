import { Server as SocketIOServer } from 'socket.io';
import { JSONDB } from '../db.js';

let ioInstance: SocketIOServer | null = null;
const lastBroadcastedTokens = new Map<string, string>();

export function initializeAttendanceSocket(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[SOCKET CONNECTION] Active connection: ${socket.id}`);

    // Allow joining specific rooms (e.g., room for a specific course session)
    socket.on('joinSessionRoom', (sessionId: string) => {
      socket.join(`session_${sessionId}`);
      console.log(`[SOCKET JOIN] Client ${socket.id} joined room: session_${sessionId}`);
    });

    socket.on('leaveSessionRoom', (sessionId: string) => {
      socket.leave(`session_${sessionId}`);
      console.log(`[SOCKET LEAVE] Client ${socket.id} left room: session_${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET DISCONNECT] Client disconnected: ${socket.id}`);
    });
  });

  // Background secure QR token auto-regeneration (ticking every 1-2 seconds for high responsiveness)
  setInterval(() => {
    try {
      const db = JSONDB.getInstance();
      const sessions = db.getQRSessions(); // This triggers expiration check and rotating token generation in db.json if 30s elapsed

      sessions.forEach(s => {
        if (s.status === 'Active') {
          const prevToken = lastBroadcastedTokens.get(s.id);
          if (prevToken !== s.qrToken) {
            lastBroadcastedTokens.set(s.id, s.qrToken);
            console.log(`[SOCKET TOKEN ROTATION] Session: ${s.id}, new token: ${s.qrToken}`);
            
            // Broadcast update events universally
            io.emit('sessionTokenUpdated', {
              sessionId: s.id,
              qrToken: s.qrToken,
              lastRegeneratedAt: s.lastRegeneratedAt
            });

            // Also broadcast specifically to the session room
            io.to(`session_${s.id}`).emit('sessionTokenUpdated', {
              sessionId: s.id,
              qrToken: s.qrToken,
              lastRegeneratedAt: s.lastRegeneratedAt
            });
          }
        } else {
          lastBroadcastedTokens.delete(s.id);
        }
      });
    } catch (err) {
      console.error('[SOCKET BACKEND REFLECTION ERROR]:', err);
    }
  }, 2000);
}

// Broadcasting API hooks for use within our REST express controllers
export const SocketNotifier = {
  notifyAttendanceMarked: (sessionId: string, data: any) => {
    if (ioInstance) {
      console.log(`[SOCKET BROADCAST] Emit attendanceMarked for session: ${sessionId}`);
      // Notify active listeners (the teacher dashboard listening to a specific session room)
      ioInstance.to(`session_${sessionId}`).emit('attendanceMarked', data);
      ioInstance.emit('attendanceUpdated', { sessionId, ...data });
    }
  },

  notifySessionStarted: (session: any) => {
    if (ioInstance) {
      console.log(`[SOCKET BROADCAST] Emit sessionStarted: ${session.id}`);
      ioInstance.emit('sessionStarted', session);
    }
  },

  notifySessionEnded: (sessionId: string) => {
    if (ioInstance) {
      console.log(`[SOCKET BROADCAST] Emit sessionEnded: ${sessionId}`);
      ioInstance.emit('sessionEnded', { sessionId });
    }
  }
};
