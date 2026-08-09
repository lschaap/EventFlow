import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { EventFormValues, EventRecord } from '../types/models'

function toEventRecord(id: string, data: any): EventRecord {
  return {
    eventId: id,
    name: data.name,
    activityId: data.activityId,
    eventTypeId: data.eventTypeId,
    status: data.status,
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
  const payload = {
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
    completedAt: null,
    cancelledAt: null,
    calendarEventId: null,
    calendarSyncStatus: 'not_synced',
    calendarSyncError: null,
    lastCalendarSyncAt: null,
  }

  const eventRef = await addDoc(collection(db, 'events'), payload)
  await updateDoc(eventRef, { eventId: eventRef.id })
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
