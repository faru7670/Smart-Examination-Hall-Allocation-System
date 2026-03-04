import {
    collection, doc, getDocs, getDoc, addDoc, deleteDoc, writeBatch,
    query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { allocateSeats } from './allocate';

// ─── STUDENTS ────────────────────────────────────────────────────────────────

export async function getStudents(collegeId) {
    if (!db) return [];
    const q = query(collection(db, 'students'), where('collegeId', '==', collegeId), orderBy('student_id'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addStudent(collegeId, { student_id, name, subject_code }) {
    if (!db) throw new Error('Firebase not initialized');
    // Check duplicate
    const q = query(collection(db, 'students'), where('collegeId', '==', collegeId), where('student_id', '==', student_id));
    const existing = await getDocs(q);
    if (!existing.empty) throw new Error(`Student ID ${student_id} already exists`);
    await addDoc(collection(db, 'students'), { collegeId, student_id, name, subject_code, createdAt: serverTimestamp() });
}

export async function uploadStudents(collegeId, rows) {
    if (!db) throw new Error('Firebase not initialized');
    // Get existing IDs
    const existing = await getStudents(collegeId);
    const existingIds = new Set(existing.map(s => s.student_id));

    let added = 0, duplicates = 0, errors = 0;
    const batch = writeBatch(db);
    let batchCount = 0;
    const batches = [batch];

    for (const row of rows) {
        const student_id = String(row[0] || '').trim();
        const name = String(row[1] || '').trim();
        const subject_code = String(row[2] || '').trim();
        if (!student_id || !name || !subject_code) { errors++; continue; }
        if (existingIds.has(student_id)) { duplicates++; continue; }

        if (batchCount === 490) {
            batches.push(writeBatch(db));
            batchCount = 0;
        }
        const ref = doc(collection(db, 'students'));
        batches[batches.length - 1].set(ref, { collegeId, student_id, name, subject_code, createdAt: serverTimestamp() });
        added++;
        batchCount++;
    }
    await Promise.all(batches.map(b => b.commit()));
    return { added, duplicates, errors, total_in_file: rows.length, total_in_db: existing.length + added };
}

export async function clearStudents(collegeId) {
    if (!db) throw new Error('Firebase not initialized');
    const snap = await getDocs(query(collection(db, 'students'), where('collegeId', '==', collegeId)));
    const snap2 = await getDocs(query(collection(db, 'allocations'), where('collegeId', '==', collegeId)));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    snap2.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
}

// ─── HALLS ───────────────────────────────────────────────────────────────────

export async function getHalls(collegeId) {
    if (!db) return [];
    const q = query(collection(db, 'halls'), where('collegeId', '==', collegeId), orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addHall(collegeId, { name, rows, cols }) {
    if (!db) throw new Error('Firebase not initialized');
    const q = query(collection(db, 'halls'), where('collegeId', '==', collegeId), where('name', '==', name));
    const existing = await getDocs(q);
    if (!existing.empty) throw new Error('Hall name already exists');
    const capacity = rows * cols;
    const ref = await addDoc(collection(db, 'halls'), { collegeId, name, rows: Number(rows), cols: Number(cols), capacity });
    return { id: ref.id, collegeId, name, rows: Number(rows), cols: Number(cols), capacity };
}

export async function deleteHall(collegeId, hallId) {
    if (!db) throw new Error('Firebase not initialized');
    const hallRef = doc(db, 'halls', hallId);
    const hallDoc = await getDoc(hallRef);
    if (!hallDoc.exists() || hallDoc.data().collegeId !== collegeId) throw new Error('Hall not found');
    const allocSnap = await getDocs(query(collection(db, 'allocations'), where('collegeId', '==', collegeId), where('hall_id', '==', hallId)));
    const batch = writeBatch(db);
    allocSnap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(hallRef);
    await batch.commit();
}

// ─── ALLOCATIONS ─────────────────────────────────────────────────────────────

export async function runAllocation(collegeId) {
    if (!db) throw new Error('Firebase not initialized');
    const [students, halls] = await Promise.all([getStudents(collegeId), getHalls(collegeId)]);
    if (students.length === 0) throw new Error('No students. Upload data first.');
    if (halls.length === 0) throw new Error('No halls. Add halls first.');

    // Clear existing
    const existing = await getDocs(query(collection(db, 'allocations'), where('collegeId', '==', collegeId)));
    const clearBatch = writeBatch(db);
    existing.docs.forEach(d => clearBatch.delete(d.ref));
    await clearBatch.commit();

    const { allocations, unallocated } = allocateSeats(students, halls);

    // Save in batches of 490
    let batch = writeBatch(db);
    let count = 0;
    const batches = [batch];
    for (const a of allocations) {
        if (count === 490) { batches.push(writeBatch(db)); count = 0; }
        batches[batches.length - 1].set(doc(collection(db, 'allocations')), { collegeId, ...a });
        count++;
    }
    await Promise.all(batches.map(b => b.commit()));

    // Count violations
    let violations = 0;
    const byHall = {};
    for (const a of allocations) { if (!byHall[a.hall_id]) byHall[a.hall_id] = []; byHall[a.hall_id].push(a); }
    for (const seats of Object.values(byHall)) {
        const sorted = seats.sort((a, b) => a.row_num - b.row_num || a.col_num - b.col_num);
        for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].row_num === sorted[i + 1].row_num && sorted[i + 1].col_num === sorted[i].col_num + 1 && sorted[i].subject_code === sorted[i + 1].subject_code) violations++;
        }
    }
    return { allocated: allocations.length, unallocated: unallocated.length, violations };
}

export async function getHallGrid(collegeId, hall) {
    if (!db) return null;
    const seatsSnap = await getDocs(query(collection(db, 'allocations'), where('collegeId', '==', collegeId), where('hall_id', '==', hall.id)));
    const seats = seatsSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.row_num - b.row_num || a.col_num - b.col_num);
    const grid = [];
    for (let r = 1; r <= hall.rows; r++) {
        const row = [];
        for (let c = 1; c <= hall.cols; c++) {
            const seat = seats.find(s => s.row_num === r && s.col_num === c);
            row.push(seat || { row_num: r, col_num: c, empty: true });
        }
        grid.push(row);
    }
    return { hall, grid, total_seated: seats.length };
}

export async function getAllocations(collegeId) {
    if (!db) return [];
    const q = query(collection(db, 'allocations'), where('collegeId', '==', collegeId), orderBy('hall_name'), orderBy('row_num'), orderBy('col_num'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function searchAllocations(collegeId, searchQuery) {
    if (!db) return [];
    const snap = await getDocs(query(collection(db, 'allocations'), where('collegeId', '==', collegeId)));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const q = searchQuery.toUpperCase();
    return all.filter(a => String(a.student_id).toUpperCase().includes(q) || String(a.student_name).toUpperCase().includes(q));
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

export async function getAnalytics(collegeId) {
    if (!db) return null;
    const [students, halls, allocs] = await Promise.all([
        getStudents(collegeId),
        getHalls(collegeId),
        getAllocations(collegeId)
    ]);
    const totalSeats = halls.reduce((sum, h) => sum + h.capacity, 0);
    const subjectMap = {};
    students.forEach(s => { subjectMap[s.subject_code] = (subjectMap[s.subject_code] || 0) + 1; });
    const subjectDistribution = Object.entries(subjectMap).map(([subject_code, count]) => ({ subject_code, count }));
    const hallUtilization = halls.map(h => ({
        name: h.name,
        capacity: h.capacity,
        seated: allocs.filter(a => a.hall_id === h.id).length
    }));
    return {
        totalStudents: students.length,
        totalHalls: halls.length,
        totalSeats,
        allocatedStudents: allocs.length,
        unallocatedStudents: students.length - allocs.length,
        allocationPercentage: students.length > 0 ? Math.round((allocs.length / students.length) * 100) : 0,
        subjectDistribution,
        hallUtilization
    };
}

// ─── USER PROFILE ─────────────────────────────────────────────────────────────

export async function getUserProfile(uid) {
    if (!db) return null;
    const docSnap = await getDoc(doc(db, 'users', uid));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function createUserProfile(uid, { email, collegeName, role = 'admin' }) {
    if (!db) throw new Error('Firebase not initialized');
    // Create college
    const collegeRef = await addDoc(collection(db, 'colleges'), { name: collegeName, createdAt: serverTimestamp() });
    // Create user
    await writeBatch(db).set(doc(db, 'users', uid), {
        uid, email, role, collegeId: collegeRef.id, collegeName
    });
    // Use separate set since batch needs commit
    const b = writeBatch(db);
    b.set(doc(db, 'users', uid), { uid, email, role, collegeId: collegeRef.id, collegeName });
    await b.commit();
    return { uid, email, role, collegeId: collegeRef.id, collegeName };
}
