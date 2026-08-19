# CR-001 Legacy Driver Migration

## Purpose

This tool converts eligible legacy `eventDrivers` test records into parallel `eventVehicleTrips` foundation records. Production UI is already isolated from legacy records. The tool never deletes legacy records, infers participant occupancy, or changes event status.

## Prerequisites

1. Use Node 20 and run `npm install` in `firebase/functions` for its already-declared dependencies.
2. Authenticate with Application Default Credentials through standard Firebase/Google tooling. Never create or commit a service-account key.
3. Export or back up Firestore and record the recovery location outside source control.
4. Always provide the intended project through `--project=<project-id>`.

## Dry run (default)

From `firebase/functions`:

```powershell
npm run migrate:event-drivers -- --project=<project-id>
```

Without `--apply`, the command only reports records examined, candidate groups, create/already-migrated outcomes, vehicle-less/ineligible drivers, missing dependencies, multiple-driver/legacy-role conflicts, skipped completed/cancelled events, and errors. Resolve or document every exception; the tool never chooses arbitrarily among multiple drivers.

## Explicit apply

Only after backup and report approval:

```powershell
npm run migrate:event-drivers -- --project=<project-id> --apply --confirm=CREATE_EVENT_VEHICLE_TRIPS
```

Apply uses deterministic `eventId__vehicleId` IDs and create-only writes. Existing or concurrently created targets are not overwritten, making reruns idempotent.

## Verification

- Rerun dry-run; eligible targets should report as already migrated.
- Compare source/target totals and inspect all exceptions.
- Verify new records are active/planned, copy one eligible driver to both legs, have null lifecycle/correction values, and server timestamps.
- Verify completed/cancelled events, participant documents, and all `eventDrivers` remain unchanged.

## Rollback before cutover

Production UI depends only on the target collection. Using the apply report and backup, an authorized operator may remove only target documents created by that run, then rerun dry-run. Legacy `eventDrivers` remain isolated until the approved operational reset is explicitly executed. Record the final backup, report, verification, created IDs, rollback approach, and retention/removal decision.

The foundation Rules were deployed on 2026-08-18. This repository milestone does not execute the migration or deploy indexes.
