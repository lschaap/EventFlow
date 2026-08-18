import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { EventVehicleTripRecord, ResolvedEventVehicleTrip } from '../types/models'

export const getEventVehicleTripId = (eventId: string, vehicleId: string) => `${eventId}__${vehicleId}`

function asTrip(id: string, data: Record<string, unknown>): EventVehicleTripRecord {
  return { eventVehicleTripId: id, ...data } as EventVehicleTripRecord
}

export async function getEventVehicleTrip(eventId: string, vehicleId: string): Promise<EventVehicleTripRecord | null> {
  const snapshot = await getDoc(doc(ensureDb(), 'eventVehicleTrips', getEventVehicleTripId(eventId, vehicleId)))
  return snapshot.exists() ? asTrip(snapshot.id, snapshot.data()) : null
}

export async function listActiveEventVehicleTrips(eventId: string): Promise<EventVehicleTripRecord[]> {
  const snapshot = await getDocs(query(collection(ensureDb(), 'eventVehicleTrips'), where('eventId', '==', eventId), where('assignmentStatus', '==', 'active')))
  return snapshot.docs.map((item) => asTrip(item.id, item.data()))
}

export async function listActiveVehicleTrips(vehicleId: string): Promise<EventVehicleTripRecord[]> {
  const snapshot = await getDocs(query(collection(ensureDb(), 'eventVehicleTrips'), where('vehicleId', '==', vehicleId), where('assignmentStatus', '==', 'active')))
  return snapshot.docs.map((item) => asTrip(item.id, item.data()))
}

export async function resolveEventVehicleTripNames(trips: EventVehicleTripRecord[]): Promise<ResolvedEventVehicleTrip[]> {
  const db = ensureDb()
  return Promise.all(trips.map(async (trip) => {
    const [vehicle, departureDriver, returnDriver] = await Promise.all([
      getDoc(doc(db, 'vehicles', trip.vehicleId)),
      trip.departureDriverStaffId ? getDoc(doc(db, 'staff', trip.departureDriverStaffId)) : null,
      trip.returnDriverStaffId ? getDoc(doc(db, 'staff', trip.returnDriverStaffId)) : null,
    ])
    return {
      ...trip,
      vehicleName: vehicle?.exists() ? String(vehicle.data().name ?? trip.vehicleId) : trip.vehicleId,
      departureDriverName: departureDriver?.exists() ? String(departureDriver.data().displayName ?? trip.departureDriverStaffId) : null,
      returnDriverName: returnDriver?.exists() ? String(returnDriver.data().displayName ?? trip.returnDriverStaffId) : null,
    }
  }))
}

export async function createPlannedEventVehicleTrip(eventId: string, vehicleId: string, driverStaffId: string | null): Promise<string> {
  const id = getEventVehicleTripId(eventId, vehicleId)
  await setDoc(doc(ensureDb(), 'eventVehicleTrips', id), {
    eventVehicleTripId: id,
    eventId,
    vehicleId,
    assignmentStatus: 'active',
    stage: 'planned',
    departureDriverStaffId: driverStaffId,
    returnDriverStaffId: driverStaffId,
    departedAt: null,
    arrivedAtEventAt: null,
    returnStartedAt: null,
    returnedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    correctedAt: null,
    correctedByUserId: null,
    correctionReason: null,
  })
  return id
}

export async function removePlannedEventVehicleTrip(eventId: string, vehicleId: string): Promise<void> {
  const ref = doc(ensureDb(), 'eventVehicleTrips', getEventVehicleTripId(eventId, vehicleId))
  const current = await getDoc(ref)
  if (!current.exists() || current.data().assignmentStatus !== 'active' || current.data().stage !== 'planned') throw new Error('Only an active planned vehicle trip can be removed.')
  await updateDoc(ref, { assignmentStatus: 'removed', updatedAt: serverTimestamp() })
}
