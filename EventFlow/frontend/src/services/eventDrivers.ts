import { collection, deleteField, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { EventDriverRecord } from '../types/models'
import { assertNoParticipationOverlap } from './participationConflicts'

export const getDeterministicDriverId = (eventId: string, staffId: string) => `${eventId}__${staffId}`

export async function listEventDrivers(eventId?: string): Promise<EventDriverRecord[]> {
  const db = ensureDb(); const source = eventId ? query(collection(db, 'eventDrivers'), where('eventId', '==', eventId)) : collection(db, 'eventDrivers')
  const snapshot = await getDocs(source)
  return snapshot.docs.map((item) => ({ eventDriverId: item.id, ...(item.data() as Omit<EventDriverRecord, 'eventDriverId'>) }))
}

async function assertVehicleAvailable(eventId: string, vehicleId: string | null, excludedStaffId: string) {
  if (!vehicleId) return
  const db = ensureDb(); const drivers = await listEventDrivers()
  if (drivers.some((item) => item.eventId === eventId && item.status === 'assigned' && item.staffId !== excludedStaffId && item.vehicleId === vehicleId)) throw new Error('That vehicle is already assigned to another driver for this event.')
  const target = await getDoc(doc(db, 'events', eventId)); if (!target.exists()) throw new Error('Event does not exist.')
  const start = target.data().departureDateTime.toDate(); const end = target.data().returnDateTime.toDate()
  for (const assignment of drivers.filter((item) => item.status === 'assigned' && item.vehicleId === vehicleId && item.eventId !== eventId)) {
    const other = await getDoc(doc(db, 'events', assignment.eventId)); if (!other.exists()) continue
    if (start < other.data().returnDateTime.toDate() && end > other.data().departureDateTime.toDate()) throw new Error('That vehicle is assigned to another event during this time.')
  }
}

export async function assignDriver(eventId: string, staffId: string, vehicleId: string | null, userId: string): Promise<string> {
  if (!userId) throw new Error('You must be signed in to assign a driver.')
  await assertNoParticipationOverlap(eventId, staffId, 'eventStaffParticipants', 'staffId')
  await assertVehicleAvailable(eventId, vehicleId, staffId)
  const db = ensureDb(); const id = getDeterministicDriverId(eventId, staffId)
  const ref = doc(db, 'eventDrivers', id); const eventRef = doc(db, 'events', eventId); const staffRef = doc(db, 'staff', staffId); const participantRef = doc(db, 'eventStaffParticipants', `${eventId}__${staffId}`); const vehicleRef = vehicleId ? doc(db, 'vehicles', vehicleId) : null
  return runTransaction(db, async (tx) => {
    const eventSnap = await tx.get(eventRef); const staffSnap = await tx.get(staffRef); const current = await tx.get(ref); const participant = await tx.get(participantRef); const vehicleSnap = vehicleRef ? await tx.get(vehicleRef) : null
    if (!eventSnap.exists()) throw new Error('Event does not exist.')
    if (!staffSnap.exists() || staffSnap.data().active !== true || staffSnap.data().canDrive !== true) throw new Error('Staff member is not eligible to drive.')
    if (vehicleSnap && (!vehicleSnap.exists() || vehicleSnap.data().active !== true)) throw new Error('Vehicle is inactive or unavailable.')
    if (current.exists() && current.data().status === 'assigned') throw new Error('Staff member is already assigned as a driver.')
    if (!participant.exists() || participant.data().status !== 'active') {
      const eventData = eventSnap.data()
      const staffCount = Math.max(0, Number(eventData.staffParticipantCount ?? 0)) + 1
      const studentCount = Math.max(0, Number(eventData.studentParticipantCount ?? 0))
      const restrictions = staffSnap.data().dietaryRestrictions
      const hasDietaryRestrictions = eventData.hasDietaryRestrictions === true || (Array.isArray(restrictions) && restrictions.some((item: unknown) => String(item).trim()))
      const participantPayload = { eventStaffParticipantId: `${eventId}__${staffId}`, eventId, staffId, status: 'active', addedByUserId: userId, addedAt: serverTimestamp(), removedByUserId: null, removedAt: null, notes: participant.exists() ? participant.data().notes ?? null : null }
      participant.exists() ? tx.update(participantRef, participantPayload) : tx.set(participantRef, participantPayload)
      tx.update(eventRef, { staffParticipantCount: staffCount, studentParticipantCount: studentCount, participantCount: studentCount + staffCount, hasDietaryRestrictions, updatedAt: serverTimestamp() })
    }
    const payload = { eventDriverId: id, eventId, staffId, vehicleId, status: 'assigned', assignedByUserId: userId, assignedAt: serverTimestamp(), removedByUserId: null, removedAt: null, notes: current.exists() ? current.data().notes ?? null : null, ...(current.exists() ? { role: deleteField() } : {}) }
    current.exists() ? tx.update(ref, payload) : tx.set(ref, payload); return id
  })
}

export async function updateDriver(eventId: string, staffId: string, vehicleId: string | null): Promise<void> {
  await assertVehicleAvailable(eventId, vehicleId, staffId)
  const db = ensureDb(); const ref = doc(db, 'eventDrivers', getDeterministicDriverId(eventId, staffId)); const vehicleRef = vehicleId ? doc(db, 'vehicles', vehicleId) : null
  await runTransaction(db, async (tx) => {
    const current = await tx.get(ref); const vehicleSnap = vehicleRef ? await tx.get(vehicleRef) : null
    if (!current.exists() || current.data().status !== 'assigned') throw new Error('Driver is not actively assigned.')
    if (vehicleSnap && (!vehicleSnap.exists() || vehicleSnap.data().active !== true)) throw new Error('Vehicle is inactive or unavailable.')
    tx.update(ref, { vehicleId, role: deleteField() })
  })
}

export async function removeDriver(eventId: string, staffId: string, userId: string): Promise<void> {
  const db = ensureDb(); const ref = doc(db, 'eventDrivers', getDeterministicDriverId(eventId, staffId))
  await runTransaction(db, async (tx) => { const current = await tx.get(ref); if (!current.exists() || current.data().status !== 'assigned') throw new Error('Driver is not actively assigned.'); tx.update(ref, { status: 'removed', removedByUserId: userId, removedAt: serverTimestamp() }) })
}
