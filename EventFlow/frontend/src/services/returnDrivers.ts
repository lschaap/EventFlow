import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import { assertDriverAvailable, listActiveEventVehicleTrips } from './eventVehicleTrips'

const EDITABLE = ['departed', 'arrived_at_event', 'return_started']

export async function updateEffectiveReturnDriver(eventId: string, vehicleId: string, staffId: string | null) {
  const db = ensureDb(), trips = await listActiveEventVehicleTrips(eventId), target = trips.find((trip) => trip.vehicleId === vehicleId)
  if (!target || !EDITABLE.includes(target.stage)) throw new Error('Return drivers may be edited only after Depart and before Returned.')
  if (target.returnDriverStaffId === staffId) return
  if (staffId) await assertDriverAvailable(eventId, vehicleId, 'return', staffId)
  if (staffId && trips.some((trip) => trip.vehicleId !== vehicleId && trip.returnDriverStaffId === staffId)) throw new Error('This staff member already drives another return vehicle. Clear that assignment first.')
  const tripRef = doc(db, 'eventVehicleTrips', target.eventVehicleTripId)
  await runTransaction(db, async (tx) => {
    const trip = await tx.get(tripRef)
    const participant = staffId ? await tx.get(doc(db, 'eventStaffParticipants', `${eventId}__${staffId}`)) : null
    const staff = staffId ? await tx.get(doc(db, 'staff', staffId)) : null
    if (!trip.exists() || trip.data().assignmentStatus !== 'active' || !EDITABLE.includes(String(trip.data().stage))) throw new Error('The vehicle stage changed. Reload and try again.')
    if ((trip.data().returnDriverStaffId ?? null) !== (target.returnDriverStaffId ?? null)) throw new Error('The return driver changed. Reload and try again.')
    if (staffId && (!participant?.exists() || participant.data().status !== 'active' || participant.data().eventId !== eventId || participant.data().returnVehicleId !== vehicleId || !staff?.exists() || staff.data().active !== true || staff.data().canDrive !== true)) throw new Error('The selected driver must be an active eligible staff occupant of this vehicle.')
    tx.update(tripRef, { returnDriverStaffId: staffId, returnDriverMirrorsDeparture: false, updatedAt: serverTimestamp() })
  })
}
