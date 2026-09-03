import { collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { EventVehicleTripRecord, ReturnDriverCorrectionRecord } from '../types/models'
import { assertDriverAvailable, listActiveEventVehicleTrips } from './eventVehicleTrips'

const EDITABLE_DRIVER_STAGES = ['departed', 'arrived_at_event', 'return_started']

export async function listReturnDriverCorrections(eventId: string): Promise<ReturnDriverCorrectionRecord[]> {
  const snapshot = await getDocs(query(collection(ensureDb(), 'returnDriverCorrections'), where('eventId', '==', eventId)))
  return snapshot.docs.map((item) => ({ correctionId: item.id, ...item.data() } as ReturnDriverCorrectionRecord)).sort((a, b) => (b.correctedAt?.toMillis?.() ?? 0) - (a.correctedAt?.toMillis?.() ?? 0))
}

export async function correctReturnDriver(eventId: string, vehicleId: string, staffId: string | null, userId: string) {
  if (!userId) throw new Error('An approved signed-in user is required to update the return driver.')
  const db = ensureDb(), trips = await listActiveEventVehicleTrips(eventId)
  const target = trips.find((trip) => trip.vehicleId === vehicleId)
  if (!target || !EDITABLE_DRIVER_STAGES.includes(target.stage)) throw new Error('Return drivers may be edited only after Depart and before Returned.')
  if (target.returnDriverStaffId === staffId) return
  if (staffId) await assertDriverAvailable(eventId, vehicleId, 'return', staffId)
  if (staffId && trips.some((trip) => trip.vehicleId !== vehicleId && trip.returnDriverStaffId === staffId)) throw new Error('This staff member is already the return driver of another vehicle. Clear that assignment first.')
  const correctionId = crypto.randomUUID(), tripRef = doc(db, 'eventVehicleTrips', target.eventVehicleTripId)
  const correctionRef = doc(db, 'returnDriverCorrections', correctionId)
  const participantRef = staffId ? doc(db, 'eventStaffParticipants', `${eventId}__${staffId}`) : null
  const staffRef = staffId ? doc(db, 'staff', staffId) : null
  await runTransaction(db, async (tx) => {
    const tripSnapshot = await tx.get(tripRef)
    const participantSnapshot = participantRef ? await tx.get(participantRef) : null
    const staffSnapshot = staffRef ? await tx.get(staffRef) : null
    if (!tripSnapshot.exists() || tripSnapshot.data().assignmentStatus !== 'active' || !EDITABLE_DRIVER_STAGES.includes(String(tripSnapshot.data().stage))) throw new Error('The vehicle stage changed. Reload and try again.')
    if ((tripSnapshot.data().returnDriverStaffId ?? null) !== (target.returnDriverStaffId ?? null)) throw new Error('The return driver changed. Reload and try again.')
    if (staffId && (!participantSnapshot?.exists() || participantSnapshot.data().status !== 'active' || participantSnapshot.data().eventId !== eventId || participantSnapshot.data().returnVehicleId !== vehicleId || !staffSnapshot?.exists() || staffSnapshot.data().active !== true || staffSnapshot.data().canDrive !== true)) throw new Error('The selected driver must be an active eligible staff occupant of this vehicle.')
    tx.update(tripRef, { returnDriverStaffId: staffId, returnDriverMirrorsDeparture: false, latestReturnDriverCorrectionId: correctionId, updatedAt: serverTimestamp() })
    tx.set(correctionRef, { correctionId, eventId, tripId: target.eventVehicleTripId, vehicleId, previousReturnDriverStaffId: target.returnDriverStaffId ?? null, correctedReturnDriverStaffId: staffId, correctedByUserId: userId, correctedAt: serverTimestamp(), correctionType: 'return_driver_assignment' })
  })
}
