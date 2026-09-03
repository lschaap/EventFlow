import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { EventVehicleTripRecord } from '../types/models'
import { combineTransportationOccupants } from './transportationPlanning'
import { getTransportationSettings } from './transportationSettings'
import { buildOriginalReturnSnapshot, startReturnBlockingError, startReturnReviewToken, type StartReturnReview } from './returnPlanning'
import { getEventVehicleTripId } from './eventVehicleTrips'

const START_RETURN_READ_TIMEOUT_MS = 15_000

function awaitStartReturnRead<T>(read: Promise<T>, message = 'Start Return timed out while reading current data. Check your connection, reload the event, and try again.') {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(message)), START_RETURN_READ_TIMEOUT_MS)
    read.then(
      (value) => { window.clearTimeout(timeout); resolve(value) },
      (error) => { window.clearTimeout(timeout); reject(error) },
    )
  })
}

async function load(eventId: string, vehicleId: string) {
  const db = ensureDb()
  const [event, trip, vehicle, students, staffParts, studentsMaster, staffMaster, settings] = await Promise.all([
    awaitStartReturnRead(getDoc(doc(db, 'events', eventId))), awaitStartReturnRead(getDoc(doc(db, 'eventVehicleTrips', getEventVehicleTripId(eventId, vehicleId)))), awaitStartReturnRead(getDoc(doc(db, 'vehicles', vehicleId))),
    awaitStartReturnRead(getDocs(query(collection(db, 'eventParticipants'), where('eventId', '==', eventId), where('status', '==', 'active')))),
    awaitStartReturnRead(getDocs(query(collection(db, 'eventStaffParticipants'), where('eventId', '==', eventId), where('status', '==', 'active')))),
    awaitStartReturnRead(getDocs(collection(db, 'students'))), awaitStartReturnRead(getDocs(collection(db, 'staff'))), awaitStartReturnRead(getTransportationSettings()),
  ])
  if (!event.exists() || !trip.exists() || !vehicle.exists()) throw new Error('The event, trip, or vehicle does not exist.')
  const tripData = { eventVehicleTripId: trip.id, ...trip.data() } as EventVehicleTripRecord
  const blocked = startReturnBlockingError(String(event.data().status), tripData); if (blocked) throw new Error(blocked)
  if (vehicle.data().active !== true || !Number.isInteger(vehicle.data().capacity) || vehicle.data().capacity <= 0) throw new Error('The vehicle is inactive or malformed.')
  const studentNames = new Map(studentsMaster.docs.map((item) => [item.id, String(item.data().displayName ?? item.id)]))
  const staffNames = new Map(staffMaster.docs.map((item) => [item.id, String(item.data().displayName ?? item.id)]))
  const occupants = combineTransportationOccupants(students.docs.map((item) => ({ eventParticipantId: item.id, ...item.data() })) as never, staffParts.docs.map((item) => ({ eventStaffParticipantId: item.id, ...item.data() })) as never, studentNames, staffNames)
  const driverPart = staffParts.docs.find((item) => item.data().staffId === tripData.returnDriverStaffId)
  const driverMaster = staffMaster.docs.find((item) => item.id === tripData.returnDriverStaffId)
  if (!driverPart || driverPart.data().returnVehicleId !== vehicleId || !driverMaster || driverMaster.data().active !== true || driverMaster.data().canDrive !== true) throw new Error('The return driver must be an active eligible staff participant occupying this vehicle.')
  const roster = occupants.filter((person) => person.returnVehicleId === vehicleId)
  const base: Omit<StartReturnReview, 'reviewToken'> = { eventId, eventName: String(event.data().name ?? eventId), eventStatus: String(event.data().status), eventUpdatedAtMillis: event.data().updatedAt.toMillis(), tripId: trip.id, tripUpdatedAtMillis: trip.data().updatedAt.toMillis(), vehicleId, vehicleName: String(vehicle.data().name ?? vehicleId), returnDriverStaffId: tripData.returnDriverStaffId!, returnDriverName: String(driverMaster.data().displayName ?? tripData.returnDriverStaffId), destination: settings.defaultReturnDestination, occupants: roster, studentCount: roster.filter((p) => p.kind === 'student').length, staffCount: roster.filter((p) => p.kind === 'staff').length, totalOccupants: roster.length, capacity: Number(vehicle.data().capacity), overCapacityBy: Math.max(0, roster.length - Number(vehicle.data().capacity)), unassignedReturnCount: occupants.filter((p) => !p.returnVehicleId).length, arrivedAtEventMillis: tripData.arrivedAtEventAt!.toMillis() }
  const relationships = [
    ...students.docs.map((item) => ({ ref: item.ref, kind: 'student' as const, personId: String(item.data().studentId), displayName: studentNames.get(String(item.data().studentId)) ?? String(item.data().studentId) })),
    ...staffParts.docs.map((item) => ({ ref: item.ref, kind: 'staff' as const, personId: String(item.data().staffId), displayName: staffNames.get(String(item.data().staffId)) ?? String(item.data().staffId) })),
  ]
  return { review: { ...base, reviewToken: startReturnReviewToken(base) }, relationships, driverRef: driverMaster.ref, vehicleRef: vehicle.ref }
}

