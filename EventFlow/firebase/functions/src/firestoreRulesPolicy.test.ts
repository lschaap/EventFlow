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

for (const name of ['eventParticipants/{participantId}', 'eventStaffParticipants/{participantId}']) {
  const start = rules.indexOf(marker(name))
  const section = rules.slice(start, rules.indexOf('allow delete: if false;', start))
  assert.match(section, /affectedKeys\(\)\.hasOnly\(\['departureVehicleId','returnVehicleId'\]\)/, `${name} transportation writes are field-bounded`)
  assert.match(section, /validParticipantVehicle/, `${name} vehicle references are validated`)
}

for (const name of ['students/{studentId}', 'staff/{staffId}', 'vehicles/{vehicleId}', 'settings/transportation']) {
  const start = rules.indexOf(marker(name))
  const section = rules.slice(start, rules.indexOf('allow delete: if false;', start))
  assert.match(section, /isAdmin\(request\.auth\.uid\)/, `${name} mutations remain Admin-only`)
}

console.log('firestore rules policy tests passed')
