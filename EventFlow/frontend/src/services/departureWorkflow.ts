import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where, type DocumentReference } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { EventVehicleTripRecord } from '../types/models'
import { buildDepartureSnapshot, departureReviewToken, reconcileInitialReturnAssignments, type DeparturePerson, type DepartureReview } from './departurePlanning'
import { getEventVehicleTripId } from './eventVehicleTrips'

type Relationship = { ref: DocumentReference; masterRef: DocumentReference; person: DeparturePerson }

async function loadDepartureState(eventId: string, vehicleId: string) {
  const db = ensureDb()
  const [event, trip, vehicle, studentRelationships, staffRelationships, trips] = await Promise.all([
    getDoc(doc(db, 'events', eventId)),
    getDoc(doc(db, 'eventVehicleTrips', getEventVehicleTripId(eventId, vehicleId))),
    getDoc(doc(db, 'vehicles', vehicleId)),
    getDocs(query(collection(db, 'eventParticipants'), where('eventId', '==', eventId), where('status', '==', 'active'))),
    getDocs(query(collection(db, 'eventStaffParticipants'), where('eventId', '==', eventId), where('status', '==', 'active'))),
    getDocs(query(collection(db, 'eventVehicleTrips'), where('eventId', '==', eventId), where('assignmentStatus', '==', 'active'))),
  ])
  if (!event.exists()) throw new Error('Event does not exist.')
  if (!trip.exists()) throw new Error('The vehicle trip does not exist.')
  if (!vehicle.exists() || vehicle.data().active !== true) throw new Error('The vehicle is inactive or unavailable.')
  const tripData = { eventVehicleTripId: trip.id, ...trip.data() } as EventVehicleTripRecord
  if (tripData.eventId !== eventId || tripData.vehicleId !== vehicleId || trip.id !== getEventVehicleTripId(eventId, vehicleId)) throw new Error('The vehicle-trip record is malformed.')
  if (tripData.assignmentStatus !== 'active' || tripData.stage !== 'planned') throw new Error('Only an active planned vehicle can Depart.')
  if (!['confirmed', 'in_progress'].includes(String(event.data().status))) throw new Error('The event must be confirmed or already in progress before a vehicle can Depart.')
  if (event.data().status === 'in_progress' && (!event.data().startedAt || !event.data().startedByUserId || !event.data().startedByVehicleTripId)) throw new Error('The in-progress event is missing its departure-start audit data.')
  if (!Number.isInteger(vehicle.data().capacity) || vehicle.data().capacity <= 0 || typeof vehicle.data().name !== 'string' || !vehicle.data().name.trim()) throw new Error('The vehicle record is malformed and cannot be snapshotted.')
  if (tripData.departedAt || tripData.departedByUserId || tripData.departureSnapshot || tripData.arrivedAtEventAt || tripData.returnStartedAt || tripData.returnedAt) throw new Error('The planned trip contains incompatible lifecycle data.')
  if (!tripData.departureDriverStaffId) throw new Error('Assign a departure driver before Depart.')

  const allRelationshipDocs = [...studentRelationships.docs, ...staffRelationships.docs]
  const masterRefs = allRelationshipDocs.map((item) => doc(db, item.ref.parent.id === 'eventParticipants' ? 'students' : 'staff', item.ref.parent.id === 'eventParticipants' ? item.data().studentId : item.data().staffId))
  const driverMasterRef = doc(db, 'staff', tripData.departureDriverStaffId)
  const masters = await Promise.all([...masterRefs.map((ref) => getDoc(ref)), getDoc(driverMasterRef)])
  const driverMaster = masters.at(-1)!
  const driverRelationship = staffRelationships.docs.find((item) => item.data().staffId === tripData.departureDriverStaffId)
  if (!driverMaster.exists() || driverMaster.data().active !== true || driverMaster.data().canDrive !== true) throw new Error('The departure driver is not active and eligible to drive.')
  if (!driverRelationship || driverRelationship.data().departureVehicleId !== vehicleId) throw new Error('The departure driver must be an active staff participant occupying this vehicle.')

  const relationships: Relationship[] = allRelationshipDocs.map((relationship, index) => {
    const isStudent = relationship.ref.parent.id === 'eventParticipants'
    const personId = String(isStudent ? relationship.data().studentId : relationship.data().staffId)
    const master = masters[index]
    if (!master.exists()) throw new Error(`Participant ${personId} cannot be included in a consistent departure snapshot.`)
    return { ref: relationship.ref, masterRef: masterRefs[index], person: { kind: isStudent ? 'student' : 'staff', personId, displayName: String(master.data().displayName ?? personId), departureVehicleId: relationship.data().departureVehicleId ?? null, returnVehicleId: relationship.data().returnVehicleId ?? null } }
  })
  const activeTrips = trips.docs.map((item) => ({ eventVehicleTripId: item.id, ...item.data() } as EventVehicleTripRecord))
  for (const activeTrip of activeTrips) {
    if (!activeTrip.returnDriverStaffId) continue
    const relationshipIndex = allRelationshipDocs.findIndex((item) => item.ref.parent.id === 'eventStaffParticipants' && item.data().staffId === activeTrip.returnDriverStaffId)
    const relationship = relationshipIndex >= 0 ? allRelationshipDocs[relationshipIndex] : null
    const master = relationshipIndex >= 0 ? masters[relationshipIndex] : null
    if (!relationship || relationship.data().returnVehicleId !== activeTrip.vehicleId || !master?.exists() || master.data().active !== true || master.data().canDrive !== true) throw new Error(`Return driver ${activeTrip.returnDriverStaffId} is not an eligible occupant of ${activeTrip.vehicleId}. Resolve the return driver plan before Depart.`)
  }
  const occupants = relationships.filter((item) => item.person.departureVehicleId === vehicleId)
  reconcileInitialReturnAssignments(occupants.map((item) => item.person), activeTrips, vehicleId)
  const base: Omit<DepartureReview, 'reviewToken'> = {
    eventId, eventName: String(event.data().name ?? eventId), eventStatus: String(event.data().status), eventUpdatedAtMillis: event.data().updatedAt.toMillis(),
    tripId: trip.id, vehicleId, vehicleName: String(vehicle.data().name ?? vehicleId), vehicleCapacity: Number(vehicle.data().capacity),
    departureDriverStaffId: tripData.departureDriverStaffId, departureDriverName: String(driverMaster.data().displayName ?? tripData.departureDriverStaffId),
    occupants: occupants.map((item) => item.person), studentCount: occupants.filter((item) => item.person.kind === 'student').length,
    staffCount: occupants.filter((item) => item.person.kind === 'staff').length, totalOccupants: occupants.length,
    availableSeats: Math.max(0, Number(vehicle.data().capacity) - occupants.length), overCapacityBy: Math.max(0, occupants.length - Number(vehicle.data().capacity)),
    unassignedDepartureCount: allRelationshipDocs.filter((item) => item.data().departureVehicleId == null).length,
  }
  return { review: { ...base, reviewToken: departureReviewToken(base) }, relationships, activeTrips }
}

