import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { EventParticipantRecord } from '../types/models'
import { assertNoParticipationOverlap } from './participationConflicts'

export function getDeterministicParticipantId(eventId: string, studentId: string): string {
  return `${eventId}__${studentId}`
}

export async function listParticipantsForEvent(eventId: string): Promise<EventParticipantRecord[]> {
  const db = ensureDb()
  const q = query(collection(db, 'eventParticipants'), where('eventId', '==', eventId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ eventParticipantId: d.id, ...(d.data() as Omit<EventParticipantRecord, 'eventParticipantId'>), departureVehicleId: d.data().departureVehicleId ?? null, returnVehicleId: d.data().returnVehicleId ?? null }))
}

async function evaluateDietaryFlag(eventId: string, studentIds: string[]): Promise<boolean> {
  const db = ensureDb()
  for (const studentId of studentIds) {
    const studentSnap = await getDoc(doc(db, 'students', studentId))
    const dietaryRestrictions = (studentSnap.data() as any)?.dietaryRestrictions
    if (studentSnap.exists() && Array.isArray(dietaryRestrictions) && dietaryRestrictions.some((item) => String(item).trim())) {
      return true
    }
  }
  const staffParticipants = await getDocs(query(collection(db, 'eventStaffParticipants'), where('eventId', '==', eventId)))
  for (const participant of staffParticipants.docs.filter((item) => item.data().status === 'active')) {
    const staffId = String(participant.data().staffId ?? '')
    if (!staffId) continue
    const staffSnapshot = await getDoc(doc(db, 'staff', staffId))
    const dietaryRestrictions = staffSnapshot.data()?.dietaryRestrictions
    if (staffSnapshot.exists() && Array.isArray(dietaryRestrictions) && dietaryRestrictions.some((item) => String(item).trim())) return true
  }
  return false
}

export async function addStudentParticipant(eventId: string, studentId: string, addedByUserId: string): Promise<string> {
  await assertNoParticipationOverlap(eventId, studentId, 'eventParticipants', 'studentId')
  const db = ensureDb()
  const participantId = getDeterministicParticipantId(eventId, studentId)
  const participantRef = doc(db, 'eventParticipants', participantId)
  const eventRef = doc(db, 'events', eventId)
  const studentRef = doc(db, 'students', studentId)
  const activeParticipantsQ = query(collection(db, 'eventParticipants'), where('eventId', '==', eventId), where('status', '==', 'active'))
  const activeSnapshot = await getDocs(activeParticipantsQ)
  const activeStudentIds = activeSnapshot.docs
    .map((docSnap) => String((docSnap.data() as any).studentId))
    .filter(Boolean)

  const eventSnapshot = await getDoc(eventRef)
  if (!eventSnapshot.exists()) {
    throw new Error('Event does not exist.')
  }

  const studentSnapshot = await getDoc(studentRef)
  if (!studentSnapshot.exists()) {
    throw new Error('Student does not exist.')
  }
  if (studentSnapshot.data()?.active !== true) {
    throw new Error('Student is inactive and cannot be added.')
  }

  const participantSnapshot = await getDoc(participantRef)
  if (participantSnapshot.exists() && (participantSnapshot.data() as any)?.status === 'active') {
    throw new Error('Student is already an active participant for this event.')
  }

  return runTransaction(db, async (transaction) => {
    const currentEventSnap = await transaction.get(eventRef)
    if (!currentEventSnap.exists()) {
      throw new Error('Event does not exist.')
    }

    const currentStudentSnap = await transaction.get(studentRef)
    if (!currentStudentSnap.exists()) {
      throw new Error('Student does not exist.')
    }
    if (currentStudentSnap.data()?.active !== true) {
      throw new Error('Student is inactive and cannot be added.')
    }

    const currentParticipantSnap = await transaction.get(participantRef)
    if (currentParticipantSnap.exists() && (currentParticipantSnap.data() as any)?.status === 'active') {
      throw new Error('Student is already an active participant for this event.')
    }

    const nextStudentCount = activeSnapshot.size + 1
    const nextHasDiet = await evaluateDietaryFlag(eventId, [...new Set([...activeStudentIds, studentId])])
    const updatePayload = {
      eventParticipantId: participantId,
      eventId,
      studentId,
      status: 'active',
      addedByUserId: addedByUserId,
      addedAt: serverTimestamp(),
      removedByUserId: null,
      removedAt: null,
      notes: currentParticipantSnap.exists() ? (currentParticipantSnap.data() as any)?.notes ?? null : null,
      departureVehicleId: null,
      returnVehicleId: null,
    }

    if (currentParticipantSnap.exists()) {
      transaction.update(participantRef, updatePayload)
    } else {
      transaction.set(participantRef, updatePayload)
    }

    transaction.update(eventRef, {
      studentParticipantCount: Math.max(0, nextStudentCount),
      participantCount: Math.max(0, nextStudentCount) + Number(currentEventSnap.data()?.staffParticipantCount ?? 0),
      hasDietaryRestrictions: nextHasDiet,
      updatedAt: serverTimestamp(),
    })

    return participantId
  })
}

export async function removeStudentParticipant(eventId: string, studentId: string, removedByUserId: string): Promise<void> {
  const db = ensureDb()
  const participantId = getDeterministicParticipantId(eventId, studentId)
  const participantRef = doc(db, 'eventParticipants', participantId)
  const eventRef = doc(db, 'events', eventId)
  const activeParticipantsQ = query(collection(db, 'eventParticipants'), where('eventId', '==', eventId), where('status', '==', 'active'))
  const activeSnapshot = await getDocs(activeParticipantsQ)
  const remainingStudentIds = activeSnapshot.docs
    .map((docSnap) => String((docSnap.data() as any).studentId))
    .filter((id) => id !== studentId)

  const participantSnapshot = await getDoc(participantRef)
  if (!participantSnapshot.exists() || (participantSnapshot.data() as any)?.status !== 'active') {
    throw new Error('Student is not active for this event.')
  }

  await runTransaction(db, async (transaction) => {
    const currentEventSnap = await transaction.get(eventRef)
    if (!currentEventSnap.exists()) {
      throw new Error('Event does not exist.')
    }

    const currentParticipantSnap = await transaction.get(participantRef)
    if (!currentParticipantSnap.exists() || (currentParticipantSnap.data() as any)?.status !== 'active') {
      throw new Error('Student is not active for this event.')
    }

    const nextStudentCount = Math.max(0, activeSnapshot.size - 1)
    const nextHasDiet = await evaluateDietaryFlag(eventId, remainingStudentIds)

    transaction.update(participantRef, {
      eventParticipantId: participantId,
      eventId,
      studentId,
      status: 'removed',
      removedByUserId,
      removedAt: serverTimestamp(),
      notes: (currentParticipantSnap.data() as any)?.notes ?? null,
    })

    transaction.update(eventRef, {
      studentParticipantCount: nextStudentCount,
      participantCount: nextStudentCount + Number(currentEventSnap.data()?.staffParticipantCount ?? 0),
      hasDietaryRestrictions: nextHasDiet,
      updatedAt: serverTimestamp(),
    })
  })
}
