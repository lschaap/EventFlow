import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where, type DocumentSnapshot } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { ReturnRosterCorrectionRecord } from '../types/models'
import { getEventVehicleTripId, listActiveEventVehicleTrips } from './eventVehicleTrips'
import { returnTargetIsEligible } from './returnPlanning'
import type { AffectedDriverRole, TransportationParticipantKey } from './transportationPlanning'

export async function listReturnCorrections(eventId: string): Promise<ReturnRosterCorrectionRecord[]> {
  const snapshot = await getDocs(query(collection(ensureDb(), 'returnRosterCorrections'), where('eventId', '==', eventId)))
  return snapshot.docs.flatMap((item) => Object.values(item.data().changes ?? {}).map((change) => ({ correctionId: item.id, operationId: item.id, eventId, correctedByUserId: item.data().correctedByUserId, correctedAt: item.data().correctedAt, correctionType: 'return_roster_assignment', ...(change as object) } as ReturnRosterCorrectionRecord))).sort((a, b) => (b.correctedAt?.toMillis?.() ?? 0) - (a.correctedAt?.toMillis?.() ?? 0))
}

export async function correctReturnAssignments(eventId: string, participants: Array<TransportationParticipantKey & { displayName: string }>, destinationVehicleId: string | null, userId: string, confirmedDriverRoles: AffectedDriverRole[] = []) {
  if (!userId) throw new Error('An approved signed-in user is required to correct a return roster.')
  const unique = [...new Map(participants.map((person) => [`${person.kind}:${person.personId}`, person])).values()]
  if (!unique.length || unique.length > 100) throw new Error('Select between 1 and 100 participants.')
  const db = ensureDb(), trips = await listActiveEventVehicleTrips(eventId)
  const destination = destinationVehicleId ? trips.find((trip) => trip.vehicleId === destinationVehicleId) : null
  if (destinationVehicleId && (!destination || !returnTargetIsEligible(destination.stage, true))) throw new Error('The correction destination is not an eligible active event vehicle.')
  const operationId = crypto.randomUUID()
  const correctionRef = doc(db, 'returnRosterCorrections', operationId)
  const participantRefs = unique.map((person) => doc(db, person.kind === 'student' ? 'eventParticipants' : 'eventStaffParticipants', `${eventId}__${person.personId}`))
  const preflight = await Promise.all(participantRefs.map((ref) => getDoc(ref)))
  const touchedVehicles = new Set<string>(destinationVehicleId ? [destinationVehicleId] : [])
  preflight.forEach((snapshot) => { const source = snapshot.data()?.returnVehicleId; if (typeof source === 'string' && source) touchedVehicles.add(source) })
  if (touchedVehicles.size > 8) throw new Error('This correction touches too many vehicle rosters for one secure atomic operation. Select a smaller group by vehicle and try again.')
  const eventRef = doc(db, 'events', eventId)
  await runTransaction(db, async (tx) => {
    const event = await tx.get(eventRef)
    const participantDocs: DocumentSnapshot[] = []; for (const ref of participantRefs) participantDocs.push(await tx.get(ref))
    const tripDocs = []; for (const trip of trips) tripDocs.push(await tx.get(doc(db, 'eventVehicleTrips', trip.eventVehicleTripId)))
    if (!event.exists() || !['in_progress', 'completed'].includes(String(event.data().status))) throw new Error('Return corrections require an in-progress or completed event.')
    const currentTrips = tripDocs.map((snapshot) => ({ eventVehicleTripId: snapshot.id, ...snapshot.data() })) as typeof trips
    const confirmed = new Set(confirmedDriverRoles.map((role) => `${role.tripId}:${role.staffId}:return`))
    const changes: Record<string, unknown> = {}
    unique.forEach((person, index) => {
      const participant = participantDocs[index]
      if (!participant.exists() || participant.data().status !== 'active' || participant.data().eventId !== eventId) throw new Error('A selected participant is no longer active.')
      const previous = participant.data().returnVehicleId ?? null
      if (previous === destinationVehicleId) throw new Error(`${person.displayName} is already assigned to that return destination.`)
      const source = previous ? currentTrips.find((trip) => trip.vehicleId === previous) : null
      if (source && !returnTargetIsEligible(source.stage, true)) throw new Error('The source vehicle is not eligible for correction.')
      const driverTrip = person.kind === 'staff' ? currentTrips.find((trip) => trip.returnDriverStaffId === person.personId && trip.vehicleId !== destinationVehicleId) : null
      if (driverTrip && !confirmed.has(`${driverTrip.eventVehicleTripId}:${person.personId}:return`)) throw new Error('Clearing the return-driver role requires confirmation.')
      tx.update(participantRefs[index], { returnVehicleId: destinationVehicleId, latestReturnCorrectionId: correctionRef.id })
      if (driverTrip) tx.update(doc(db, 'eventVehicleTrips', driverTrip.eventVehicleTripId), { returnDriverStaffId: null, returnDriverMirrorsDeparture: false, updatedAt: serverTimestamp() })
      changes[`${person.kind}__${person.personId}`] = { participantType: person.kind, participantId: person.personId, participantName: person.displayName, previousReturnVehicleId: previous, correctedReturnVehicleId: destinationVehicleId, sourceTripId: previous ? getEventVehicleTripId(eventId, previous) : null, destinationTripId: destinationVehicleId ? getEventVehicleTripId(eventId, destinationVehicleId) : null, clearedReturnDriverTripId: driverTrip?.eventVehicleTripId ?? null }
    })
    tx.set(correctionRef, { correctionId: correctionRef.id, eventId, correctionType: 'return_roster_assignment', correctedByUserId: userId, correctedAt: serverTimestamp(), changes })
  })
}
