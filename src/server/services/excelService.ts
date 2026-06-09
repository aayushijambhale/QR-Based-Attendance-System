import ExcelJS from 'exceljs';
import { JSONDB } from '../db.js';

const db = JSONDB.getInstance();

export async function generateSessionExcel(sessionId: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Report');

  // 1. Fetch data
  const session = db.getQRSessions().find(s => s.id === sessionId);
  if (!session) {
    throw new Error('Attendance session not found');
  }

  const subject = db.getSubjects().find(s => s.id === session.subjectId);
  const attendanceLogs = db.getAttendance().filter(a => a.subjectId === session.subjectId && a.date === session.generatedTime.split('T')[0]);
  const enrolledStudents = db.getStudents().filter(
    s => s.department.toLowerCase() === (subject?.department || '').toLowerCase()
  );

  // 2. Set columns structure
  worksheet.columns = [
    { header: 'Student Name', key: 'name', width: 25 },
    { header: 'Roll Number', key: 'roll', width: 18 },
    { header: 'Subject Course', key: 'subject', width: 28 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Check-In Time', key: 'time', width: 16 },
    { header: 'Attainment Status', key: 'status', width: 18 },
    { header: 'Latitude', key: 'lat', width: 14 },
    { header: 'Longitude', key: 'lng', width: 14 }
  ];

  // Title block on top (insert row to styling)
  worksheet.insertRow(1, []);
  worksheet.insertRow(2, ['Apex Institute of Technology - Ledger Report']);
  worksheet.insertRow(3, [`Course : ${session.subjectName} (${subject?.code || 'N/A'}) - Lecturer : ${session.teacherName}`]);
  worksheet.insertRow(4, [`Generated on ${new Date().toLocaleString()}`]);
  worksheet.insertRow(5, []);

  // Title styling
  worksheet.mergeCells('A2:H2');
  worksheet.getCell('A2').font = { size: 16, bold: true, color: { argb: 'FF1e1b4b' } };
  worksheet.mergeCells('A3:H3');
  worksheet.getCell('A3').font = { size: 11, italic: true, color: { argb: 'FF475569' } };
  worksheet.mergeCells('A4:H4');
  worksheet.getCell('A4').font = { size: 9, color: { argb: 'FF94a3b8' } };

  // Shifts core table header headers down
  worksheet.getRow(6).values = [
    'Student Name', 'Roll Number', 'Subject Course', 'Date', 'Check-In Time', 'Attainment Status', 'Latitude', 'Longitude'
  ];

  // Header styles
  worksheet.getRow(6).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(6).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' } // Indigo solid fill
  };

  // Add records
  enrolledStudents.forEach(student => {
    const record = attendanceLogs.find(a => a.studentId === student.id);
    const statusVal = record ? record.status : 'Absent';
    const timeVal = record ? record.time : '—';
    const dateVal = record ? record.date : session.generatedTime.split('T')[0];
    const latVal = record && record.latitude ? record.latitude : '—';
    const lngVal = record && record.longitude ? record.longitude : '—';

    const row = worksheet.addRow({
      name: student.fullName,
      roll: student.rollNumber,
      subject: session.subjectName,
      date: dateVal,
      time: timeVal,
      status: statusVal,
      lat: latVal,
      lng: lngVal
    });

    // Color code statuses
    const cellStatus = row.getCell('status');
    if (statusVal === 'Present') {
      cellStatus.font = { color: { argb: 'FF059669' }, bold: true };
    } else if (statusVal === 'Late') {
      cellStatus.font = { color: { argb: 'FFD97706' }, bold: true };
    } else {
      cellStatus.font = { color: { argb: 'FFDC2626' }, bold: true };
    }
  });

  // Apply border styles
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 6) {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    }
  });

  // Write sheet buffer and return
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
