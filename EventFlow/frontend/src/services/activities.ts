import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  orderBy,
} from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { ActivityRecord } from '../types/models'

const seedActivities: Omit<ActivityRecord, 'activityId'>[] = [
  { name: 'Volleyball', active: true, sortOrder: 1 },
  { name: 'Cross country', active: true, sortOrder: 2 },
  { name: 'Track and field', active: true, sortOrder: 3 },
  { name: 'Table tennis', active: true, sortOrder: 4 },
  { name: 'Badminton', active: true, sortOrder: 5 },
  { name: 'Basketball', active: true, sortOrder: 6 },
  { name: 'Other', active: true, sortOrder: 7 },
]

function normalizeId(name: string) {
  return `activity_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '')}`
}

export async function listActiveActivities(): Promise<ActivityRecord[]> {
  const db = ensureDb()
  const q = query(collection(db, 'activities'), orderBy('sortOrder', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((docSnap) => ({
      activityId: docSnap.id,
      ...(docSnap.data() as Omit<ActivityRecord, 'activityId'>),
    }))
    .filter((record) => record.active === true)
}

export async function listActivities(): Promise<ActivityRecord[]> {
  const db = ensureDb()
  const q = query(collection(db, 'activities'), orderBy('sortOrder', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({
    activityId: docSnap.id,
    ...(docSnap.data() as Omit<ActivityRecord, 'activityId'>),
  }))
}

export async function createActivity(name: string, active = true): Promise<ActivityRecord> {
  const db = ensureDb()
  const activityRef = doc(collection(db, 'activities'))
  const now = serverTimestamp()
  const data = {
    activityId: activityRef.id,
    name,
    active,
    sortOrder: Date.now(),
    createdAt: now,
    updatedAt: now,
  }
  await setDoc(activityRef, data)
  return { ...data, createdAt: now, updatedAt: now } as ActivityRecord
}

export async function updateActivity(activityId: string, values: Partial<Omit<ActivityRecord, 'activityId'>>): Promise<void> {
  const db = ensureDb()
  const activityRef = doc(db, 'activities', activityId)
  await updateDoc(activityRef, {
    ...values,
    updatedAt: serverTimestamp(),
  })
}

export async function seedInitialActivities(): Promise<void> {
  const db = ensureDb()

  for (const item of seedActivities) {
    const activityId = normalizeId(item.name)
    const activityRef = doc(db, 'activities', activityId)
    const existing = await getDoc(activityRef)

    if (existing.exists()) {
      await updateDoc(activityRef, {
        name: item.name,
        active: item.active,
        sortOrder: item.sortOrder,
        updatedAt: serverTimestamp(),
      })
    } else {
      await setDoc(activityRef, {
        activityId,
        name: item.name,
        active: item.active,
        sortOrder: item.sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  }
}
