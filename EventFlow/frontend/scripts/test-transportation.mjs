import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const output = new URL('../.transportation-test/', import.meta.url)
try {
  const compiler = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.transportation-test.json'], { cwd: new URL('..', import.meta.url), stdio: 'inherit' })
  if (compiler.status !== 0) process.exit(compiler.status ?? 1)
  const { affectedDriverRolesForMove, clearedDriverFieldsForMove, driverOccupantFields, groupTransportationOccupants, mirroredReturnVehicle, projectedOccupancy, removedStaffDriverFields, returnDriverIsVisible } = await import('../.transportation-test/services/transportationPlanning.js')
  const { buildEventTransportationSummary } = await import('../.transportation-test/services/eventTransportationSummary.js')
  const { clearedVehicleAssignmentFields, isEligibleFutureTripForDeactivation } = await import('../.transportation-test/services/vehicleDeactivation.js')
  const trips = [{ vehicleId: 'van-a' }, { vehicleId: 'van-b' }]
  const vehicles = [{ vehicleId: 'van-a', capacity: 1 }, { vehicleId: 'van-b', capacity: 3 }]
  const occupants = [
    { kind: 'staff', personId: 'driver', departureVehicleId: 'van-a', returnVehicleId: 'van-b' },
    { kind: 'student', personId: 'student', departureVehicleId: 'van-a', returnVehicleId: 'van-a' },
    { kind: 'staff', personId: 'unassigned', departureVehicleId: null, returnVehicleId: null },
  ]
  const departure = groupTransportationOccupants(occupants, trips, vehicles, 'departure')
  const returning = groupTransportationOccupants(occupants, trips, vehicles, 'return')
  assert.equal(departure[0].occupancy, 2, 'driver is counted once through occupancy')
  assert.equal(departure[0].overCapacityBy, 1, 'overcapacity is derived but does not reject')
  assert.equal(departure.at(-1).occupancy, 1, 'null assignments are Unassigned')
  assert.equal(returning[0].occupancy, 1, 'departure and return occupancy differ')
  assert.equal(returning[1].occupancy, 1, 'independent return driver is grouped on return vehicle')
  assert.equal(projectedOccupancy(2, 1, 3), 4, 'projected capacity deduplicates selected occupants already at destination')
  const exceptions = new Map([['driver', 'van-b']])
  assert.equal(mirroredReturnVehicle('staff', 'driver', 'van-a', exceptions), 'van-b', 'independent return driver is preserved')
  assert.equal(mirroredReturnVehicle('student', 'student', null, exceptions), null, 'ordinary departure clear mirrors return clear')
  assert.deepEqual(driverOccupantFields('departure', 'van-a', true), { departureVehicleId: 'van-a', returnVehicleId: 'van-a' }, 'mirrored departure driver occupies both legs')
  assert.deepEqual(driverOccupantFields('departure', 'van-a', false), { departureVehicleId: 'van-a' }, 'independent return plan is preserved')
  assert.deepEqual(driverOccupantFields('return', 'van-b', false), { returnVehicleId: 'van-b' }, 'return driver preserves outbound assignment')
  assert.equal(returnDriverIsVisible(true), false, 'mirrored return driver stays hidden')
  assert.equal(returnDriverIsVisible(false), true, 'independent return confirmation reveals return driver')
  assert.deepEqual(removedStaffDriverFields({ departureDriverStaffId: 'driver', returnDriverStaffId: 'driver' }, 'driver'), { departureDriverStaffId: null, returnDriverStaffId: null, returnDriverMirrorsDeparture: true }, 'removing a participant clears both mirrored driver legs')
  assert.deepEqual(removedStaffDriverFields({ departureDriverStaffId: 'other', returnDriverStaffId: 'driver' }, 'driver'), { returnDriverStaffId: null, returnDriverMirrorsDeparture: false }, 'removing an independent return driver preserves the departure driver')
  const mirroredTrip = { eventVehicleTripId: 'event__van-a', vehicleId: 'van-a', assignmentStatus: 'active', departureDriverStaffId: 'driver', returnDriverStaffId: 'driver', returnDriverMirrorsDeparture: true }
  assert.deepEqual(affectedDriverRolesForMove([mirroredTrip], 'driver', 'departure', 'van-b').map((item) => item.leg), ['departure', 'return'], 'moving a mirrored departure driver discloses both cleared roles')
  assert.deepEqual(clearedDriverFieldsForMove(mirroredTrip, 'driver', 'departure', 'van-b'), { departureDriverStaffId: null, returnDriverStaffId: null, returnDriverMirrorsDeparture: true }, 'mirrored departure move clears both roles consistently')
  assert.deepEqual(clearedDriverFieldsForMove(mirroredTrip, 'driver', 'return', null), { returnDriverStaffId: null, returnDriverMirrorsDeparture: false }, 'return-only move preserves departure and breaks mirroring')
  const independentTrip = { ...mirroredTrip, returnDriverStaffId: 'return-driver', returnDriverMirrorsDeparture: false }
  assert.deepEqual(affectedDriverRolesForMove([independentTrip], 'driver', 'departure', null).map((item) => item.leg), ['departure'], 'independent departure move clears only departure role')
  assert.deepEqual(clearedDriverFieldsForMove(independentTrip, 'return-driver', 'return', 'van-b'), { returnDriverStaffId: null }, 'independent return move clears only return role')
  assert.deepEqual(affectedDriverRolesForMove([mirroredTrip], 'driver', 'departure', 'van-a'), [], 'remaining in the driven vehicle preserves roles')
  assert.deepEqual(affectedDriverRolesForMove([mirroredTrip], 'student', 'departure', 'van-b'), [], 'students never produce driver-role effects')
  const event = { eventId: 'event', participantCount: 3 }
  const summaryTrips = [
    { eventId: 'event', vehicleId: 'van-a', assignmentStatus: 'active', departureDriverStaffId: 'driver', returnDriverStaffId: 'return-driver' },
    { eventId: 'event', vehicleId: 'van-b', assignmentStatus: 'removed', departureDriverStaffId: 'legacy', returnDriverStaffId: 'legacy' },
  ]
  const studentParts = [{ eventId: 'event', studentId: 'student', status: 'active', departureVehicleId: 'van-a' }, { eventId: 'event', studentId: 'unassigned', status: 'active', departureVehicleId: null }]
  const staffParts = [{ eventId: 'event', staffId: 'driver', status: 'active', departureVehicleId: 'van-a' }, { eventId: 'event', staffId: 'driver', status: 'active', departureVehicleId: 'van-a' }]
  const summary = buildEventTransportationSummary(event, summaryTrips, studentParts, staffParts, [{ vehicleId: 'van-a', name: 'Van A', capacity: 1 }], [{ staffId: 'driver', displayName: 'Driver' }, { staffId: 'return-driver', displayName: 'Return Driver' }])
  assert.deepEqual(summary.vehicleNames, ['Van A'], 'removed trips and legacy records do not influence list summaries')
  assert.deepEqual(summary.departureDriverNames, ['Driver'], 'departure driver names resolve from target trips')
  assert.deepEqual(summary.returnDriverDifferences, ['Van A: Return Driver'], 'different return drivers are identified')
  assert.equal(summary.assignedDepartureOccupantCount, 2, 'driver participant is deduplicated and counted once')
  assert.equal(summary.unassignedDepartureCount, 1, 'unassigned departure participants are counted')
  assert.equal(summary.totalDepartureCapacity, 1, 'capacity derives only from active trip vehicles')
  assert.equal(summary.hasOverCapacity, true, 'per-vehicle or plan overcapacity is reported')
  assert.equal(buildEventTransportationSummary(event, [], studentParts, staffParts, [], []).hasPlan, false, 'no-plan state is explicit')
  const future = { status: 'confirmed', departureDateTime: new Date('2030-01-02T00:00:00Z'), startedAt: null }
  const planned = { assignmentStatus: 'active', stage: 'planned' }
  assert.equal(isEligibleFutureTripForDeactivation(future, planned, new Date('2030-01-01T00:00:00Z')), true, 'future confirmed planned trip is eligible')
  assert.equal(isEligibleFutureTripForDeactivation({ ...future, status: 'completed' }, planned, new Date('2030-01-01T00:00:00Z')), false, 'completed event is preserved')
  assert.equal(isEligibleFutureTripForDeactivation({ ...future, startedAt: new Date() }, planned, new Date('2030-01-01T00:00:00Z')), false, 'started event is preserved')
  assert.deepEqual(clearedVehicleAssignmentFields({ departureVehicleId: 'van-a', returnVehicleId: 'van-b' }, 'van-a'), { departureVehicleId: null }, 'unrelated leg assignment is preserved')
  console.log('transportation planning tests passed')
} finally {
  rmSync(output, { recursive: true, force: true })
}
