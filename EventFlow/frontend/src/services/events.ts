import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { EventFormValues, EventRecord } from '../types/models'

const eventStatuses = ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const

function parseEventStatus(value: unknown): EventRecord['status'] {
  if (typeof value === 'string' && eventStatuses.includes(value as EventRecord['status'])) return value as EventRecord['status']
  throw new Error(`Event has an unsupported status: ${String(value)}`)
}

function toEventRecord(id: string, data: any): EventRecord {
  return {
    eventId: id,
    name: data.name,
    activityId: data.activityId,
    eventTypeId: data.eventTypeId,
    status: parseEventStatus(data.status),
    departureDateTime: data.departureDateTime.toDate(),
    returnDateTime: data.returnDateTime.toDate(),
    location: data.location,
    purpose: data.purpose ?? null,
    mealsMissed: data.mealsMissed ?? [],
    equipmentNeeded: data.equipmentNeeded ?? [],
    notes: data.notes ?? null,
    studentParticipantCount: data.studentParticipantCount ?? 0,
    staffParticipantCount: data.staffParticipantCount ?? 0,
    participantCount: data.participantCount ?? 0,
    hasDietaryRestrictions: data.hasDietaryRestrictions ?? false,
    createdByUserId: data.createdByUserId,
    createdByUserName: data.createdByUserName,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    startedAt: data.startedAt ? data.startedAt.toDate() : null,
    completedAt: data.completedAt ? data.completedAt.toDate() : null,
    cancelledAt: data.cancelledAt ? data.cancelledAt.toDate() : null,
    calendarEventId: data.calendarEventId ?? null,
    calendarSyncStatus: data.calendarSyncStatus,
    calendarSyncError: data.calendarSyncError ?? null,
    lastCalendarSyncAt: data.lastCalendarSyncAt ? data.lastCalendarSyncAt.toDate() : null,
  }
}

export async function listEvents(): Promise<EventRecord[]> {
  const db = ensureDb()
  const q = query(collection(db, 'events'), orderBy('departureDateTime', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => toEventRecord(docSnap.id, docSnap.data()))
}

export async function getEventById(eventId: string): Promise<EventRecord | null> {
  const db = ensureDb()
  const eventRef = doc(db, 'events', eventId)
  const eventSnap = await getDoc(eventRef)

  if (!eventSnap.exists()) {
    return null
  }

  return toEventRecord(eventSnap.id, eventSnap.data())
}

export async function createEvent(formValues: EventFormValues, userId: string, userName: string): Promise<string> {
  const db = ensureDb()
  const now = serverTimestamp()
  const eventRef = doc(collection(db, 'events'))
  const payload = {
    eventId: eventRef.id,
    name: formValues.name,
    activityId: formValues.activityId,
    eventTypeId: formValues.eventTypeId,
    status: 'draft',
    departureDateTime: Timestamp.fromDate(new Date(formValues.departureDateTime)),
    returnDateTime: Timestamp.fromDate(new Date(formValues.returnDateTime)),
    location: formValues.location,
    purpose: formValues.purpose || null,
    mealsMissed: formValues.mealsMissed,
    equipmentNeeded: formValues.equipmentNeeded
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
    notes: formValues.notes || null,
    studentParticipantCount: 0,
    staffParticipantCount: 0,
    participantCount: 0,
    hasDietaryRestrictions: false,
    createdByUserId: userId,
    createdByUserName: userName,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    calendarEventId: null,
    calendarSyncStatus: 'not_synced',
    calendarSyncError: null,
    lastCalendarSyncAt: null,
  }

  await setDoc(eventRef, payload)
  return eventRef.id
}

export async function updateEvent(eventId: string, formValues: EventFormValues): Promise<void> {
  const db = ensureDb()
  const eventRef = doc(db, 'events', eventId)
  await updateDoc(eventRef, {
    name: formValues.name,
    activityId: formValues.activityId,
    eventTypeId: formValues.eventTypeId,
    departureDateTime: Timestamp.fromDate(new Date(formValues.departureDateTime)),
    returnDateTime: Timestamp.fromDate(new Date(formValues.returnDateTime)),
    location: formValues.location,
    purpose: formValues.purpose || null,
    mealsMissed: formValues.mealsMissed,
    equipmentNeeded: formValues.equipmentNeeded
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
    notes: formValues.notes || null,
    updatedAt: serverTimestamp(),
  })
}

function getConfirmationReadinessError(data: Record<string, any>): string | null {
  if (typeof data.name !== 'string' || !data.name.trim()) return 'Event name is required before confirmation.'
  if (typeof data.activityId !== 'string' || !data.activityId.trim()) return 'Activity is required before confirmation.'
  if (typeof data.eventTypeId !== 'string' || !data.eventTypeId.trim()) return 'Event type is required before confirmation.'
  if (!data.departureDateTime || typeof data.departureDateTime.toDate !== 'function') return 'Departure date/time is required before confirmation.'
  if (!data.returnDateTime || typeof data.returnDateTime.toDate !== 'function') return 'Return date/time is required before confirmation.'
  if (data.returnDateTime.toDate() <= data.departureDateTime.toDate()) return 'Return must occur after departure before confirmation.'
  if (typeof data.location !== 'string' || !data.location.trim()) return 'Location is required before confirmation.'
  return null
}

export async function confirmEvent(eventId: string, userId: string): Promise<void> {
  if (!userId) throw new Error('An approved signed-in user is required to confirm an event.')
  const db = ensureDb()
  const eventRef = doc(db, 'events', eventId)

  await runTransaction(db, async (transaction) => {
    const eventSnapshot = await transaction.get(eventRef)
    if (!eventSnapshot.exists()) throw new Error('Event does not exist.')

    const data = eventSnapshot.data()
    if (data.status !== 'draft') {
      throw new Error('Only a draft event can be confirmed.')
    }

    const readinessError = getConfirmationReadinessError(data)
    if (readinessError) throw new Error(readinessError)

    transaction.update(eventRef, {
      status: 'confirmed',
      updatedAt: serverTimestamp(),
    })
  })
}

export async function cancelEvent(eventId: string): Promise<void> {
  const db = ensureDb()
  const eventRef = doc(db, 'events', eventId)
  await updateDoc(eventRef, {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function completeEvent(eventId: string): Promise<void> {
  const db = ensureDb()
  const eventRef = doc(db, 'events', eventId)
  await updateDoc(eventRef, {
    status: 'completed',
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
