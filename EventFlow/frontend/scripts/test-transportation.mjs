import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const output = new URL('../.transportation-test/', import.meta.url)
try {
  const compiler = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.transportation-test.json'], { cwd: new URL('..', import.meta.url), stdio: 'inherit' })
  if (compiler.status !== 0) process.exit(compiler.status ?? 1)
  const { driverOccupantFields, groupTransportationOccupants, mirroredReturnVehicle, projectedOccupancy, removedStaffDriverFields, returnDriverIsVisible } = await import('../.transportation-test/services/transportationPlanning.js')
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
  console.log('transportation planning tests passed')
} finally {
  rmSync(output, { recursive: true, force: true })
}
