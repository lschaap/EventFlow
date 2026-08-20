import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { EventVehicleTripRecord } from '../types/models'
import { listActiveEventVehicleTrips } from './eventVehicleTrips'
import { assertNoParticipationOverlap } from './participationConflicts'
import { affectedDriverRolesForMove, clearedDriverFieldsForMove, mirroredReturnVehicle, type AffectedDriverRole, type TransportationLeg, type TransportationParticipantKey } from './transportationPlanning'

export const MAX_BULK_TRANSPORTATION_SELECTION = 100
const MAX_RULE_ACCESS_DOCUMENTS = 19

export async function findAffectedDriverRoles(eventId: string, participants: TransportationParticipantKey[], destinationVehicleId: string | null, leg: TransportationLeg): Promise<AffectedDriverRole[]> {
  const staffIds = new Set(participants.filter((item) => item.kind === 'staff').map((item) => item.personId))
  if (!staffIds.size) return []
  const trips = await listActiveEventVehicleTrips(eventId)
  return [...staffIds].flatMap((staffId) => affectedDriverRolesForMove(trips, staffId, leg, destinationVehicleId))
}

function relationshipRef(eventId: string, key: TransportationParticipantKey) {
  const collection = key.kind === 'student' ? 'eventParticipants' : 'eventStaffParticipants'
  return doc(ensureDb(), collection, `${eventId}__${key.personId}`)
}

