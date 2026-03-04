const express = require('express');
const { queryAll } = require('../database/db');
const PDFDocument = require('pdfkit');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/csv', authenticate, (req, res) => {
    try {
        const allocs = queryAll('SELECT student_id, student_name, subject_code, hall_name, row_num, col_num FROM allocations ORDER BY hall_name, row_num, col_num');
        let csv = 'StudentID,StudentName,SubjectCode,Hall,Row,Column\n';
        for (const a of allocs) csv += `${a.student_id},${a.student_name},${a.subject_code},${a.hall_name},${a.row_num},${a.col_num}\n`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="seat_allocation.csv"');
        res.send(csv);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/pdf', authenticate, (req, res) => {
    try {
        const halls = queryAll('SELECT * FROM halls ORDER BY name');
        const allocs = queryAll('SELECT * FROM allocations ORDER BY hall_name, row_num, col_num');
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="seat_allocation.pdf"');
        doc.pipe(res);

        doc.fontSize(20).font('Helvetica-Bold').text('Smart Examination Hall Allocation Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(14).font('Helvetica-Bold').text('Summary');
        doc.fontSize(10).font('Helvetica').text(`Total Allocated: ${allocs.length}`).text(`Total Halls: ${halls.length}`);
        doc.moveDown(1);

        for (const hall of halls) {
            const ha = allocs.filter(a => a.hall_id === hall.id);
            if (ha.length === 0) continue;
            doc.addPage();
            doc.fontSize(14).font('Helvetica-Bold').text(`${hall.name} (${hall.rows}x${hall.cols} = ${hall.capacity} seats)`);
            doc.moveDown(0.5);
            const sx = 40; let y = doc.y; const cw = [80, 120, 100, 50, 50]; const hd = ['Student ID', 'Name', 'Subject', 'Row', 'Col'];
            doc.fontSize(9).font('Helvetica-Bold');
            let x = sx; for (let i = 0; i < hd.length; i++) { doc.text(hd[i], x, y, { width: cw[i] }); x += cw[i]; }
            y += 15; doc.moveTo(sx, y).lineTo(sx + cw.reduce((a, b) => a + b, 0), y).stroke(); y += 5;
            doc.font('Helvetica').fontSize(8);
            for (const a of ha) {
                if (y > 750) { doc.addPage(); y = 40; }
                x = sx;[a.student_id, a.student_name, a.subject_code, String(a.row_num), String(a.col_num)].forEach((v, i) => { doc.text(v, x, y, { width: cw[i] }); x += cw[i]; }); y += 14;
            }
        }
        doc.end();
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
