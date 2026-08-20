# CR-001 Operational Test-Data Reset

This irreversible utility deletes operational test data only from `events`, `eventParticipants`, `eventStaffParticipants`, `eventDrivers`, and `eventVehicleTrips`. It preserves `users`, `approvedUsers`, `students`, `staff`, `vehicles`, `activities`, `eventTypes`, and `settings`. It is never invoked by build, test, migration, or deployment scripts.

## Required approval and backup

Before apply, the Product Owner must approve the exact dry-run report and either record a Firestore export/backup or explicitly acknowledge that all listed operational data is disposable. Without a backup, deletion is irreversible.

The utility refuses every project except `eventflow-612ed`, defaults to dry run, prints deletion counts and up to 100 sorted document IDs per collection, reports preserved collection counts, flags malformed or orphaned dependent records, reports omitted ID counts, deletes in batches of 400, and requires three independent apply gates.

## Dry run

The utility uses Firebase Admin SDK Application Default Credentials. Install the Google Cloud CLI if `gcloud` is unavailable, then authenticate locally without copying credentials into the repository or chat:

```powershell
gcloud auth application-default login
gcloud config set project eventflow-612ed
```

From `firebase/functions`:

```powershell
npm run reset:test-data -- --project=eventflow-612ed
```

Review and retain the printed project ID, preserved collections, counts, IDs/summary, and irreversible-operation warning. This command performs no deletions.

## Apply only after Product Owner approval

```powershell
npm run reset:test-data -- --project=eventflow-612ed --apply --ack-disposable-data --confirm=DELETE_EVENT_OPERATIONAL_TEST_DATA
```

Apply reports every committed batch and final per-collection totals. It stops and reports the failed collection if a batch fails. Rerun the dry run after a successful reset; every reset collection must report zero while preserved master collections remain intact.

## Execution record

Product Owner approval was received and the reset was executed against `eventflow-612ed` on 2026-08-19. The approved apply deleted 10 `events`, 20 `eventParticipants`, 9 `eventStaffParticipants`, 4 legacy `eventDrivers`, and 4 `eventVehicleTrips` (47 documents total) with no batch failures. The required post-reset dry run reported zero documents in all five reset collections, zero malformed/orphaned dependents, and 27 preserved master/configuration documents. Firebase Authentication users were outside the Firestore deletion scope.
