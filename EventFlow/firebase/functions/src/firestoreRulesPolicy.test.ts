import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8')
const marker = (collection: string) => `match /${collection} {`
const block = (collection: string, next: string) => rules.slice(rules.indexOf(marker(collection)), rules.indexOf(marker(next)))

const trips = block('eventVehicleTrips/{tripId}', 'settings/transportation')
assert.match(trips, /allow create: if isAuth\(\) && isApproved\(request\.auth\.uid\)/, 'Admin and Staff can create planned trips')
assert.match(trips, /allow update: if isAuth\(\) && isApproved\(request\.auth\.uid\)/, 'Admin and Staff can update planned trips')
assert.match(trips, /resource\.data\.stage == 'planned' && request\.resource\.data\.stage == 'departed'/, 'only the first lifecycle transition is enabled')
assert.match(trips, /request\.resource\.data\.departedAt == request\.time/, 'Depart requires a server-authoritative timestamp')
assert.match(trips, /request\.resource\.data\.departedByUserId == request\.auth\.uid/, 'Depart records the authenticated user')
assert.match(trips, /validDepartureSnapshot/, 'Depart requires a structurally valid immutable snapshot')
assert.match(trips, /validEventStateAfterDepart/, 'Depart validates the atomic first/later event state')
assert.match(trips, /resource\.data\.stage == 'departed' && request\.resource\.data\.stage == 'arrived_at_event'/, 'only departed trips can record arrival')
assert.match(trips, /request\.resource\.data\.arrivedAtEventAt == request\.time/, 'arrival uses the server-authoritative request time')
assert.match(trips, /request\.resource\.data\.arrivedAtEventByUserId == request\.auth\.uid/, 'arrival records the authenticated user')
assert.match(trips, /affectedKeys\(\)\.hasOnly\(\['stage','arrivedAtEventAt','arrivedAtEventByUserId','updatedAt'\]\)/, 'arrival preserves departure, drivers, assignments, and later timestamps')
assert.match(trips, /validEventStateForArrival/, 'arrival requires and preserves the in-progress event')
assert.doesNotMatch(trips, /request\.resource\.data\.stage == 'return_started'/, 'Start Return remains unavailable')
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
assert.match(staffTransportation, /validStaffDepartInitialization/, 'staff return initialization is limited to the atomic Depart transition')
assert.match(rules, /validStudentDepartInitialization/, 'student return initialization mirrors the departure vehicle')
assert.match(rules, /validFirstDepartEventTransition/, 'confirmed to in-progress is tied to an atomic vehicle departure')

const legacyDrivers = block('eventDrivers/{driverId}', 'eventVehicleTrips/{tripId}')
assert.match(legacyDrivers, /allow delete: if false;/, 'legacy drivers cannot be hard deleted through the application')

for (const name of ['students/{studentId}', 'staff/{staffId}', 'vehicles/{vehicleId}', 'settings/transportation']) {
  const start = rules.indexOf(marker(name))
  const section = rules.slice(start, rules.indexOf('allow delete: if false;', start))
  assert.match(section, /isAdmin\(request\.auth\.uid\)/, `${name} mutations remain Admin-only`)
}

console.log('firestore rules policy tests passed')