export async function getStartReturnReview(eventId: string, vehicleId: string) { return (await load(eventId, vehicleId)).review }

export async function startReturn(eventId: string, vehicleId: string, userId: string, reviewedToken: string) {
  if (!userId) throw new Error('An approved signed-in user is required to Start Return.')
  const state = await load(eventId, vehicleId)
  if (state.review.reviewToken !== reviewedToken) throw new Error('The return roster changed after review. Review it again.')
  const db = ensureDb(), tripRef = doc(db, 'eventVehicleTrips', state.review.tripId), eventRef = doc(db, 'events', eventId)
  await runTransaction(db, async (tx) => {
    const event = await awaitStartReturnRead(tx.get(eventRef)); const trip = await awaitStartReturnRead(tx.get(tripRef)); const vehicle = await awaitStartReturnRead(tx.get(state.vehicleRef)); const driver = await awaitStartReturnRead(tx.get(state.driverRef))
    const relationships = []
    for (const relationship of state.relationships) relationships.push(await awaitStartReturnRead(tx.get(relationship.ref)))
    if (!event.exists() || !trip.exists()) throw new Error('The event or trip no longer exists.')
    const current = { eventVehicleTripId: trip.id, ...trip.data() } as EventVehicleTripRecord
    const blocked = startReturnBlockingError(String(event.data().status), current); if (blocked) throw new Error(blocked)
    if (!vehicle.exists() || vehicle.data().active !== true || !driver.exists() || driver.data().active !== true || driver.data().canDrive !== true) throw new Error('The vehicle or return driver is no longer eligible.')
    const currentPeople = relationships.map((snapshot, index) => {
      if (!snapshot.exists() || snapshot.data().status !== 'active') throw new Error('A reviewed participant is no longer active.')
      return { ...state.relationships[index], relationshipId: snapshot.id, departureVehicleId: snapshot.data().departureVehicleId ?? null, returnVehicleId: snapshot.data().returnVehicleId ?? null }
    })
    const roster = currentPeople.filter((person) => person.returnVehicleId === vehicleId)
    const currentBase: Omit<StartReturnReview, 'reviewToken'> = { ...state.review, eventStatus: String(event.data().status), eventUpdatedAtMillis: event.data().updatedAt.toMillis(), tripUpdatedAtMillis: trip.data().updatedAt.toMillis(), vehicleName: String(vehicle.data().name ?? vehicleId), returnDriverStaffId: String(current.returnDriverStaffId ?? ''), returnDriverName: String(driver.data().displayName ?? current.returnDriverStaffId), occupants: roster, studentCount: roster.filter((p) => p.kind === 'student').length, staffCount: roster.filter((p) => p.kind === 'staff').length, totalOccupants: roster.length, capacity: Number(vehicle.data().capacity), overCapacityBy: Math.max(0, roster.length - Number(vehicle.data().capacity)), unassignedReturnCount: currentPeople.filter((p) => !p.returnVehicleId).length }
    if (startReturnReviewToken(currentBase) !== reviewedToken) throw new Error('The return plan changed after review. Review it again.')
    const driverParticipant = currentPeople.find((person) => person.kind === 'staff' && person.personId === current.returnDriverStaffId)
    if (!driverParticipant || driverParticipant.returnVehicleId !== vehicleId) throw new Error('The return driver must occupy this vehicle.')
    tx.update(tripRef, { stage: 'return_started', returnStartedAt: serverTimestamp(), returnStartedByUserId: userId, originalReturnSnapshot: buildOriginalReturnSnapshot({ ...currentBase, reviewToken: reviewedToken }, userId, serverTimestamp()), updatedAt: serverTimestamp() })
  })
  const saved = await awaitStartReturnRead(getDoc(tripRef), 'Start Return was submitted but verification timed out. Reload the event before trying again.')
  if (!saved.exists() || saved.data().stage !== 'return_started' || !saved.data().returnStartedAt || !saved.data().originalReturnSnapshot) throw new Error('Start Return could not be verified. Reload before trying again.')
}
