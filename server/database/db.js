const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'examhall.db');
let db = null;

async function getDb() {
    if (db) return db;
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','coordinator','invigilator','student')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

    db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL, subject_code TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

    db.run(`CREATE TABLE IF NOT EXISTS halls (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL,
    rows INTEGER NOT NULL CHECK(rows > 0), cols INTEGER NOT NULL CHECK(cols > 0),
    capacity INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

    db.run(`CREATE TABLE IF NOT EXISTS allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT NOT NULL,
    student_name TEXT NOT NULL, subject_code TEXT NOT NULL,
    hall_id INTEGER NOT NULL, hall_name TEXT NOT NULL,
    row_num INTEGER NOT NULL, col_num INTEGER NOT NULL,
    allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE CASCADE
  )`);

    db.run('CREATE INDEX IF NOT EXISTS idx_students_subject ON students(subject_code)');
    db.run('CREATE INDEX IF NOT EXISTS idx_allocations_hall ON allocations(hall_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_allocations_student ON allocations(student_id)');

    const adminCheck = db.exec("SELECT id FROM users WHERE username = 'admin'");
    if (adminCheck.length === 0 || adminCheck[0].values.length === 0) {
        const hash = bcrypt.hashSync('admin123', 10);
        db.run('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
            ['admin', hash, 'System Administrator', 'admin']);
        console.log('Default admin user created: admin / admin123');
    }

    saveDb();
    return db;
}

function saveDb() {
    if (db) {
        const data = db.export();
        fs.writeFileSync(DB_PATH, Buffer.from(data));
    }
}

function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
}

function queryOne(sql, params = []) {
    const results = queryAll(sql, params);
    return results.length > 0 ? results[0] : null;
}

function runSql(sql, params = []) {
    db.run(sql, params);
    const changes = db.getRowsModified();
    const lastId = queryOne('SELECT last_insert_rowid() as id');
    saveDb();
    return { changes, lastInsertRowid: lastId ? lastId.id : 0 };
}

module.exports = { getDb, saveDb, queryAll, queryOne, runSql };
