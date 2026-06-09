import PDFDocument from 'pdfkit';
import { JSONDB } from '../db.js';

const db = JSONDB.getInstance();

export function generateSessionPDF(sessionId: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // 1. Fetch Session and Subject Details
      const session = db.getQRSessions().find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Attendance session not found');
      }

      const subject = db.getSubjects().find(s => s.id === session.subjectId);
      const attendanceLogs = db.getAttendance().filter(a => a.subjectId === session.subjectId && a.date === session.generatedTime.split('T')[0]);

      // Metrics calculation
      const totalEnrolled = db.getStudents().filter(s => s.department.toLowerCase() === (subject?.department || '').toLowerCase()).length;
      const totalPresent = attendanceLogs.filter(a => a.status === 'Present').length;
      const totalLate = attendanceLogs.filter(a => a.status === 'Late').length;
      const totalAttended = totalPresent + totalLate;
      const attendancePct = totalEnrolled > 0 ? Math.round((totalAttended / totalEnrolled) * 100) : 0;

      // 2. Render Header Branding
      doc.fillColor('#1e1b4b')
         .font('Helvetica-Bold')
         .fontSize(22)
         .text('Apex Institute Of Technology', { align: 'center' });
      
      doc.fontSize(10)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('ERP Ledger Registry & Dynamic Course Logs', { align: 'center' })
         .moveDown(1.5);

      // Draw Separator Rule
      doc.strokeColor('#e2e8f0')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke()
         .moveDown(1);

      // 3. Render Session Metadata Panel
      const metadataStartY = doc.y;
      
      doc.fillColor('#1e3a8a')
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('SESSION METADATA')
         .moveDown(0.4);

      doc.fillColor('#334155')
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('Subject Course: ', { continued: true })
         .font('Helvetica')
         .text(`${session.subjectName} (${subject?.code || 'N/A'})`)
         
         .font('Helvetica-Bold')
         .text('Assigned Faculty: ', { continued: true })
         .font('Helvetica')
         .text(session.teacherName)
         
         .font('Helvetica-Bold')
         .text('Broadcast Date: ', { continued: true })
         .font('Helvetica')
         .text(new Date(session.generatedTime).toLocaleDateString())
         
         .font('Helvetica-Bold')
         .text('Session Code: ', { continued: true })
         .font('Helvetica')
         .text(session.sessionCode);

      // Right Metadata column (Metrics Box)
      doc.rect(365, metadataStartY - 5, 180, 75)
         .fillOpacity(0.04)
         .fillAndStroke('#4f46e5', '#e0e7ff');

      // Reset text options and write metrics inside Box
      doc.fillOpacity(1);
      doc.fillColor('#4338ca')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('Attendance Analytics', 375, metadataStartY)
         .fontSize(8)
         .fillColor('#1e293b')
         .text(`Total Enrolled: ${totalEnrolled}`, 375, metadataStartY + 16)
         .text(`Total Present: ${totalPresent}`, 375, metadataStartY + 28)
         .text(`Total Late Checkins: ${totalLate}`, 375, metadataStartY + 40)
         .fontSize(10)
         .fillColor('#059669')
         .text(`Attendance Pct: ${attendancePct}%`, 375, metadataStartY + 54);

      // Reset cursor down below the metadata block
      doc.x = 50;
      doc.y = metadataStartY + 90;

      // 4. Render Table Grid Of Attendance Records
      doc.fillColor('#1e1b4b')
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('STUDENT RECONCILIATION ROLL-CALL')
         .moveDown(0.5);

      const tableTop = doc.y;
      const cols = {
        rollNumber: 50,
        studentName: 160,
        time: 320,
        status: 420,
        coords: 480
      };

      // Table Header Row background
      doc.rect(50, tableTop - 3, 495, 18)
         .fill('#f1f5f9');

      doc.fillColor('#475569')
         .font('Helvetica-Bold')
         .fontSize(8)
         .text('ROLL NUMBER', cols.rollNumber, tableTop)
         .text('STUDENT FULL NAME', cols.studentName, tableTop)
         .text('CHECK-IN TIME', cols.time, tableTop)
         .text('STATUS', cols.status, tableTop)
         .text('GPS COORDS', cols.coords, tableTop);

      let currentY = tableTop + 18;
      doc.font('Helvetica').fontSize(8).fillColor('#334155');

      // Loop through enrolled students to see if present or absent
      const enrolledStudents = db.getStudents().filter(
        s => s.department.toLowerCase() === (subject?.department || '').toLowerCase()
      );

      if (enrolledStudents.length === 0) {
        doc.text('No enrolled students found in this course department.', 50, currentY + 10, { align: 'center' });
      } else {
        enrolledStudents.forEach((student, idx) => {
          // If Y-position exceeds single-page margin, add a new page
          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }

          // Alternating row highlighting
          if (idx % 2 === 1) {
            doc.rect(50, currentY - 2, 495, 15).fill('#f8fafc');
          }

          const record = attendanceLogs.find(a => a.studentId === student.id);
          const timeText = record ? record.time : '—';
          const statusText = record ? record.status : 'Absent';
          const statusColor = statusText === 'Present' ? '#10b981' : statusText === 'Late' ? '#f59e0b' : '#ef4444';
          const gpsText = record && record.latitude && record.longitude 
            ? `${record.latitude.toFixed(3)}, ${record.longitude.toFixed(3)}` 
            : '—';

          doc.fillColor('#1e293b')
             .font('Helvetica-Bold')
             .text(student.rollNumber, cols.rollNumber, currentY)
             .font('Helvetica')
             .text(student.fullName, cols.studentName, currentY)
             .text(timeText, cols.time, currentY);

          // Write colored Status
          doc.fillColor(statusColor)
             .font('Helvetica-Bold')
             .text(statusText, cols.status, currentY);

          doc.fillColor('#64748b')
             .font('Helvetica')
             .text(gpsText, cols.coords, currentY);

          currentY += 15;
        });
      }

      // 5. PDF Footer branding
      doc.strokeColor('#f1f5f9')
         .lineWidth(1)
         .moveTo(50, 780)
         .lineTo(545, 780)
         .stroke();

      doc.fontSize(7)
         .fillColor('#94a3b8')
         .font('Helvetica-Oblique')
         .text('Apex ERP Biometric Smart Tracking — Confidential Report', 50, 785, { continued: true })
         .font('Helvetica')
         .text(` | report generated dynamically on: ${new Date().toLocaleString()}`, { align: 'right' });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
