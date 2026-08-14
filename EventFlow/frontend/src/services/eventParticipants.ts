import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { EventParticipantRecord } from '../types/models'

export async function listParticipantsForEvent(eventId: string): Promise<EventParticipantRecord[]> {
  const db = ensureDb()
  const q = query(collection(db, 'eventParticipants'), where('eventId', '==', eventId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ eventParticipantId: d.id, ...(d.data() as Omit<EventParticipantRecord, 'eventParticipantId'>) }))
}

export async function addStudentParticipant(eventId: string, studentId: string, addedByUserId: string): Promise<string> {
  const db = ensureDb()

  // Prevent duplicate active relationship
  const existingQ = query(collection(db, 'eventParticipants'), where('eventId', '==', eventId), where('studentId', '==', studentId), where('status', '==', 'active'))
  const existing = await getDocs(existingQ)
  if (!existing.empty) {
    throw new Error('Student is already an active participant for this event.')
  }

  // Ensure student is active
  const studentRef = doc(db, 'students', studentId)
  const studentSnap = await getDoc(studentRef)
  if (!studentSnap.exists() || !(studentSnap.data() as any).active) {
    throw new Error('Student is not active or does not exist.')
  }

  const batch = writeBatch(db)

  const participantRef = doc(collection(db, 'eventParticipants'))
  const now = serverTimestamp()
  const participant: Partial<EventParticipantRecord> = {
    eventId,
    studentId,
    status: 'active',
    addedByUserId: addedByUserId,
    addedAt: now,
    removedByUserId: null,
    removedAt: null,
    notes: null,
  }
  batch.set(participantRef, { ...participant, eventParticipantId: participantRef.id })

  // Recalculate derived event fields: we will count active student participants
  // Query current active participants (including the one we're adding)
  const activeQ = query(collection(db, 'eventParticipants'), where('eventId', '==', eventId), where('status', '==', 'active'))
  const activeSnap = await getDocs(activeQ)
  const activeCount = activeSnap.size + 1 // optimistic add
  // Determine dietary restrictions presence
  const studentIds = activeSnap.docs.map((d) => (d.data() as any).studentId).concat([studentId])
  let hasDiet = false
  for (const sid of studentIds) {
    const s = await getDoc(doc(db, 'students', sid))
    if (s.exists()) {
      const dr = (s.data() as any).dietaryRestrictions
      if (Array.isArray(dr) && dr.length > 0) {
        hasDiet = true
        break
      }
    }
  }

  // Update event doc
  const eventRef = doc(db, 'events', eventId)
  batch.update(eventRef, {
    studentParticipantCount: activeCount,
    participantCount: activeCount, // staffParticipantCount is preserved by backend assumption; frontend will merge later
    hasDietaryRestrictions: hasDiet,
    updatedAt: serverTimestamp(),
  })

  await batch.commit()

  return participantRef.id
}

export async function removeStudentParticipant(eventId: string, studentId: string, removedByUserId: string): Promise<void> {
  const db = ensureDb()

  // Find an active participant record for this event/student
  const activeQ = query(collection(db, 'eventParticipants'), where('eventId', '==', eventId), where('studentId', '==', studentId), where('status', '==', 'active'))
  const activeSnap = await getDocs(activeQ)
  if (activeSnap.empty) {
    throw new Error('Active participant not found.')
  }

  const batch = writeBatch(db)
  // Mark the first active participant as removed
  const participantDoc = activeSnap.docs[0]
  const participantRef = doc(db, 'eventParticipants', participantDoc.id)
  batch.update(participantRef, {
    status: 'removed',
    removedByUserId: removedByUserId,
    removedAt: serverTimestamp(),
  })

  // Recalculate counts from remaining active participants
  const remainingQ = query(collection(db, 'eventParticipants'), where('eventId', '==', eventId), where('status', '==', 'active'))
  const remainingSnap = await getDocs(remainingQ)
  const activeCount = remainingSnap.size - 1 >= 0 ? remainingSnap.size - 1 : 0
  const studentIds = remainingSnap.docs.map((d) => (d.data() as any).studentId)

  let hasDiet = false
  for (const sid of studentIds) {
    const s = await getDoc(doc(db, 'students', sid))
    if (s.exists()) {
      const dr = (s.data() as any).dietaryRestrictions
      if (Array.isArray(dr) && dr.length > 0) {
        hasDiet = true
        break
      }
    }
  }

  const eventRef = doc(db, 'events', eventId)
  batch.update(eventRef, {
    studentParticipantCount: activeCount,
    participantCount: activeCount,
    hasDietaryRestrictions: hasDiet,
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
}
