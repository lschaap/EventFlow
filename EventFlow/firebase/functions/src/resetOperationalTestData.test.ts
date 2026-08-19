import assert from 'node:assert/strict'
import { parseResetOptions, RESET_COLLECTIONS, RESET_CONFIRMATION, RESET_PROJECT_ID, validateResetOptions } from './resetOperationalTestData'

assert.deepEqual(RESET_COLLECTIONS, ['events', 'eventParticipants', 'eventStaffParticipants', 'eventDrivers', 'eventVehicleTrips'])
assert.doesNotThrow(() => validateResetOptions(parseResetOptions([`--project=${RESET_PROJECT_ID}`])))
assert.throws(() => validateResetOptions(parseResetOptions(['--project=wrong-project'])), /Reset refused/)
assert.throws(() => validateResetOptions(parseResetOptions([`--project=${RESET_PROJECT_ID}`, '--apply'])), /ack-disposable-data/)
assert.throws(() => validateResetOptions(parseResetOptions([`--project=${RESET_PROJECT_ID}`, '--apply', '--ack-disposable-data'])), /--confirm=/)
assert.doesNotThrow(() => validateResetOptions(parseResetOptions([`--project=${RESET_PROJECT_ID}`, '--apply', '--ack-disposable-data', `--confirm=${RESET_CONFIRMATION}`])))
console.log('operational test-data reset safeguard tests passed')
