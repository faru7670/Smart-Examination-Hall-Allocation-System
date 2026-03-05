import { collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

export async function getStudents(collegeCode) {
    if (!db || !collegeCode) return []
    const snap = await getDocs(collection(db, `colleges/${collegeCode}/students`))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addStudent(collegeCode, student) {
    if (!collegeCode) throw new Error("Missing college code")
    await setDoc(doc(db, `colleges/${collegeCode}/students`, student.student_id), student)
}

export async function addStudentsBatch(collegeCode, students) {
    const batch = writeBatch(db)
    students.forEach(s => {
        batch.set(doc(db, `colleges/${collegeCode}/students`, s.student_id), s)
    })
    await batch.commit()
}

export async function deleteStudent(collegeCode, studentId) {
    await deleteDoc(doc(db, `colleges/${collegeCode}/students`, studentId))
}

export async function clearAllStudents(collegeCode) {
    const students = await getStudents(collegeCode)
    const batch = writeBatch(db)
    students.forEach(s => batch.delete(doc(db, `colleges/${collegeCode}/students`, s.id)))
    await batch.commit()
}

// ---- HALLS ----
export async function getHalls(collegeCode) {
    if (!db || !collegeCode) return []
    const snap = await getDocs(collection(db, `colleges/${collegeCode}/halls`))
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.capacity - a.capacity)
}

export async function addHall(collegeCode, hall) {
    if (!hall.name || hall.rows < 1 || hall.cols < 1) throw new Error('Invalid hall data')

    // Check duplicates
    const exist = await getHalls(collegeCode)
    if (exist.some(h => h.name.toLowerCase() === hall.name.toLowerCase())) {
        throw new Error(`Hall "${hall.name}" already exists`)
    }

    const docRef = doc(collection(db, `colleges/${collegeCode}/halls`))
    await setDoc(docRef, { ...hall, capacity: hall.rows * hall.cols })
}

export async function deleteHall(collegeCode, hallId) {
    await deleteDoc(doc(db, `colleges/${collegeCode}/halls`, hallId))
}

// ---- ALLOCATIONS ----
export async function getAllocations(collegeCode) {
    if (!db || !collegeCode) return []
    const snap = await getDocs(collection(db, `colleges/${collegeCode}/allocations`))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function saveAllocations(collegeCode, allocations) {
    // 1. Clear existing
    const existing = await getAllocations(collegeCode)
    const batch = writeBatch(db)
    existing.forEach(a => batch.delete(doc(db, `colleges/${collegeCode}/allocations`, a.id)))
    await batch.commit()

    // 2. Save new in chunks of 450 (Firestore limit is 500 per batch)
    const chunks = []
    for (let i = 0; i < allocations.length; i += 450) {
        chunks.push(allocations.slice(i, i + 450))
    }

    for (const chunk of chunks) {
        const b = writeBatch(db)
        chunk.forEach(a => {
            const ref = doc(collection(db, `colleges/${collegeCode}/allocations`))
            b.set(ref, a)
        })
        await b.commit()
    }
}

// ---- INVIGILATORS (STAFF) ----
export async function getInvigilators(collegeCode) {
    if (!db || !collegeCode) return []
    const snap = await getDocs(collection(db, `colleges/${collegeCode}/invigilators`))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addInvigilator(collegeCode, staff) {
    // staff: { email, password, name }
    const docRef = doc(collection(db, `colleges/${collegeCode}/invigilators`))
    await setDoc(docRef, staff)
}

export async function deleteInvigilator(collegeCode, staffId) {
    await deleteDoc(doc(db, `colleges/${collegeCode}/invigilators`, staffId))
}
