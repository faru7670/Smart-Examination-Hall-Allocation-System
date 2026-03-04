const express = require('express');
const QRCode = require('qrcode');
const { queryOne } = require('../database/db');
const router = express.Router();

router.get('/:studentId', async (req, res) => {
    try {
        const alloc = queryOne('SELECT * FROM allocations WHERE student_id = ?', [req.params.studentId]);
        if (!alloc) return res.status(404).json({ error: 'Student allocation not found.' });
        const qrData = JSON.stringify({ studentId: alloc.student_id, name: alloc.student_name, subject: alloc.subject_code, hall: alloc.hall_name, seat: `Row ${alloc.row_num}, Col ${alloc.col_num}` });
        const qrImage = await QRCode.toDataURL(qrData, { width: 300, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } });
        res.json({ allocation: alloc, qrCode: qrImage });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