export async function getDepartureReview(eventId: string, vehicleId: string) { return (await loadDepartureState(eventId, vehicleId)).review }

export async function departVehicle(eventId: string, vehicleId: string, userId: string, reviewedToken: string) {
  if (!userId) throw new Error('An approved signed-in user is required to Depart a vehicle.')
  const db = ensureDb()
  const state = await loadDepartureState(eventId, vehicleId)
  if (state.review.reviewToken !== reviewedToken) throw new Error('The transportation plan changed after review. Review the current assignments and try again.')
  const tripRef = doc(db, 'eventVehicleTrips', state.review.tripId)
  const eventRef = doc(db, 'events', eventId)
  const vehicleRef = doc(db, 'vehicles', vehicleId)
  const activeTripRefs = state.activeTrips.map((trip) => doc(db, 'eventVehicleTrips', trip.eventVehicleTripId))
  const relationshipByKey = new Map(state.relationships.map((item) => [`${item.person.kind}:${item.person.personId}`, item]))
  const returnDriverId = state.activeTrips.find((trip) => trip.vehicleId === vehicleId)?.returnDriverStaffId
  if (returnDriverId && !relationshipByKey.has(`staff:${returnDriverId}`)) {
    const ref = doc(db, 'eventStaffParticipants', `${eventId}__${returnDriverId}`)
    const snapshot = await getDoc(ref)
    if (!snapshot.exists() || snapshot.data().status !== 'active') throw new Error('The planned return driver is not an active event participant.')
    relationshipByKey.set(`staff:${returnDriverId}`, { ref, masterRef: doc(db, 'staff', returnDriverId), person: { kind: 'staff', personId: returnDriverId, displayName: returnDriverId, departureVehicleId: snapshot.data().departureVehicleId ?? null, returnVehicleId: snapshot.data().returnVehicleId ?? null } })
  }
  await runTransaction(db, async (transaction) => {
    const relationshipEntries = [...relationshipByKey.values()]
    const [event, trip, vehicle, driver, activeTrips, relationships, masters] = await Promise.all([
      transaction.get(eventRef), transaction.get(tripRef), transaction.get(vehicleRef),
      transaction.get(doc(db, 'staff', state.review.departureDriverStaffId)),
      Promise.all(activeTripRefs.map((ref) => transaction.get(ref))),
      Promise.all(relationshipEntries.map((item) => transaction.get(item.ref))),
      Promise.all(relationshipEntries.map((item) => transaction.get(item.masterRef))),
    ])
    if (!event.exists() || !trip.exists() || !vehicle.exists()) throw new Error('The event, trip, or vehicle is no longer available.')
    if (vehicle.data().active !== true || trip.data().assignmentStatus !== 'active' || trip.data().stage !== 'planned') throw new Error('This vehicle is no longer eligible to Depart.')
    if (!['confirmed', 'in_progress'].includes(String(event.data().status))) throw new Error('The event is no longer eligible for Depart.')
    const currentPeople = relationships.map((snapshot, index) => {
      const expected = relationshipEntries[index]
      if (!snapshot.exists() || snapshot.data().status !== 'active') throw new Error('A reviewed participant is no longer active. Review the vehicle again.')
      if (!masters[index].exists()) throw new Error('A participant cannot be included in a consistent departure snapshot.')
      return { ...expected.person, displayName: String(masters[index].data().displayName ?? expected.person.personId), departureVehicleId: snapshot.data().departureVehicleId ?? null, returnVehicleId: snapshot.data().returnVehicleId ?? null }
    })
    const reviewedCurrentPeople = currentPeople.filter((person) => person.departureVehicleId === vehicleId)
    const studentCount = reviewedCurrentPeople.filter((person) => person.kind === 'student').length
    const staffCount = reviewedCurrentPeople.filter((person) => person.kind === 'staff').length
    const currentCapacity = Number(vehicle.data().capacity)
    const base: Omit<DepartureReview, 'reviewToken'> = { ...state.review, eventStatus: String(event.data().status), eventUpdatedAtMillis: event.data().updatedAt.toMillis(), vehicleCapacity: currentCapacity, occupants: reviewedCurrentPeople, studentCount, staffCount, totalOccupants: reviewedCurrentPeople.length, availableSeats: Math.max(0, currentCapacity - reviewedCurrentPeople.length), overCapacityBy: Math.max(0, reviewedCurrentPeople.length - currentCapacity), unassignedDepartureCount: currentPeople.filter((person) => person.departureVehicleId == null).length }
    const token = departureReviewToken(base)
    if (!driver.exists() || driver.data().active !== true || driver.data().canDrive !== true || token !== reviewedToken || trip.data().departureDriverStaffId !== state.review.departureDriverStaffId) throw new Error('The transportation plan changed after review. Review the current assignments and try again.')
    const currentTrips = activeTrips.map((snapshot) => {
      if (!snapshot.exists() || snapshot.data().assignmentStatus !== 'active') throw new Error('The transportation plan changed after review.')
      return { eventVehicleTripId: snapshot.id, ...snapshot.data() } as EventVehicleTripRecord
    })
    for (const activeTrip of currentTrips) {
      if (!activeTrip.returnDriverStaffId) continue
      const key = `staff:${activeTrip.returnDriverStaffId}`
      const personIndex = relationshipEntries.findIndex((item) => `${item.person.kind}:${item.person.personId}` === key)
      const person = currentPeople.find((item) => `${item.kind}:${item.personId}` === key)
      if (personIndex < 0 || person?.returnVehicleId !== activeTrip.vehicleId || !masters[personIndex].exists() || masters[personIndex].data().active !== true || masters[personIndex].data().canDrive !== true) throw new Error('The return driver plan changed after review. Review the current assignments and try again.')
    }
    const reconciled = reconcileInitialReturnAssignments(reviewedCurrentPeople, currentTrips, vehicleId)
    if (returnDriverId) reconciled.set(`staff:${returnDriverId}`, vehicleId)
    for (const [key, targetVehicleId] of reconciled) {
      const relationship = relationshipByKey.get(key)
      if (!relationship) throw new Error('Return assignments cannot be initialized consistently.')
      const current = currentPeople.find((person) => `${person.kind}:${person.personId}` === key)
      if (current?.returnVehicleId !== targetVehicleId) transaction.update(relationship.ref, { returnVehicleId: targetVehicleId })
    }
    const committedReview: DepartureReview = { ...state.review, vehicleName: String(vehicle.data().name ?? vehicleId), vehicleCapacity: Number(vehicle.data().capacity), departureDriverName: String(driver.data().displayName ?? state.review.departureDriverStaffId), occupants: reviewedCurrentPeople, studentCount, staffCount, totalOccupants: reviewedCurrentPeople.length, availableSeats: Math.max(0, Number(vehicle.data().capacity) - reviewedCurrentPeople.length), overCapacityBy: Math.max(0, reviewedCurrentPeople.length - Number(vehicle.data().capacity)) }
    transaction.update(tripRef, {
      stage: 'departed', departedAt: serverTimestamp(), departedByUserId: userId,
      departureSnapshot: buildDepartureSnapshot(committedReview), returnDriverMirrorsDeparture: false, updatedAt: serverTimestamp(),
    })
    if (event.data().status === 'confirmed') transaction.update(eventRef, { status: 'in_progress', startedAt: serverTimestamp(), startedByUserId: userId, startedByVehicleTripId: trip.id, updatedAt: serverTimestamp() })
  })
  const committed = await getDoc(tripRef)
  if (!committed.exists() || committed.data().stage !== 'departed' || !committed.data().departedAt) throw new Error('Depart could not be verified. Reload the event before trying again.')
}
