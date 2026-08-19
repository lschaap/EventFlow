# CR-001 Operational Test-Data Reset

This irreversible utility deletes operational test data only from `events`, `eventParticipants`, `eventStaffParticipants`, `eventDrivers`, and `eventVehicleTrips`. It preserves `users`, `students`, `staff`, `vehicles`, `activities`, `eventTypes`, and `settings`. It is never invoked by build, test, migration, or deployment scripts.

## Required approval and backup

Before apply, the Product Owner must approve the exact dry-run report and either record a Firestore export/backup or explicitly acknowledge that all listed operational data is disposable. Without a backup, deletion is irreversible.

The utility refuses every project except `eventflow-612ed`, defaults to dry run, prints counts and up to 100 sorted document IDs per collection, reports omitted ID counts, deletes in batches of 400, and requires three independent apply gates.

## Dry run

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

This procedure has been implemented but has not been executed.
