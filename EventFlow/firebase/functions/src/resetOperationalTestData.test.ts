import assert from 'node:assert/strict'
import { classifyDependentEventIds, parseResetOptions, PRESERVED_COLLECTIONS, RESET_COLLECTIONS, RESET_CONFIRMATION, RESET_PROJECT_ID, validateResetOptions } from './resetOperationalTestData'

assert.deepEqual(RESET_COLLECTIONS, ['events', 'eventParticipants', 'eventStaffParticipants', 'eventDrivers', 'eventVehicleTrips', 'returnRosterCorrections', 'returnDriverCorrections'])
assert.deepEqual(PRESERVED_COLLECTIONS, ['users', 'approvedUsers', 'students', 'staff', 'vehicles', 'activities', 'eventTypes', 'settings'])
assert.deepEqual(classifyDependentEventIds(new Set(['event-1']), ['event-1', 'missing', '', null]), { orphaned: 1, malformed: 2 })
assert.doesNotThrow(() => validateResetOptions(parseResetOptions([`--project=${RESET_PROJECT_ID}`])))
assert.throws(() => validateResetOptions(parseResetOptions(['--project=wrong-project'])), /Reset refused/)
assert.throws(() => validateResetOptions(parseResetOptions([`--project=${RESET_PROJECT_ID}`, '--apply'])), /ack-disposable-data/)
assert.throws(() => validateResetOptions(parseResetOptions([`--project=${RESET_PROJECT_ID}`, '--apply', '--ack-disposable-data'])), /--confirm=/)
assert.doesNotThrow(() => validateResetOptions(parseResetOptions([`--project=${RESET_PROJECT_ID}`, '--apply', '--ack-disposable-data', `--confirm=${RESET_CONFIRMATION}`])))
console.log('operational test-data reset safeguard tests passed')
