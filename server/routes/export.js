const express = require('express');
const { db } = require('../config/firebase');
const PDFDocument = require('pdfkit');
const router = express.Router();

// Utility for fetching data (since these routes can be public if collegeId is provided)
const getExportData = async (collegeId) => {
    if (!collegeId) throw new Error('collegeId is required for export');

    const [hallsSnap, allocsSnap] = await Promise.all([
        db.collection('halls').where('collegeId', '==', collegeId).orderBy('name').get(),
        db.collection('allocations').where('collegeId', '==', collegeId).orderBy('hall_name').get()
    ]);

    // Sort allocs in memory
    const allocs = allocsSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.hall_name.localeCompare(b.hall_name) || a.row_num - b.row_num || a.col - b.col);
    const halls = hallsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return { halls, allocs };
};

const generatePDFBuffer = (halls, allocs) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });
        doc.on('error', reject);

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
    });
};

router.get('/csv', async (req, res) => {
    try {
        const collegeId = req.user?.collegeId || req.query.collegeId;
        const { allocs } = await getExportData(collegeId);
        let csv = 'StudentID,StudentName,SubjectCode,Hall,Row,Column\n';
        for (const a of allocs) csv += `${a.student_id},${a.student_name},${a.subject_code},${a.hall_name},${a.row_num},${a.col_num}\n`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="seat_allocation.csv"');
        res.send(csv);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/pdf', async (req, res) => {
    try {
        const collegeId = req.user?.collegeId || req.query.collegeId;
        const { halls, allocs } = await getExportData(collegeId);
        const pdfBuffer = await generatePDFBuffer(halls, allocs);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="seat_allocation.pdf"');
        res.send(pdfBuffer);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = { router, generatePDFBuffer, getExportData };
