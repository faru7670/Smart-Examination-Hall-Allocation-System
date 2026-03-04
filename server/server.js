const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { getDb } = require('./database/db');

async function startServer() {
    await getDb();
    console.log('Database initialized.');

    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/students', require('./routes/students'));
    app.use('/api/halls', require('./routes/halls'));
    app.use('/api/allocations', require('./routes/allocation'));
    app.use('/api/allocate', require('./routes/allocation'));
    app.use('/api/analytics', require('./routes/analytics'));
    app.use('/api/export', require('./routes/export'));
    app.use('/api/qrcode', require('./routes/qrcode'));

    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Serve React build in production
    const clientBuild = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(clientBuild));
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuild, 'index.html'));
    });

    app.listen(PORT, () => {
        console.log(`ExamHall server running on http://localhost:${PORT}`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
