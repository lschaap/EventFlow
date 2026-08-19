import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { EventStaffParticipantRecord } from '../types/models'
import { assertNoParticipationOverlap } from './participationConflicts'
import { removedStaffDriverFields } from './transportationPlanning'

export function getDeterministicStaffParticipantId(eventId: string, staffId: string): string {
  return `${eventId}__${staffId}`
}

export async function listStaffParticipantsForEvent(eventId: string): Promise<EventStaffParticipantRecord[]> {
  const snapshot = await getDocs(query(collection(ensureDb(), 'eventStaffParticipants'), where('eventId', '==', eventId)))
  return snapshot.docs.map((item) => ({ eventStaffParticipantId: item.id, ...(item.data() as Omit<EventStaffParticipantRecord, 'eventStaffParticipantId'>), departureVehicleId: item.data().departureVehicleId ?? null, returnVehicleId: item.data().returnVehicleId ?? null }))
}

export async function listAllActiveStaffParticipants(): Promise<EventStaffParticipantRecord[]> {
  const snapshot = await getDocs(query(collection(ensureDb(), 'eventStaffParticipants'), where('status', '==', 'active')))
  return snapshot.docs.map((item) => ({ eventStaffParticipantId: item.id, ...(item.data() as Omit<EventStaffParticipantRecord, 'eventStaffParticipantId'>), departureVehicleId: item.data().departureVehicleId ?? null, returnVehicleId: item.data().returnVehicleId ?? null }))
}

async function evaluateDietaryFlag(eventId: string, staffIds: string[]): Promise<boolean> {
  const db = ensureDb()
  const students = await getDocs(query(collection(db, 'eventParticipants'), where('eventId', '==', eventId)))
  for (const participant of students.docs.filter((item) => item.data().status === 'active')) {
    const studentSnapshot = await getDoc(doc(db, 'students', String(participant.data().studentId)))
    if (Array.isArray(studentSnapshot.data()?.dietaryRestrictions) && studentSnapshot.data()!.dietaryRestrictions.some((item: unknown) => String(item).trim())) return true
  }
  for (const staffId of staffIds) {
    const staffSnapshot = await getDoc(doc(db, 'staff', staffId))
    if (Array.isArray(staffSnapshot.data()?.dietaryRestrictions) && staffSnapshot.data()!.dietaryRestrictions.some((item: unknown) => String(item).trim())) return true
  }
  return false
}

export async function addStaffParticipant(eventId: string, staffId: string, userId: string): Promise<string> {
  if (!userId) throw new Error('You must be signed in to add staff.')
  await assertNoParticipationOverlap(eventId, staffId, 'eventStaffParticipants', 'staffId')
  const db = ensureDb()
  const participantId = getDeterministicStaffParticipantId(eventId, staffId)
  const participantRef = doc(db, 'eventStaffParticipants', participantId)
  const eventRef = doc(db, 'events', eventId)
  const staffRef = doc(db, 'staff', staffId)
  const activeStaffSnapshot = await getDocs(query(collection(db, 'eventStaffParticipants'), where('eventId', '==', eventId)))
  const activeStaffIds = activeStaffSnapshot.docs.filter((item) => item.data().status === 'active').map((item) => String(item.data().staffId)).filter(Boolean)
  const nextHasDietaryRestrictions = await evaluateDietaryFlag(eventId, [...new Set([...activeStaffIds, staffId])])

  return runTransaction(db, async (transaction) => {
    const [eventSnapshot, staffSnapshot, participantSnapshot] = await Promise.all([
      transaction.get(eventRef), transaction.get(staffRef), transaction.get(participantRef),
    ])
    if (!eventSnapshot.exists()) throw new Error('Event does not exist.')
    if (!staffSnapshot.exists()) throw new Error('Staff member does not exist.')
    if (staffSnapshot.data().active !== true) throw new Error('Inactive staff cannot be added to an event.')
    if (participantSnapshot.exists() && participantSnapshot.data().status === 'active') throw new Error('Staff member is already an active participant for this event.')

    const eventData = eventSnapshot.data()
    const studentCount = Math.max(0, Number(eventData.studentParticipantCount ?? 0))
    const staffCount = Math.max(0, Number(eventData.staffParticipantCount ?? 0)) + 1
    const payload = {
      eventStaffParticipantId: participantId, eventId, staffId, status: 'active',
      addedByUserId: userId, addedAt: serverTimestamp(), removedByUserId: null, removedAt: null,
      notes: participantSnapshot.exists() ? participantSnapshot.data().notes ?? null : null,
      departureVehicleId: null, returnVehicleId: null,
    }
    participantSnapshot.exists() ? transaction.update(participantRef, payload) : transaction.set(participantRef, payload)
    transaction.update(eventRef, { staffParticipantCount: staffCount, studentParticipantCount: studentCount, participantCount: studentCount + staffCount, hasDietaryRestrictions: nextHasDietaryRestrictions, updatedAt: serverTimestamp() })
    return participantId
  })
}

