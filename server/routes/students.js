const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { queryAll, queryOne, runSql } = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', authenticate, (req, res) => {
    try { res.json(queryAll('SELECT * FROM students ORDER BY student_id')); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/subjects', authenticate, (req, res) => {
    try { res.json(queryAll('SELECT DISTINCT subject_code FROM students ORDER BY subject_code').map(s => s.subject_code)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/upload', authenticate, authorize('admin'), upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
        let records;
        try { records = parse(req.file.buffer.toString('utf-8'), { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true }); }
        catch (e) { return res.status(400).json({ error: 'Invalid CSV: ' + e.message }); }

        let added = 0, duplicates = 0, errors = 0;
        const errorDetails = [];
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const sid = row.StudentID || row.studentid || row.student_id || row.ID;
            const name = row.StudentName || row.studentname || row.student_name || row.Name || row.name;
            const subj = row.SubjectCode || row.subjectcode || row.subject_code || row.Subject || row.subject;
            if (!sid || !name || !subj) { errors++; errorDetails.push(`Row ${i + 2}: Missing fields`); continue; }
            if (queryOne('SELECT id FROM students WHERE student_id = ?', [sid.trim()])) { duplicates++; continue; }
            try { runSql('INSERT INTO students (student_id, name, subject_code) VALUES (?, ?, ?)', [sid.trim(), name.trim(), subj.trim().toUpperCase()]); added++; }
            catch (e) { duplicates++; }
        }
        const total = queryOne('SELECT COUNT(*) as count FROM students');
        res.json({ message: 'Upload complete', summary: { total_in_file: records.length, added, duplicates, errors, total_in_db: total.count }, errors: errorDetails });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/', authenticate, authorize('admin'), (req, res) => {
    try { runSql('DELETE FROM students'); runSql('DELETE FROM allocations'); res.json({ message: 'All data cleared.' }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
