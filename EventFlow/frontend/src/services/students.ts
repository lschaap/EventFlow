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

export function normalizeDietaryRestrictions(value: unknown): string[] {
  const items = Array.isArray(value) ? value : []
  return Array.from(
    new Set(
      items
        .map((item) => String(item).trim())
        .filter(Boolean)
    )
  )
}

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
  const firstName = String(values.firstName).trim()
  const lastName = String(values.lastName).trim()
  const displayName = String(values.displayName ?? `${firstName} ${lastName}`).trim()
  if (!displayName) throw new Error('Display name is required.')
  const grade = Number(values.grade)
  if (!Number.isInteger(grade) || grade < 6 || grade > 12) throw new Error('Grade must be an integer between 6 and 12.')
}

export async function createStudent(values: Partial<Omit<StudentRecord, 'studentId'>>): Promise<string> {
  validateStudentInput(values)
  const db = ensureDb()
  const ref = doc(collection(db, 'students'))
  const now = serverTimestamp()
  const firstName = String(values.firstName || '').trim()
  const lastName = String(values.lastName || '').trim()
  const displayName = String(values.displayName || `${firstName} ${lastName}`).trim()
  const normalizedNotes = typeof values.notes === 'string' ? values.notes.trim() || null : values.notes ?? null
  const data = {
    studentId: ref.id,
    firstName,
    lastName,
    displayName,
    grade: Number(values.grade),
    active: values.active !== false,
    dietaryRestrictions: normalizeDietaryRestrictions(values.dietaryRestrictions),
    notes: normalizedNotes,
    createdAt: now,
    updatedAt: now,
  }

  await setDoc(ref, data)
  return ref.id
}

export async function updateStudent(studentId: string, values: Partial<Omit<StudentRecord, 'studentId'>>): Promise<void> {
  const db = ensureDb()
  const ref = doc(db, 'students', studentId)
  const current = await getDoc(ref)
  if (!current.exists()) throw new Error('Student not found.')
  const currentData = current.data() as Partial<StudentRecord>
  validateStudentInput({
    firstName: values.firstName ?? currentData.firstName ?? 'x',
    lastName: values.lastName ?? currentData.lastName ?? 'x',
    displayName: values.displayName ?? currentData.displayName ?? `${currentData.firstName ?? 'x'} ${currentData.lastName ?? 'x'}`,
    grade: values.grade ?? currentData.grade ?? 6,
  })

  const updates: Record<string, unknown> = {
    ...(values.firstName !== undefined ? { firstName: String(values.firstName).trim() } : {}),
    ...(values.lastName !== undefined ? { lastName: String(values.lastName).trim() } : {}),
    ...(values.displayName !== undefined ? { displayName: String(values.displayName).trim() } : {}),
    ...(values.grade !== undefined ? { grade: Number(values.grade) } : {}),
    ...(values.active !== undefined ? { active: !!values.active } : {}),
    ...(values.dietaryRestrictions !== undefined ? { dietaryRestrictions: normalizeDietaryRestrictions(values.dietaryRestrictions) } : {}),
    ...(values.notes !== undefined ? { notes: typeof values.notes === 'string' ? values.notes.trim() || null : values.notes ?? null } : {}),
    updatedAt: serverTimestamp(),
  }

  await updateDoc(ref, updates)
}
