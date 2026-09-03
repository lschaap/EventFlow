import { doc, getDoc, runTransaction, serverTimestamp, type DocumentSnapshot } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import { listActiveEventVehicleTrips } from './eventVehicleTrips'
import { returnTargetIsEligible } from './returnPlanning'
import type { AffectedDriverRole, TransportationParticipantKey } from './transportationPlanning'

export async function updateEffectiveReturnAssignments(eventId: string, participants: TransportationParticipantKey[], destinationVehicleId: string | null, confirmedDriverRoles: AffectedDriverRole[] = []) {
  const unique = [...new Map(participants.map((person) => [`${person.kind}:${person.personId}`, person])).values()]
  if (!unique.length || unique.length > 100) throw new Error('Select between 1 and 100 return passengers.')
  const db = ensureDb(), trips = await listActiveEventVehicleTrips(eventId)
  const destination = destinationVehicleId ? trips.find((trip) => trip.vehicleId === destinationVehicleId) : null
  if (destinationVehicleId && (!destination || !returnTargetIsEligible(destination.stage, true))) throw new Error('The return destination is not an eligible active event vehicle.')
  const refs = unique.map((person) => doc(db, person.kind === 'student' ? 'eventParticipants' : 'eventStaffParticipants', `${eventId}__${person.personId}`))
  const preflight = await Promise.all(refs.map((ref) => getDoc(ref)))
  const touched = new Set<string>(destinationVehicleId ? [destinationVehicleId] : [])
  preflight.forEach((snapshot) => { const source = snapshot.data()?.returnVehicleId; if (typeof source === 'string' && source) touched.add(source) })
  if (touched.size > 8) throw new Error('This return update touches too many vehicle rosters. Select a smaller group.')
  await runTransaction(db, async (tx) => {
    const event = await tx.get(doc(db, 'events', eventId))
    const participantDocs: DocumentSnapshot[] = []; for (const ref of refs) participantDocs.push(await tx.get(ref))
    const tripDocs = []; for (const trip of trips) tripDocs.push(await tx.get(doc(db, 'eventVehicleTrips', trip.eventVehicleTripId)))
    if (!event.exists() || event.data().status !== 'in_progress') throw new Error('Return assignments require an in-progress event.')
    const currentTrips = tripDocs.map((snapshot) => ({ eventVehicleTripId: snapshot.id, ...snapshot.data() })) as typeof trips
    const confirmed = new Set(confirmedDriverRoles.map((role) => `${role.tripId}:${role.staffId}:return`))
    unique.forEach((person, index) => {
      const participant = participantDocs[index]
      if (!participant.exists() || participant.data().status !== 'active' || participant.data().eventId !== eventId) throw new Error('A selected participant is no longer active.')
      const previous = participant.data().returnVehicleId ?? null
      if (previous === destinationVehicleId) throw new Error('A selected passenger is already assigned to that return destination.')
      const source = previous ? currentTrips.find((trip) => trip.vehicleId === previous) : null
      if (source && !returnTargetIsEligible(source.stage, true)) throw new Error('The source vehicle is not eligible for return editing.')
      const driverTrip = person.kind === 'staff' ? currentTrips.find((trip) => trip.returnDriverStaffId === person.personId && trip.vehicleId !== destinationVehicleId) : null
      if (driverTrip && !confirmed.has(`${driverTrip.eventVehicleTripId}:${person.personId}:return`)) throw new Error('Clearing the return-driver role requires confirmation.')
      tx.update(refs[index], { returnVehicleId: destinationVehicleId })
      if (driverTrip) tx.update(doc(db, 'eventVehicleTrips', driverTrip.eventVehicleTripId), { returnDriverStaffId: null, returnDriverMirrorsDeparture: false, updatedAt: serverTimestamp() })
    })
  })
}
