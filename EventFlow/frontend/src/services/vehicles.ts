import { collection, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { VehicleRecord } from '../types/models'
import { clearedVehicleAssignmentFields, isEligibleFutureTripForDeactivation } from './vehicleDeactivation'

export type VehicleInput = Pick<VehicleRecord, 'name' | 'capacity' | 'active'>
export interface FutureVehicleAssignment { eventId: string; eventName: string }
export const MAX_DEACTIVATION_PARTICIPANTS_PER_EVENT = 100

function normalize(values: VehicleInput): VehicleInput {
  const name = values.name.trim(), capacity = Number(values.capacity)
  if (!name) throw new Error('Vehicle name is required.')
  if (!Number.isInteger(capacity) || capacity <= 0) throw new Error('Capacity must be a positive whole number.')
  return { name, capacity, active: values.active }
}

export async function listVehicles(): Promise<VehicleRecord[]> {
  const snapshot = await getDocs(query(collection(ensureDb(), 'vehicles'), orderBy('name', 'asc')))
  return snapshot.docs.map((item) => ({ vehicleId: item.id, ...(item.data() as Omit<VehicleRecord, 'vehicleId'>) }))
}

export async function createVehicle(values: VehicleInput): Promise<string> {
  const ref = doc(collection(ensureDb(), 'vehicles')), now = serverTimestamp()
  await setDoc(ref, { vehicleId: ref.id, ...normalize(values), createdAt: now, updatedAt: now }); return ref.id
}

export async function updateVehicle(vehicleId: string, values: VehicleInput): Promise<void> {
  const ref = doc(ensureDb(), 'vehicles', vehicleId)
  if (!(await getDoc(ref)).exists()) throw new Error('Vehicle not found.')
  await updateDoc(ref, { ...normalize(values), updatedAt: serverTimestamp() })
}

async function eligibleAssignments(vehicleId: string) {
  const db = ensureDb()
  const trips = await getDocs(query(collection(db, 'eventVehicleTrips'), where('vehicleId', '==', vehicleId), where('assignmentStatus', '==', 'active')))
  const now = new Date()
  const resolved = await Promise.all(trips.docs.map(async (trip) => ({ trip, event: await getDoc(doc(db, 'events', String(trip.data().eventId))) })))
  return resolved.filter(({ trip, event }) => event.exists() && isEligibleFutureTripForDeactivation({ status: event.data().status, departureDateTime: event.data().departureDateTime.toDate(), startedAt: event.data().startedAt?.toDate?.() ?? null }, { assignmentStatus: trip.data().assignmentStatus, stage: trip.data().stage }, now))
}

export async function listFutureVehicleAssignments(vehicleId: string): Promise<FutureVehicleAssignment[]> {
  return (await eligibleAssignments(vehicleId)).map(({ trip, event }) => ({ eventId: String(trip.data().eventId), eventName: String(event.data()!.name ?? trip.data().eventId) }))
}

export async function deactivateVehicleAndClearFutureAssignments(vehicleId: string): Promise<void> {
  const db = ensureDb(), vehicleRef = doc(db, 'vehicles', vehicleId)
  const vehicle = await getDoc(vehicleRef)
  if (!vehicle.exists()) throw new Error('Vehicle not found.')
  const assignments = await eligibleAssignments(vehicleId)
  let completedEvents = 0
  for (const { trip, event } of assignments) {
    const eventId = String(trip.data().eventId)
    const [students, staff] = await Promise.all([
      getDocs(query(collection(db, 'eventParticipants'), where('eventId', '==', eventId), where('status', '==', 'active'))),
      getDocs(query(collection(db, 'eventStaffParticipants'), where('eventId', '==', eventId), where('status', '==', 'active'))),
    ])
    const occupants = [...students.docs, ...staff.docs].filter((item) => item.data().departureVehicleId === vehicleId || item.data().returnVehicleId === vehicleId)
    if (occupants.length > MAX_DEACTIVATION_PARTICIPANTS_PER_EVENT) throw new Error(`Cleanup stopped after ${completedEvents} of ${assignments.length} event(s). ${String(event.data()!.name ?? eventId)} exceeds the supported ${MAX_DEACTIVATION_PARTICIPANTS_PER_EVENT}-participant cleanup limit. The vehicle remains active; retry after reducing that event's assignments.`)
    try {
      await runTransaction(db, async (transaction) => {
        const [currentTrip, currentEvent, currentOccupants] = await Promise.all([transaction.get(trip.ref), transaction.get(event.ref), Promise.all(occupants.map((item) => transaction.get(item.ref)))])
        if (!currentTrip.exists() || !currentEvent.exists() || !isEligibleFutureTripForDeactivation({ status: currentEvent.data().status, departureDateTime: currentEvent.data().departureDateTime.toDate(), startedAt: currentEvent.data().startedAt?.toDate?.() ?? null }, { assignmentStatus: currentTrip.data().assignmentStatus, stage: currentTrip.data().stage })) throw new Error('The event or trip is no longer eligible for automatic cleanup.')
        currentOccupants.forEach((occupant, index) => {
          if (!occupant.exists() || occupant.data().status !== 'active') throw new Error('The participant plan changed. Reload and try again.')
          const changes = clearedVehicleAssignmentFields(occupant.data(), vehicleId)
          if (Object.keys(changes).length) transaction.update(occupants[index].ref, changes)
        })
        transaction.update(trip.ref, { assignmentStatus: 'removed', departureDriverStaffId: null, returnDriverStaffId: null, returnDriverMirrorsDeparture: true, updatedAt: serverTimestamp() })
      })
      completedEvents += 1
    } catch (reason) {
      throw new Error(`Cleanup stopped after ${completedEvents} of ${assignments.length} event(s). ${String(event.data()!.name ?? eventId)} was not changed. The vehicle remains active. ${reason instanceof Error ? reason.message : 'Retry the deactivation.'}`)
    }
  }
  await updateDoc(vehicleRef, { active: false, updatedAt: serverTimestamp() })
}
