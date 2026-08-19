import { doc, getDoc, runTransaction } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import { listActiveEventVehicleTrips } from './eventVehicleTrips'
import { assertNoParticipationOverlap } from './participationConflicts'
import { mirroredReturnVehicle, type TransportationParticipantKey } from './transportationPlanning'

export const MAX_BULK_TRANSPORTATION_SELECTION = 100

function relationshipRef(eventId: string, key: TransportationParticipantKey) {
  const collection = key.kind === 'student' ? 'eventParticipants' : 'eventStaffParticipants'
  return doc(ensureDb(), collection, `${eventId}__${key.personId}`)
}

export async function moveParticipantsToDepartureVehicle(
  eventId: string,
  participants: TransportationParticipantKey[],
  destinationVehicleId: string | null,
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

  const independentReturnVehicles = new Map(
    trips
      .filter((trip) => !trip.returnDriverMirrorsDeparture && trip.returnDriverStaffId)
      .map((trip) => [trip.returnDriverStaffId!, trip.vehicleId]),
  )
  const db = ensureDb()
  const participantRefs = unique.map((item) => relationshipRef(eventId, item))
  const destinationTripRef = destination ? doc(db, 'eventVehicleTrips', destination.eventVehicleTripId) : null
  const vehicleRef = destinationVehicleId ? doc(db, 'vehicles', destinationVehicleId) : null

  await runTransaction(db, async (transaction) => {
    const [participantSnapshots, destinationTripSnapshot, vehicleSnapshot] = await Promise.all([
      Promise.all(participantRefs.map((ref) => transaction.get(ref))),
      destinationTripRef ? transaction.get(destinationTripRef) : Promise.resolve(null),
      vehicleRef ? transaction.get(vehicleRef) : Promise.resolve(null),
    ])
    if (destinationVehicleId && (!vehicleSnapshot?.exists() || vehicleSnapshot.data().active !== true)) throw new Error('The destination vehicle is inactive or unavailable.')
    if (destinationVehicleId && (!destinationTripSnapshot?.exists() || destinationTripSnapshot.data().assignmentStatus !== 'active' || destinationTripSnapshot.data().stage !== 'planned')) throw new Error('The destination vehicle is not actively planned for this event.')
    participantSnapshots.forEach((snapshot, index) => {
      const key = unique[index]
      if (!snapshot.exists() || snapshot.data().status !== 'active' || snapshot.data().eventId !== eventId) throw new Error('Only active participants for this event can be moved.')
      transaction.update(participantRefs[index], {
        departureVehicleId: destinationVehicleId,
        returnVehicleId: mirroredReturnVehicle(key.kind, key.personId, destinationVehicleId, independentReturnVehicles),
      })
    })
  })

  const committed = await Promise.all(participantRefs.map((ref) => getDoc(ref)))
  const assignmentWasCommitted = committed.every((snapshot, index) => {
    if (!snapshot.exists()) return false
    const key = unique[index]
    return snapshot.data().departureVehicleId === destinationVehicleId &&
      snapshot.data().returnVehicleId === mirroredReturnVehicle(key.kind, key.personId, destinationVehicleId, independentReturnVehicles)
  })
  if (!assignmentWasCommitted) throw new Error('The occupant assignment was not saved. Please try again.')
}

export async function bulkMoveParticipantsToDepartureVehicle(eventId: string, participants: TransportationParticipantKey[], destinationVehicleId: string | null) {
  try {
    await moveParticipantsToDepartureVehicle(eventId, participants, destinationVehicleId)
  } catch {
    throw new Error('Bulk assignment failed. Please try again or try individual assignment.')
  }
}
