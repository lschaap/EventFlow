import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { planLegacyDriverMigration, type LegacyDriver, type MigrationEvent, type MigrationStaff, type MigrationVehicle } from './legacyDriverMigration'

const APPLY_CONFIRMATION = 'CREATE_EVENT_VEHICLE_TRIPS'
const args = new Set(process.argv.slice(2))
const projectArgument = process.argv.find((value) => value.startsWith('--project='))?.split('=')[1]
const apply = args.has('--apply')

if (!projectArgument) throw new Error('Provide an explicit Firebase project with --project=<project-id>.')
if (apply && !args.has(`--confirm=${APPLY_CONFIRMATION}`)) throw new Error(`Apply mode requires --confirm=${APPLY_CONFIRMATION}.`)

initializeApp({ credential: applicationDefault(), projectId: projectArgument })
const db = getFirestore()

async function loadCollection<T>(name: string, idField: string): Promise<T[]> {
  const snapshot = await db.collection(name).get()
  return snapshot.docs.map((item) => ({ [idField]: item.id, ...item.data() }) as T)
}

async function main() {
  const [drivers, events, staff, vehicles, trips] = await Promise.all([
    loadCollection<LegacyDriver>('eventDrivers', 'eventDriverId'),
    loadCollection<MigrationEvent>('events', 'eventId'),
    loadCollection<MigrationStaff>('staff', 'staffId'),
    loadCollection<MigrationVehicle>('vehicles', 'vehicleId'),
    loadCollection<{ eventVehicleTripId: string }>('eventVehicleTrips', 'eventVehicleTripId'),
  ])
  const report = planLegacyDriverMigration({ drivers, events, staff, vehicles, existingTripIds: trips.map((item) => item.eventVehicleTripId) })
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', projectId: projectArgument, ...report }, null, 2))
  if (!apply) {
    console.log(`Dry run only. Review the report, then rerun with --apply --confirm=${APPLY_CONFIRMATION} if approved.`)
    return
  }
  if (report.errors.length) throw new Error('Apply stopped because the report contains errors.')

  let created = 0
  let becameExisting = 0
  for (const candidate of report.tripsToCreate) {
    try {
      await db.collection('eventVehicleTrips').doc(candidate.tripId).create({
        eventVehicleTripId: candidate.tripId,
        eventId: candidate.eventId,
        vehicleId: candidate.vehicleId,
        assignmentStatus: 'active',
        stage: 'planned',
        departureDriverStaffId: candidate.driverStaffId,
        returnDriverStaffId: candidate.driverStaffId,
        returnDriverMirrorsDeparture: true,
        departedAt: null,
        departedByUserId: null,
        departureSnapshot: null,
        arrivedAtEventAt: null,
        arrivedAtEventByUserId: null,
        returnStartedAt: null,
        returnStartedByUserId: null,
        originalReturnSnapshot: null,
        returnedAt: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        correctedAt: null,
        correctedByUserId: null,
        correctionReason: null,
        latestReturnDriverCorrectionId: null,
      })
      created += 1
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: number | string }).code === 6) becameExisting += 1
      else throw error
    }
  }
  console.log(JSON.stringify({ applyResult: { created, alreadyExistedDuringApply: becameExisting, legacyRecordsDeleted: 0 } }, null, 2))
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
