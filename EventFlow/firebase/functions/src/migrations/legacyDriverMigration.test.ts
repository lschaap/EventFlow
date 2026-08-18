import assert from 'node:assert/strict'
import { getTripId, planLegacyDriverMigration } from './legacyDriverMigration'

const base = {
  events: [{ eventId: 'event-1', status: 'confirmed' }, { eventId: 'event-old', status: 'completed' }],
  staff: [{ staffId: 'staff-1', active: true, canDrive: true }, { staffId: 'staff-2', active: true, canDrive: true }],
  vehicles: [{ vehicleId: 'vehicle-1', active: true }],
}

assert.equal(getTripId('event-1', 'vehicle-1'), 'event-1__vehicle-1')

const candidate = planLegacyDriverMigration({ ...base, existingTripIds: [], drivers: [{ eventDriverId: 'd1', eventId: 'event-1', staffId: 'staff-1', vehicleId: 'vehicle-1', status: 'assigned' }] })
assert.equal(candidate.legacyRecordsExamined, 1)
assert.equal(candidate.tripsToCreate.length, 1)
assert.equal(candidate.tripsToCreate[0].tripId, 'event-1__vehicle-1')
assert.equal(candidate.tripsToCreate[0].returnDriverMirrorsDeparture, true)

const idempotent = planLegacyDriverMigration({ ...base, existingTripIds: ['event-1__vehicle-1'], drivers: [{ eventDriverId: 'd1', eventId: 'event-1', staffId: 'staff-1', vehicleId: 'vehicle-1', status: 'assigned' }] })
assert.deepEqual(idempotent.tripsAlreadyMigrated, ['event-1__vehicle-1'])
assert.equal(idempotent.tripsToCreate.length, 0)

const conflicts = planLegacyDriverMigration({ ...base, existingTripIds: [], drivers: [
  { eventDriverId: 'd1', eventId: 'event-1', staffId: 'staff-1', vehicleId: 'vehicle-1', status: 'assigned', role: 'primary' },
  { eventDriverId: 'd2', eventId: 'event-1', staffId: 'staff-2', vehicleId: 'vehicle-1', status: 'assigned', role: 'secondary' },
  { eventDriverId: 'd3', eventId: 'event-1', staffId: 'staff-1', vehicleId: null, status: 'assigned' },
  { eventDriverId: 'd4', eventId: 'event-old', staffId: 'staff-1', vehicleId: 'vehicle-1', status: 'assigned' },
] })
assert.equal(conflicts.multipleDriverConflicts.length, 1)
assert.equal(conflicts.primarySecondaryRoleConflicts.length, 1)
assert.deepEqual(conflicts.driversWithoutVehicles, ['d3'])
assert.deepEqual(conflicts.skippedCompletedCancelledEvents, ['d4'])
assert.equal(conflicts.tripsToCreate.length, 0)

console.log('legacyDriverMigration tests passed')
