import {
    collection, doc, getDocs, addDoc, deleteDoc, writeBatch, query, where
} from 'firebase/firestore';
import { db } from '../firebase';
import { allocateSeats } from './allocate';

function ensureDb() {
    if (!db) throw new Error('Firestore not initialized. Check your .env file.');
}

// ─── STUDENTS ─────────────────────────────────────────────────────────────────
export async function getStudents() {
    ensureDb();
    const snap = await getDocs(collection(db, 'students'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.student_id.localeCompare(b.student_id));
}

export async function addStudent(student) {
    ensureDb();
    const existing = await getDocs(query(collection(db, 'students'), where('student_id', '==', student.student_id)));
    if (!existing.empty) throw new Error(`Student ID "${student.student_id}" already exists`);
    await addDoc(collection(db, 'students'), student);
}

export async function uploadStudents(rows) {
    ensureDb();
    const existing = await getStudents();
    const existingIds = new Set(existing.map(s => s.student_id));
    let added = 0, duplicates = 0, errors = 0;
    const chunks = [];
    let current = writeBatch(db);
    let count = 0;
    for (const row of rows) {
        const student_id = String(row[0] || '').trim();
        const name = String(row[1] || '').trim();
        const subject_code = String(row[2] || '').trim().toUpperCase();
        if (!student_id || !name || !subject_code) { errors++; continue; }
        if (existingIds.has(student_id)) { duplicates++; continue; }
        if (count === 490) { chunks.push(current); current = writeBatch(db); count = 0; }
        current.set(doc(collection(db, 'students')), { student_id, name, subject_code });
        added++; count++;
    }
    if (count > 0) chunks.push(current);
    await Promise.all(chunks.map(b => b.commit()));
    return { added, duplicates, errors, total: existing.length + added };
}

export async function clearStudents() {
    ensureDb();
    const [sSnap, aSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'allocations'))
    ]);
    const b = writeBatch(db);
    sSnap.docs.forEach(d => b.delete(d.ref));
    aSnap.docs.forEach(d => b.delete(d.ref));
    await b.commit();
}

// ─── HALLS ────────────────────────────────────────────────────────────────────
export async function getHalls() {
    ensureDb();
    const snap = await getDocs(collection(db, 'halls'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function addHall({ name, rows, cols }) {
    ensureDb();
    const existing = await getDocs(query(collection(db, 'halls'), where('name', '==', name)));
    if (!existing.empty) throw new Error(`Hall "${name}" already exists`);
    const capacity = Number(rows) * Number(cols);
    const ref = await addDoc(collection(db, 'halls'), { name, rows: Number(rows), cols: Number(cols), capacity });
    return { id: ref.id, name, rows: Number(rows), cols: Number(cols), capacity };
}

export async function deleteHall(hallId) {
    ensureDb();
    const allocs = await getDocs(query(collection(db, 'allocations'), where('hall_id', '==', hallId)));
    const b = writeBatch(db);
    allocs.docs.forEach(d => b.delete(d.ref));
    b.delete(doc(db, 'halls', hallId));
    await b.commit();
}

// ─── ALLOCATION ───────────────────────────────────────────────────────────────
export async function runAllocation() {
    ensureDb();
    const [students, halls] = await Promise.all([getStudents(), getHalls()]);
    if (!students.length) throw new Error('No students! Upload student data first.');
    if (!halls.length) throw new Error('No halls! Add halls first.');

    // Clear existing
    const old = await getDocs(collection(db, 'allocations'));
    if (!old.empty) {
        const b = writeBatch(db);
        old.docs.forEach(d => b.delete(d.ref));
        await b.commit();
    }

    const { allocations, unallocated } = allocateSeats(students, halls);

    // Save in batches
    const chunks = [];
    let current = writeBatch(db);
    let count = 0;
    for (const a of allocations) {
        if (count === 490) { chunks.push(current); current = writeBatch(db); count = 0; }
        current.set(doc(collection(db, 'allocations')), a);
        count++;
    }
    if (count > 0) chunks.push(current);
    await Promise.all(chunks.map(b => b.commit()));
    return { allocated: allocations.length, unallocated: unallocated.length };
}

export async function getAllocations() {
    ensureDb();
    const snap = await getDocs(collection(db, 'allocations'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getHallAllocation(hallId) {
    ensureDb();
    const snap = await getDocs(query(collection(db, 'allocations'), where('hall_id', '==', hallId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function searchAllocations(q) {
    ensureDb();
    const all = await getAllocations();
    const upper = q.toUpperCase();
    return all.filter(a => String(a.student_id).toUpperCase().includes(upper) || String(a.student_name).toUpperCase().includes(upper));
}
