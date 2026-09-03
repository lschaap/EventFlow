import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { Timestamp, doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'

async function main() {
  const projectId = 'eventflow-rules-test'
  const env = await initializeTestEnvironment({ projectId, firestore: { rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8') } })
  const now = Timestamp.fromMillis(1_000)
  const baseTrip = {
    eventVehicleTripId: 'event__van-a', eventId: 'event', vehicleId: 'van-a', assignmentStatus: 'active', stage: 'arrived_at_event',
    departureDriverStaffId: 'driver', returnDriverStaffId: 'driver', returnDriverMirrorsDeparture: false,
    departedAt: now, departedByUserId: 'admin', departureSnapshot: { vehicleId: 'van-a', vehicleName: 'Van A', driverStaffId: 'driver', driverName: 'Driver', studentOccupantIds: ['student'], studentOccupantNames: ['Student'], staffOccupantIds: ['driver'], staffOccupantNames: ['Driver'], studentCount: 1, staffCount: 1, totalOccupants: 2, vehicleCapacity: 4, overCapacity: false },
    arrivedAtEventAt: now, arrivedAtEventByUserId: 'admin', returnStartedAt: null, returnStartedByUserId: null, originalReturnSnapshot: null, returnedAt: null,
    createdAt: now, updatedAt: now, correctedAt: null, correctedByUserId: null, correctionReason: null,
  }
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore(), batch = writeBatch(db)
    batch.set(doc(db, 'users/admin'), { email: 'admin@example.test', role: 'admin', active: true })
    batch.set(doc(db, 'users/staff-user'), { email: 'staff@example.test', role: 'staff', active: true })
    batch.set(doc(db, 'users/inactive'), { email: 'inactive@example.test', role: 'staff', active: false })
    batch.set(doc(db, 'events/event'), { name: 'Event', status: 'in_progress', startedAt: now, startedByUserId: 'admin', startedByVehicleTripId: 'event__van-a', studentParticipantCount: 1, staffParticipantCount: 1, participantCount: 2, hasDietaryRestrictions: false, updatedAt: now })
    batch.set(doc(db, 'vehicles/van-a'), { vehicleId: 'van-a', name: 'Van A', capacity: 4, active: true, createdAt: now, updatedAt: now })
    batch.set(doc(db, 'vehicles/van-b'), { vehicleId: 'van-b', name: 'Van B', capacity: 4, active: true, createdAt: now, updatedAt: now })
    batch.set(doc(db, 'staff/driver'), { staffId: 'driver', displayName: 'Driver', active: true, canDrive: true })
    batch.set(doc(db, 'eventStaffParticipants/event__driver'), { eventStaffParticipantId: 'event__driver', eventId: 'event', staffId: 'driver', status: 'active', addedByUserId: 'admin', addedAt: now, removedByUserId: null, removedAt: null, notes: null, departureVehicleId: 'van-a', returnVehicleId: 'van-a' })
    batch.set(doc(db, 'eventParticipants/event__student'), { eventParticipantId: 'event__student', eventId: 'event', studentId: 'student', status: 'active', addedByUserId: 'admin', addedAt: now, removedByUserId: null, removedAt: null, notes: null, departureVehicleId: 'van-a', returnVehicleId: 'van-a' })
    batch.set(doc(db, 'eventVehicleTrips/event__van-a'), baseTrip)
    batch.set(doc(db, 'eventVehicleTrips/event__van-b'), { ...baseTrip, eventVehicleTripId: 'event__van-b', vehicleId: 'van-b', stage: 'departed', departureDriverStaffId: null, returnDriverStaffId: null, departureSnapshot: { ...baseTrip.departureSnapshot, vehicleId: 'van-b', vehicleName: 'Van B', driverStaffId: 'driver', studentOccupantIds: [], studentOccupantNames: [], staffOccupantIds: [], staffOccupantNames: [], studentCount: 0, staffCount: 0, totalOccupants: 0 } })
    batch.set(doc(db, 'settings/transportation'), { defaultReturnDestination: 'Mill Village', updatedAt: now, updatedByUserId: 'admin' })
    for (const [suffix, userId] of [['admin-depart', 'admin'], ['staff-depart', 'staff-user']] as const) {
      const eventId = `event-${suffix}`, tripId = `${eventId}__van-a`
      batch.set(doc(db, `events/${eventId}`), { eventId, name: 'Depart Event', activityId: 'activity', eventTypeId: 'type', departureDateTime: now, returnDateTime: Timestamp.fromMillis(2_000), location: 'Destination', status: 'confirmed', createdByUserId: userId, createdByUserName: 'User', createdAt: now, updatedAt: now })
      batch.set(doc(db, `eventStaffParticipants/${eventId}__driver`), { eventStaffParticipantId: `${eventId}__driver`, eventId, staffId: 'driver', status: 'active', addedByUserId: userId, addedAt: now, removedByUserId: null, removedAt: null, notes: null, departureVehicleId: 'van-a', returnVehicleId: 'van-a' })
      batch.set(doc(db, `eventVehicleTrips/${tripId}`), { ...baseTrip, eventVehicleTripId: tripId, eventId, stage: 'planned', departedAt: null, departedByUserId: null, departureSnapshot: null, arrivedAtEventAt: null, arrivedAtEventByUserId: null })
    }
    await batch.commit()
  })
  const admin = env.authenticatedContext('admin').firestore()
  const staff = env.authenticatedContext('staff-user').firestore()
  const inactive = env.authenticatedContext('inactive').firestore()
  const departSnapshot = { ...baseTrip.departureSnapshot, studentOccupantIds: [], studentOccupantNames: [], studentCount: 0, staffCount: 1, totalOccupants: 1 }
  for (const [db, eventId, userId] of [[admin, 'event-admin-depart', 'admin'], [staff, 'event-staff-depart', 'staff-user']] as const) {
    const tripId = `${eventId}__van-a`, departBatch = writeBatch(db)
    departBatch.update(doc(db, `eventVehicleTrips/${tripId}`), { stage: 'departed', departedAt: serverTimestamp(), departedByUserId: userId, departureSnapshot: departSnapshot, returnDriverMirrorsDeparture: false, updatedAt: serverTimestamp() })
    departBatch.update(doc(db, `events/${eventId}`), { status: 'in_progress', startedAt: serverTimestamp(), startedByUserId: userId, startedByVehicleTripId: tripId, updatedAt: serverTimestamp() })
    await assertSucceeds(departBatch.commit())
    await assertSucceeds(updateDoc(doc(db, `eventVehicleTrips/${tripId}`), { stage: 'arrived_at_event', arrivedAtEventAt: serverTimestamp(), arrivedAtEventByUserId: userId, updatedAt: serverTimestamp() }))
    const chainedStartSnapshot = { ...departSnapshot, destination: 'Mill Village', startedByUserId: userId, startedAt: serverTimestamp() }
    await assertSucceeds(updateDoc(doc(db, `eventVehicleTrips/${tripId}`), { stage: 'return_started', returnStartedAt: serverTimestamp(), returnStartedByUserId: userId, originalReturnSnapshot: chainedStartSnapshot, updatedAt: serverTimestamp() }))
  }
  await assertSucceeds(updateDoc(doc(staff, 'eventParticipants/event__student'), { returnVehicleId: 'van-b' }))
  await assertFails(updateDoc(doc(inactive, 'eventParticipants/event__student'), { returnVehicleId: 'van-a' }))
  const startSnapshot = { ...baseTrip.departureSnapshot, destination: 'Mill Village', startedByUserId: 'admin', startedAt: serverTimestamp() }
  await assertSucceeds(updateDoc(doc(admin, 'eventVehicleTrips/event__van-a'), { stage: 'return_started', returnStartedAt: serverTimestamp(), returnStartedByUserId: 'admin', originalReturnSnapshot: startSnapshot, updatedAt: serverTimestamp() }))
  await assertFails(updateDoc(doc(admin, 'eventVehicleTrips/event__van-a'), { originalReturnSnapshot: { ...baseTrip.departureSnapshot, destination: 'Changed' }, updatedAt: serverTimestamp() }))
  const correctionId = 'correction-one', correction = { correctionId, eventId: 'event', correctionType: 'return_roster_assignment', correctedByUserId: 'staff-user', correctedAt: serverTimestamp(), changes: { student__student: { participantType: 'student', participantId: 'student', participantName: 'Student', previousReturnVehicleId: 'van-b', correctedReturnVehicleId: 'van-a', sourceTripId: 'event__van-b', destinationTripId: 'event__van-a', clearedReturnDriverTripId: null } } }
  const correctionBatch = writeBatch(staff)
  correctionBatch.update(doc(staff, 'eventParticipants/event__student'), { returnVehicleId: 'van-a', latestReturnCorrectionId: correctionId })
  correctionBatch.set(doc(staff, `returnRosterCorrections/${correctionId}`), correction)
  await assertSucceeds(correctionBatch.commit())
  await assertFails(updateDoc(doc(staff, `returnRosterCorrections/${correctionId}`), { correctedByUserId: 'admin' }))
  await assertFails(updateDoc(doc(staff, 'eventParticipants/event__student'), { returnVehicleId: null, latestReturnCorrectionId: 'missing-correction' }))
  assert.ok(true, 'Rules emulator exercised ordinary editing, Start Return, authorization, immutable snapshot, and append-only correction linkage')
  await env.cleanup()
}

main().then(() => console.log('firestore rules emulator tests passed')).catch((error) => { console.error(error); process.exitCode = 1 })
