import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8')
const marker = (collection: string) => `match /${collection} {`
const block = (collection: string, next: string) => rules.slice(rules.indexOf(marker(collection)), rules.indexOf(marker(next)))

const trips = block('eventVehicleTrips/{tripId}', 'settings/transportation')
assert.match(trips, /allow create: if isAuth\(\) && isApproved\(request\.auth\.uid\)/, 'Admin and Staff can create planned trips')
assert.match(trips, /allow update: if isAuth\(\) && isApproved\(request\.auth\.uid\)/, 'Admin and Staff can update planned trips')
assert.match(trips, /request\.resource\.data\.stage == 'planned'/, 'trip stage remains planned')
assert.match(trips, /request\.resource\.data\.departedAt == null/, 'lifecycle timestamps remain unavailable')
assert.match(trips, /validDepartureDriverParticipant\(request\.resource\.data\.eventId, request\.resource\.data\.vehicleId, request\.resource\.data\.departureDriverStaffId\)/, 'departure driver must occupy the driven vehicle')
assert.match(trips, /validReturnDriverParticipant\(request\.resource\.data\.eventId, request\.resource\.data\.vehicleId, request\.resource\.data\.returnDriverStaffId\)/, 'return driver must occupy the driven vehicle')

for (const name of ['eventParticipants/{participantId}', 'eventStaffParticipants/{participantId}']) {
  const start = rules.indexOf(marker(name))
  const section = rules.slice(start, rules.indexOf('allow delete: if false;', start))
  assert.match(section, /affectedKeys\(\)\.hasOnly\(\['departureVehicleId','returnVehicleId'\]\)/, `${name} transportation writes are field-bounded`)
  assert.match(section, /validParticipantVehicle/, `${name} vehicle references are validated`)
  assert.match(section, /request\.resource\.data\.departureVehicleId == null/, `${name} removal clears departure vehicle`)
  assert.match(section, /request\.resource\.data\.returnVehicleId == null/, `${name} removal clears return vehicle`)
}

const staffTransportation = block('eventStaffParticipants/{participantId}', 'eventDrivers/{driverId}')
assert.match(staffTransportation, /departureDriverMoveIsValid/, 'staff departure moves must clear a conflicting departure driver role atomically')
assert.match(staffTransportation, /returnDriverMoveIsValid/, 'staff return moves must clear a conflicting return driver role atomically')

const legacyDrivers = block('eventDrivers/{driverId}', 'eventVehicleTrips/{tripId}')
assert.match(legacyDrivers, /allow delete: if false;/, 'legacy drivers cannot be hard deleted through the application')

for (const name of ['students/{studentId}', 'staff/{staffId}', 'vehicles/{vehicleId}', 'settings/transportation']) {
  const start = rules.indexOf(marker(name))
  const section = rules.slice(start, rules.indexOf('allow delete: if false;', start))
  assert.match(section, /isAdmin\(request\.auth\.uid\)/, `${name} mutations remain Admin-only`)
}

console.log('firestore rules policy tests passed')
