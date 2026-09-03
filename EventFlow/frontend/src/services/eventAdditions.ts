import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import { assertNoParticipationOverlap } from './participationConflicts'
import { assertVehicleAvailable, getEventVehicleTripId } from './eventVehicleTrips'

export const MAX_COMBINED_ADDITIONS = 20
export type EventAdditionSelection = { studentIds: string[]; staffIds: string[]; vehicleIds: string[] }

export async function addSelectedEntitiesToEvent(eventId: string, selected: EventAdditionSelection, userId: string) {
  if (!userId) throw new Error('You must be signed in to add items.')
  const studentIds = [...new Set(selected.studentIds)], staffIds = [...new Set(selected.staffIds)], vehicleIds = [...new Set(selected.vehicleIds)]
  const total = studentIds.length + staffIds.length + vehicleIds.length
  if (!total) throw new Error('Select at least one item.')
  if (total > MAX_COMBINED_ADDITIONS) throw new Error(`Select no more than ${MAX_COMBINED_ADDITIONS} total items.`)
  await Promise.all([...studentIds.map((id) => assertNoParticipationOverlap(eventId, id, 'eventParticipants', 'studentId')), ...staffIds.map((id) => assertNoParticipationOverlap(eventId, id, 'eventStaffParticipants', 'staffId')), ...vehicleIds.map((id) => assertVehicleAvailable(eventId, id))])
  const db = ensureDb(), eventRef = doc(db, 'events', eventId)
  const masters = [...studentIds.map((id) => doc(db, 'students', id)), ...staffIds.map((id) => doc(db, 'staff', id)), ...vehicleIds.map((id) => doc(db, 'vehicles', id))]
  const relationships = [...studentIds.map((id) => doc(db, 'eventParticipants', `${eventId}__${id}`)), ...staffIds.map((id) => doc(db, 'eventStaffParticipants', `${eventId}__${id}`)), ...vehicleIds.map((id) => doc(db, 'eventVehicleTrips', getEventVehicleTripId(eventId, id)))]
  await runTransaction(db, async (tx) => {
    const event = await tx.get(eventRef), masterDocs = await Promise.all(masters.map((ref) => tx.get(ref))), existing = await Promise.all(relationships.map((ref) => tx.get(ref)))
    if (!event.exists() || !['draft', 'confirmed'].includes(String(event.data().status))) throw new Error('Items can only be added before an event starts.')
    masterDocs.forEach((item) => { if (!item.exists() || item.data().active !== true) throw new Error('A selected item is inactive or unavailable.') })
    existing.forEach((item, index) => { if (item.exists() && (index < studentIds.length + staffIds.length ? item.data().status === 'active' : item.data().assignmentStatus === 'active')) throw new Error('A selected item is already added.') })
    studentIds.forEach((id, index) => { const old = existing[index], payload = { eventParticipantId: `${eventId}__${id}`, eventId, studentId: id, status: 'active', addedByUserId: userId, addedAt: serverTimestamp(), removedByUserId: null, removedAt: null, notes: old.exists() ? old.data().notes ?? null : null, departureVehicleId: null, returnVehicleId: null }; old.exists() ? tx.update(relationships[index], payload) : tx.set(relationships[index], payload) })
    staffIds.forEach((id, offset) => { const index = studentIds.length + offset, old = existing[index], payload = { eventStaffParticipantId: `${eventId}__${id}`, eventId, staffId: id, status: 'active', addedByUserId: userId, addedAt: serverTimestamp(), removedByUserId: null, removedAt: null, notes: old.exists() ? old.data().notes ?? null : null, departureVehicleId: null, returnVehicleId: null }; old.exists() ? tx.update(relationships[index], payload) : tx.set(relationships[index], payload) })
    vehicleIds.forEach((vehicleId, offset) => { const index = studentIds.length + staffIds.length + offset, old = existing[index], payload = { eventVehicleTripId: getEventVehicleTripId(eventId, vehicleId), eventId, vehicleId, assignmentStatus: 'active', stage: 'planned', departureDriverStaffId: null, returnDriverStaffId: null, returnDriverMirrorsDeparture: true, departedAt: null, departedByUserId: null, departureSnapshot: null, arrivedAtEventAt: null, arrivedAtEventByUserId: null, returnStartedAt: null, returnStartedByUserId: null, originalReturnSnapshot: null, returnedAt: null, updatedAt: serverTimestamp(), correctedAt: null, correctedByUserId: null, correctionReason: null }; old.exists() ? tx.update(relationships[index], { ...payload, createdAt: old.data().createdAt }) : tx.set(relationships[index], { ...payload, createdAt: serverTimestamp() }) })
    const studentCount = Number(event.data().studentParticipantCount ?? 0) + studentIds.length, staffCount = Number(event.data().staffParticipantCount ?? 0) + staffIds.length
    const selectedHasDiet = masterDocs.slice(0, studentIds.length + staffIds.length).some((item) => Array.isArray(item.data()?.dietaryRestrictions) && item.data()!.dietaryRestrictions.some((value: unknown) => String(value).trim()))
    tx.update(eventRef, { studentParticipantCount: studentCount, staffParticipantCount: staffCount, participantCount: studentCount + staffCount, hasDietaryRestrictions: event.data().hasDietaryRestrictions === true || selectedHasDiet, updatedAt: serverTimestamp() })
  })
}