export async function removeStaffParticipant(eventId: string, staffId: string, userId: string): Promise<void> {
  if (!userId) throw new Error('You must be signed in to remove staff.')
  const db = ensureDb()
  const participantId = getDeterministicStaffParticipantId(eventId, staffId)
  const participantRef = doc(db, 'eventStaffParticipants', participantId)
  const eventRef = doc(db, 'events', eventId)
  const [activeStaffSnapshot, tripSnapshot] = await Promise.all([
    getDocs(query(collection(db, 'eventStaffParticipants'), where('eventId', '==', eventId))),
    getDocs(query(collection(db, 'eventVehicleTrips'), where('eventId', '==', eventId), where('assignmentStatus', '==', 'active'))),
  ])
  const drivenTrips = tripSnapshot.docs.filter((item) => item.data().departureDriverStaffId === staffId || item.data().returnDriverStaffId === staffId)
  const remainingStaffIds = activeStaffSnapshot.docs.filter((item) => item.data().status === 'active').map((item) => String(item.data().staffId)).filter((id) => id && id !== staffId)
  const nextHasDietaryRestrictions = await evaluateDietaryFlag(eventId, remainingStaffIds)
  await runTransaction(db, async (transaction) => {
    const [eventSnapshot, participantSnapshot, currentTrips] = await Promise.all([
      transaction.get(eventRef), transaction.get(participantRef),
      Promise.all(drivenTrips.map((item) => transaction.get(item.ref))),
    ])
    if (!eventSnapshot.exists()) throw new Error('Event does not exist.')
    if (!participantSnapshot.exists() || participantSnapshot.data().status !== 'active') throw new Error('Staff member is not active for this event.')
    const eventData = eventSnapshot.data()
    const studentCount = Math.max(0, Number(eventData.studentParticipantCount ?? 0))
    const staffCount = Math.max(0, Number(eventData.staffParticipantCount ?? 0) - 1)
    transaction.update(participantRef, { status: 'removed', removedByUserId: userId, removedAt: serverTimestamp(), departureVehicleId: null, returnVehicleId: null })
    currentTrips.forEach((trip, index) => {
      if (!trip.exists() || trip.data().assignmentStatus !== 'active') throw new Error('The transportation plan changed. Reload and try again.')
      const changes: Record<string, unknown> = { ...removedStaffDriverFields({
        departureDriverStaffId: trip.data().departureDriverStaffId ?? null,
        returnDriverStaffId: trip.data().returnDriverStaffId ?? null,
      }, staffId), updatedAt: serverTimestamp() }
      transaction.update(drivenTrips[index].ref, changes)
    })
    transaction.update(eventRef, { staffParticipantCount: staffCount, studentParticipantCount: studentCount, participantCount: studentCount + staffCount, hasDietaryRestrictions: nextHasDietaryRestrictions, updatedAt: serverTimestamp() })
  })
}
