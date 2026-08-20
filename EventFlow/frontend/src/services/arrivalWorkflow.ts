import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { EventVehicleTripRecord } from '../types/models'
import { arrivalBlockingError, arrivalReviewToken, type ArrivalReview } from './arrivalPlanning'
import { getEventVehicleTripId } from './eventVehicleTrips'

const ARRIVAL_READ_TIMEOUT_MS = 15_000

function awaitArrivalRead<T>(read: Promise<T>, message = 'Arrival confirmation timed out while reading current data. Check your connection, reload the event, and try again.') {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(message)), ARRIVAL_READ_TIMEOUT_MS)
    read.then(
      (value) => { window.clearTimeout(timeout); resolve(value) },
      (error) => { window.clearTimeout(timeout); reject(error) },
    )
  })
}

async function loadArrivalState(eventId: string, vehicleId: string) {
  const db = ensureDb()
  const eventRef = doc(db, 'events', eventId)
  const tripRef = doc(db, 'eventVehicleTrips', getEventVehicleTripId(eventId, vehicleId))
  const vehicleRef = doc(db, 'vehicles', vehicleId)
  const [event, trip, vehicle] = await Promise.all([awaitArrivalRead(getDoc(eventRef)), awaitArrivalRead(getDoc(tripRef)), awaitArrivalRead(getDoc(vehicleRef))])
  if (!event.exists()) throw new Error('Event does not exist.')
  if (!trip.exists()) throw new Error('The vehicle trip does not exist.')
  if (!vehicle.exists()) throw new Error('The vehicle does not exist.')
  const tripData = { eventVehicleTripId: trip.id, ...trip.data() } as EventVehicleTripRecord
  if (trip.id !== getEventVehicleTripId(eventId, vehicleId) || tripData.eventId !== eventId || tripData.vehicleId !== vehicleId) throw new Error('The vehicle-trip record is malformed.')
  const blockingError = arrivalBlockingError(String(event.data().status), tripData)
  if (blockingError) throw new Error(blockingError)
  if (!event.data().startedAt || !event.data().startedByUserId || !event.data().startedByVehicleTripId) throw new Error('The event is missing valid departure-start audit data.')
  const snapshot = tripData.departureSnapshot!
  const base: Omit<ArrivalReview, 'reviewToken'> = {
    eventId, eventName: String(event.data().name ?? eventId), eventLocation: String(event.data().location ?? ''), eventStatus: String(event.data().status), eventUpdatedAtMillis: event.data().updatedAt.toMillis(),
    eventStartedAtMillis: event.data().startedAt.toMillis(), eventStartedByUserId: String(event.data().startedByUserId), eventStartedByVehicleTripId: String(event.data().startedByVehicleTripId),
    tripId: trip.id, tripUpdatedAtMillis: trip.data().updatedAt.toMillis(), vehicleId, vehicleName: String(vehicle.data().name ?? snapshot.vehicleName),
    departureDriverName: snapshot.driverName, departedAtMillis: tripData.departedAt!.toMillis(), departureOccupantCount: snapshot.totalOccupants, departureSnapshot: snapshot,
  }
  return { eventRef, tripRef, vehicleRef, review: { ...base, reviewToken: arrivalReviewToken(base) } }
}

export async function getArrivalReview(eventId: string, vehicleId: string) { return (await loadArrivalState(eventId, vehicleId)).review }

export async function arriveVehicleAtEvent(eventId: string, vehicleId: string, userId: string, reviewedToken: string) {
  if (!userId) throw new Error('An approved signed-in user is required to record arrival.')
  const db = ensureDb()
  const state = await loadArrivalState(eventId, vehicleId)
  if (state.review.reviewToken !== reviewedToken) throw new Error('The trip changed after review. Review the current arrival details and try again.')
  await runTransaction(db, async (transaction) => {
    // Keep transaction reads ordered. Concurrent transaction.get calls can leave the
    // Web SDK waiting without ever reaching the commit request in some browsers.
    const event = await awaitArrivalRead(transaction.get(state.eventRef))
    const trip = await awaitArrivalRead(transaction.get(state.tripRef))
    const vehicle = await awaitArrivalRead(transaction.get(state.vehicleRef))
    if (!event.exists() || !trip.exists() || !vehicle.exists()) throw new Error('The event, trip, or vehicle is no longer available.')
    const tripData = { eventVehicleTripId: trip.id, ...trip.data() } as EventVehicleTripRecord
    const blockingError = arrivalBlockingError(String(event.data().status), tripData)
    if (blockingError) throw new Error(blockingError)
    const base: Omit<ArrivalReview, 'reviewToken'> = {
      ...state.review, eventStatus: String(event.data().status), eventUpdatedAtMillis: event.data().updatedAt.toMillis(), eventStartedAtMillis: event.data().startedAt?.toMillis?.() ?? 0, eventStartedByUserId: String(event.data().startedByUserId ?? ''), eventStartedByVehicleTripId: String(event.data().startedByVehicleTripId ?? ''), tripUpdatedAtMillis: trip.data().updatedAt.toMillis(),
      vehicleName: String(vehicle.data().name ?? state.review.vehicleName), departureDriverName: tripData.departureSnapshot!.driverName,
      departedAtMillis: tripData.departedAt!.toMillis(), departureOccupantCount: tripData.departureSnapshot!.totalOccupants, departureSnapshot: tripData.departureSnapshot!,
    }
    if (arrivalReviewToken(base) !== reviewedToken) throw new Error('The trip changed after review. Review the current arrival details and try again.')
    transaction.update(state.tripRef, { stage: 'arrived_at_event', arrivedAtEventAt: serverTimestamp(), arrivedAtEventByUserId: userId, updatedAt: serverTimestamp() })
  })
  const committed = await awaitArrivalRead(getDoc(state.tripRef), 'Arrival was submitted but verification timed out. Reload the event before trying again.')
  if (!committed.exists() || committed.data().stage !== 'arrived_at_event' || !committed.data().arrivedAtEventAt || committed.data().arrivedAtEventByUserId !== userId) throw new Error('Arrival could not be verified. Reload the event before trying again.')
}
