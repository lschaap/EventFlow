import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { StaffRecord } from '../types/models'

export type StaffInput = Pick<StaffRecord, 'firstName' | 'lastName' | 'email' | 'roleTitle' | 'dietaryRestrictions' | 'active' | 'canDrive'>

function normalizeStaff(values: StaffInput): StaffInput & { displayName: string } {
  const firstName = values.firstName.trim()
  const lastName = values.lastName.trim()
  const email = values.email.trim().toLowerCase()
  const roleTitle = values.roleTitle.trim()
  if (!firstName || !lastName || !email || !roleTitle) throw new Error('First name, last name, email, and role title are required.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
  const dietaryRestrictions = Array.from(new Set(values.dietaryRestrictions.map((item) => item.trim()).filter(Boolean)))
  return { firstName, lastName, displayName: `${firstName} ${lastName}`, email, roleTitle, dietaryRestrictions, active: values.active, canDrive: values.canDrive }
}

function fromSnapshot(id: string, data: Omit<StaffRecord, 'staffId'>): StaffRecord {
  return { staffId: id, ...data }
}

export async function listStaff(): Promise<StaffRecord[]> {
  const snapshot = await getDocs(query(collection(ensureDb(), 'staff'), orderBy('displayName', 'asc')))
  return snapshot.docs.map((item) => fromSnapshot(item.id, item.data() as Omit<StaffRecord, 'staffId'>))
}

export async function createStaff(values: StaffInput): Promise<string> {
  const db = ensureDb()
  const ref = doc(collection(db, 'staff'))
  const now = serverTimestamp()
  await setDoc(ref, { staffId: ref.id, ...normalizeStaff(values), createdAt: now, updatedAt: now })
  return ref.id
}

export async function updateStaff(staffId: string, values: StaffInput): Promise<void> {
  const ref = doc(ensureDb(), 'staff', staffId)
  if (!(await getDoc(ref)).exists()) throw new Error('Staff member not found.')
  await updateDoc(ref, { ...normalizeStaff(values), updatedAt: serverTimestamp() })
}
