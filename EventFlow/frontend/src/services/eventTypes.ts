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
import type { EventTypeRecord } from '../types/models'

const seedEventTypes: Omit<EventTypeRecord, 'eventTypeId'>[] = [
  { name: 'Practice', active: true, sortOrder: 1 },
  { name: 'Competition', active: true, sortOrder: 2 },
  { name: 'Appointment', active: true, sortOrder: 3 },
  { name: 'School Sponsored Event', active: true, sortOrder: 4 },
  { name: 'PE Class Outing', active: true, sortOrder: 5 },
  { name: 'Classroom Outing', active: true, sortOrder: 6 },
  { name: 'Other', active: true, sortOrder: 7 },
]

function normalizeId(name: string) {
  return `eventType_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '')}`
}

export async function listActiveEventTypes(): Promise<EventTypeRecord[]> {
  const db = ensureDb()
  const q = query(collection(db, 'eventTypes'), orderBy('sortOrder', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((docSnap) => ({
      eventTypeId: docSnap.id,
      ...(docSnap.data() as Omit<EventTypeRecord, 'eventTypeId'>),
    }))
    .filter((record) => record.active === true)
}

export async function listEventTypes(): Promise<EventTypeRecord[]> {
  const db = ensureDb()
  const q = query(collection(db, 'eventTypes'), orderBy('sortOrder', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({
    eventTypeId: docSnap.id,
    ...(docSnap.data() as Omit<EventTypeRecord, 'eventTypeId'>),
  }))
}

export async function createEventType(name: string, active = true): Promise<EventTypeRecord> {
  const db = ensureDb()
  const eventTypeRef = doc(collection(db, 'eventTypes'))
  const now = serverTimestamp()
  const data = {
    eventTypeId: eventTypeRef.id,
    name,
    active,
    sortOrder: Date.now(),
    createdAt: now,
    updatedAt: now,
  }
  await setDoc(eventTypeRef, data)
  return { ...data, createdAt: now, updatedAt: now } as EventTypeRecord
}

export async function updateEventType(eventTypeId: string, values: Partial<Omit<EventTypeRecord, 'eventTypeId'>>): Promise<void> {
  const db = ensureDb()
  const eventTypeRef = doc(db, 'eventTypes', eventTypeId)
  await updateDoc(eventTypeRef, {
    ...values,
    updatedAt: serverTimestamp(),
  })
}

export async function seedInitialEventTypes(): Promise<void> {
  const db = ensureDb()

  for (const item of seedEventTypes) {
    const eventTypeId = normalizeId(item.name)
    const eventTypeRef = doc(db, 'eventTypes', eventTypeId)
    const existing = await getDoc(eventTypeRef)

    if (existing.exists()) {
      await updateDoc(eventTypeRef, {
        name: item.name,
        active: item.active,
        sortOrder: item.sortOrder,
        updatedAt: serverTimestamp(),
      })
    } else {
      await setDoc(eventTypeRef, {
        eventTypeId,
        name: item.name,
        active: item.active,
        sortOrder: item.sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  }
}
