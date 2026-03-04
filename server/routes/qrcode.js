const express = require('express');
const QRCode = require('qrcode');
const { db } = require('../config/firebase');
const router = express.Router();

// The public UI student lookup hits this endpoint, so we need collegeId from query
router.get('/:studentId', async (req, res) => {
    try {
        const { collegeId } = req.query;
        if (!collegeId) return res.status(400).json({ error: 'collegeId is required.' });

        const qs = await db.collection('allocations')
            .where('collegeId', '==', collegeId)
            .where('student_id', '==', req.params.studentId.trim())
            .limit(1)
            .get();

        if (qs.empty) return res.status(404).json({ error: 'Student allocation not found.' });
        const alloc = qs.docs[0].data();

        const qrData = JSON.stringify({
            collegeId: alloc.collegeId,
            studentId: alloc.student_id,
            name: alloc.student_name,
            subject: alloc.subject_code,
            hall: alloc.hall_name,
            seat: `Row ${alloc.row_num}, Col ${alloc.col_num}`
        });
        const qrImage = await QRCode.toDataURL(qrData, { width: 300, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } });
        res.json({ allocation: alloc, qrCode: qrImage });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