export async function moveParticipantsToVehicle(
  eventId: string,
  participants: TransportationParticipantKey[],
  destinationVehicleId: string | null,
  leg: TransportationLeg,
  confirmedDriverRoles: AffectedDriverRole[] = [],
) {
  const unique = [...new Map(participants.map((item) => [`${item.kind}:${item.personId}`, item])).values()]
  if (unique.length === 0) throw new Error('Select at least one participant.')
  if (unique.length > MAX_BULK_TRANSPORTATION_SELECTION) throw new Error(`Select no more than ${MAX_BULK_TRANSPORTATION_SELECTION} participants at once.`)

  await Promise.all(unique.map((item) => assertNoParticipationOverlap(
    eventId,
    item.personId,
    item.kind === 'student' ? 'eventParticipants' : 'eventStaffParticipants',
    item.kind === 'student' ? 'studentId' : 'staffId',
  )))

  const trips = await listActiveEventVehicleTrips(eventId)
  const destination = destinationVehicleId ? trips.find((trip) => trip.vehicleId === destinationVehicleId) : null
  if (destinationVehicleId && (!destination || destination.stage !== 'planned')) throw new Error('The destination vehicle is not actively planned for this event.')

  const affectedRoles = unique.flatMap((item) => item.kind === 'staff' ? affectedDriverRolesForMove(trips, item.personId, leg, destinationVehicleId) : [])
  const confirmedKeys = new Set(confirmedDriverRoles.map((item) => `${item.tripId}:${item.staffId}:${item.leg}`))
  if (affectedRoles.some((item) => !confirmedKeys.has(`${item.tripId}:${item.staffId}:${item.leg}`))) throw new Error('Moving this occupant requires confirmation because a driver role will be removed. Reload and try again.')

  const independentReturnVehicles = new Map(
    trips
      .filter((trip) => !trip.returnDriverMirrorsDeparture && trip.returnDriverStaffId)
      .map((trip) => [trip.returnDriverStaffId!, trip.vehicleId]),
  )
  const db = ensureDb()
  const participantRefs = unique.map((item) => relationshipRef(eventId, item))
  const tripRefs = trips.map((trip) => doc(db, 'eventVehicleTrips', trip.eventVehicleTripId))
  const destinationTripRef = destination ? doc(db, 'eventVehicleTrips', destination.eventVehicleTripId) : null
  const vehicleRef = destinationVehicleId ? doc(db, 'vehicles', destinationVehicleId) : null

  await runTransaction(db, async (transaction) => {
    const [participantSnapshots, tripSnapshots, destinationTripSnapshot, vehicleSnapshot] = await Promise.all([
      Promise.all(participantRefs.map((ref) => transaction.get(ref))),
      Promise.all(tripRefs.map((ref) => transaction.get(ref))),
      destinationTripRef ? transaction.get(destinationTripRef) : Promise.resolve(null),
      vehicleRef ? transaction.get(vehicleRef) : Promise.resolve(null),
    ])
    if (destinationVehicleId && (!vehicleSnapshot?.exists() || vehicleSnapshot.data().active !== true)) throw new Error('The destination vehicle is inactive or unavailable.')
    if (destinationVehicleId && (!destinationTripSnapshot?.exists() || destinationTripSnapshot.data().assignmentStatus !== 'active' || destinationTripSnapshot.data().stage !== 'planned')) throw new Error('The destination vehicle is not actively planned for this event.')
    const currentTrips = tripSnapshots.map((snapshot, index) => {
      if (!snapshot.exists() || snapshot.data().assignmentStatus !== 'active') throw new Error('The transportation plan changed. Reload and try again.')
      return { eventVehicleTripId: snapshot.id, ...snapshot.data() } as EventVehicleTripRecord
    })
    const currentAffectedRoles = unique.flatMap((item) => item.kind === 'staff' ? affectedDriverRolesForMove(currentTrips, item.personId, leg, destinationVehicleId) : [])
    if (currentAffectedRoles.some((item) => !confirmedKeys.has(`${item.tripId}:${item.staffId}:${item.leg}`))) throw new Error('The driver plan changed after confirmation. Reload and try again.')
    const ruleAccessDocuments = new Set<string>()
    const addVehicleValidation = (vehicleId: unknown) => {
      if (typeof vehicleId === 'string' && vehicleId) { ruleAccessDocuments.add(`trip:${vehicleId}`); ruleAccessDocuments.add(`vehicle:${vehicleId}`) }
    }
    participantSnapshots.forEach((snapshot, index) => {
      const data = snapshot.data()
      const nextDeparture = leg === 'departure' ? destinationVehicleId : data?.departureVehicleId
      const nextReturn = leg === 'departure' ? mirroredReturnVehicle(unique[index].kind, unique[index].personId, destinationVehicleId, independentReturnVehicles) : destinationVehicleId
      addVehicleValidation(nextDeparture); addVehicleValidation(nextReturn)
      if (unique[index].kind === 'staff') {
        if (data?.departureVehicleId !== nextDeparture && data?.departureVehicleId) ruleAccessDocuments.add(`trip:${data.departureVehicleId}`)
        if (data?.returnVehicleId !== nextReturn && data?.returnVehicleId) ruleAccessDocuments.add(`trip:${data.returnVehicleId}`)
      }
    })
    currentAffectedRoles.forEach((role) => { ruleAccessDocuments.add(`trip:${role.vehicleId}`); ruleAccessDocuments.add(`vehicle:${role.vehicleId}`) })
    new Set(currentAffectedRoles.map((role) => role.tripId)).forEach((tripId) => {
      const trip = currentTrips.find((item) => item.eventVehicleTripId === tripId)
      if (!trip) return
      const changes = unique.reduce<Record<string, unknown>>((combined, item) => item.kind === 'staff' ? { ...combined, ...clearedDriverFieldsForMove(trip, item.personId, leg, destinationVehicleId) } : combined, {})
      const remainingDrivers = new Set([
        Object.prototype.hasOwnProperty.call(changes, 'departureDriverStaffId') ? changes.departureDriverStaffId : trip.departureDriverStaffId,
        Object.prototype.hasOwnProperty.call(changes, 'returnDriverStaffId') ? changes.returnDriverStaffId : trip.returnDriverStaffId,
      ].filter((staffId): staffId is string => typeof staffId === 'string' && Boolean(staffId)))
      remainingDrivers.forEach((staffId) => { ruleAccessDocuments.add(`staff:${staffId}`); ruleAccessDocuments.add(`participant:${staffId}`) })
    })
    if (ruleAccessDocuments.size > MAX_RULE_ACCESS_DOCUMENTS) throw new Error('This assignment touches too many distinct transportation records for one secure atomic operation. Select a smaller group by vehicle and try again.')
    participantSnapshots.forEach((snapshot, index) => {
      const key = unique[index]
      if (!snapshot.exists() || snapshot.data().status !== 'active' || snapshot.data().eventId !== eventId) throw new Error('Only active participants for this event can be moved.')
      const currentVehicleId = leg === 'departure' ? snapshot.data().departureVehicleId : snapshot.data().returnVehicleId
      if (currentVehicleId && currentTrips.find((trip) => trip.vehicleId === currentVehicleId)?.stage !== 'planned') throw new Error('Recorded transportation assignments cannot be changed by the planning controls.')
      transaction.update(participantRefs[index], leg === 'departure' ? {
        departureVehicleId: destinationVehicleId,
        returnVehicleId: mirroredReturnVehicle(key.kind, key.personId, destinationVehicleId, independentReturnVehicles),
      } : { returnVehicleId: destinationVehicleId })
    })
    currentTrips.forEach((trip, index) => {
      const changes = unique.reduce<Record<string, unknown>>((combined, item) => item.kind === 'staff' ? { ...combined, ...clearedDriverFieldsForMove(trip, item.personId, leg, destinationVehicleId) } : combined, {})
      if (Object.keys(changes).length) transaction.update(tripRefs[index], { ...changes, updatedAt: serverTimestamp() })
    })
  })

  const committed = await Promise.all(participantRefs.map((ref) => getDoc(ref)))
  const assignmentWasCommitted = committed.every((snapshot, index) => {
    if (!snapshot.exists()) return false
    const key = unique[index]
    return leg === 'departure' ? snapshot.data().departureVehicleId === destinationVehicleId &&
      snapshot.data().returnVehicleId === mirroredReturnVehicle(key.kind, key.personId, destinationVehicleId, independentReturnVehicles) : snapshot.data().returnVehicleId === destinationVehicleId
  })
  if (!assignmentWasCommitted) throw new Error('The occupant assignment was not saved. Please try again.')
}

export async function moveParticipantsToDepartureVehicle(eventId: string, participants: TransportationParticipantKey[], destinationVehicleId: string | null, confirmedDriverRoles: AffectedDriverRole[] = []) {
  return moveParticipantsToVehicle(eventId, participants, destinationVehicleId, 'departure', confirmedDriverRoles)
}

export async function bulkMoveParticipantsToDepartureVehicle(eventId: string, participants: TransportationParticipantKey[], destinationVehicleId: string | null, confirmedDriverRoles: AffectedDriverRole[] = []) {
  try {
    await moveParticipantsToDepartureVehicle(eventId, participants, destinationVehicleId, confirmedDriverRoles)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('This assignment touches too many distinct transportation records')) throw error
    throw new Error('Bulk assignment failed. Please try again or try individual assignment.')
  }
}
