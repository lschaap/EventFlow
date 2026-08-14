import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { StudentRecord } from '../types/models'

export async function listActiveStudents(): Promise<StudentRecord[]> {
  const db = ensureDb()
  const q = query(collection(db, 'students'), orderBy('displayName', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((d) => ({ studentId: d.id, ...(d.data() as Omit<StudentRecord, 'studentId'>) }))
    .filter((s) => s.active === true)
}

export async function listStudents(): Promise<StudentRecord[]> {
  const db = ensureDb()
  const q = query(collection(db, 'students'), orderBy('displayName', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ studentId: d.id, ...(d.data() as Omit<StudentRecord, 'studentId'>) }))
}

export async function getStudentById(studentId: string): Promise<StudentRecord | null> {
  const db = ensureDb()
  const ref = doc(db, 'students', studentId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { studentId: snap.id, ...(snap.data() as Omit<StudentRecord, 'studentId'>) }
}

function validateStudentInput(values: Partial<Omit<StudentRecord, 'studentId'>>) {
  if (!values.firstName || !values.lastName) throw new Error('First and last name are required.')
  const grade = Number(values.grade)
  if (!Number.isInteger(grade) || grade < 6 || grade > 12) throw new Error('Grade must be an integer between 6 and 12.')
}

export async function createStudent(values: Partial<Omit<StudentRecord, 'studentId'>>): Promise<string> {
  validateStudentInput(values)
  const db = ensureDb()
  const ref = doc(collection(db, 'students'))
  const now = serverTimestamp()
  const data = {
    studentId: ref.id,
    firstName: (values.firstName || '').trim(),
    lastName: (values.lastName || '').trim(),
    displayName: (values.displayName || `${(values.firstName || '').trim()} ${(values.lastName || '').trim()}`).trim(),
    grade: Number(values.grade),
    active: values.active !== false,
    dietaryRestrictions: Array.isArray(values.dietaryRestrictions) ? values.dietaryRestrictions.map((s) => s.trim()).filter(Boolean) : [],
    notes: values.notes || null,
    createdAt: now,
    updatedAt: now,
  }

  await setDoc(ref, data)
  return ref.id
}

export async function updateStudent(studentId: string, values: Partial<Omit<StudentRecord, 'studentId'>>): Promise<void> {
  const db = ensureDb()
  const ref = doc(db, 'students', studentId)
  validateStudentInput({ ...values, grade: values.grade ?? 6, firstName: values.firstName ?? 'x', lastName: values.lastName ?? 'x' })
  await updateDoc(ref, {
    ...(values.firstName ? { firstName: (values.firstName || '').trim() } : {}),
    ...(values.lastName ? { lastName: (values.lastName || '').trim() } : {}),
    ...(values.displayName ? { displayName: (values.displayName || '').trim() } : {}),
    ...(values.grade !== undefined ? { grade: Number(values.grade) } : {}),
    ...(values.active !== undefined ? { active: !!values.active } : {}),
    ...(values.dietaryRestrictions !== undefined ? { dietaryRestrictions: Array.isArray(values.dietaryRestrictions) ? values.dietaryRestrictions.map((s) => s.trim()).filter(Boolean) : [] } : {}),
    ...(values.notes !== undefined ? { notes: values.notes } : {}),
    updatedAt: serverTimestamp(),
  })
}
