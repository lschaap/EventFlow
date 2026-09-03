# Firebase

CR-001 operational resets include append-only `returnRosterCorrections` with the other event-dependent collections. Production cleanup requires the same explicit project lock, dry run, confirmation, and post-delete verification as other operational records.

The executable Rules suite is `npm run test:rules-emulator` from `firebase/functions` and requires Java 21+ on `JAVA_HOME`/`PATH`. It uses the fictional `eventflow-rules-test` emulator project and never writes production data.

This folder contains backend configuration and Cloud Functions.

The CR-001 vehicle-trip foundation includes a dry-run-first legacy migration. See `../documentation/migrations/CR-001-legacy-event-drivers.md`. Do not apply without a backup, reviewed report, explicit project ID, and confirmation token.

The final operational test-data reset is documented at `../documentation/migrations/CR-001-test-data-reset.md`. It is project-locked, defaults to dry run, reports preserved master-data counts plus malformed/orphaned dependents, and must not be applied without Product Owner approval and the documented backup/disposable-data acknowledgement.

## Before production
- Configure Firebase Authentication
- Configure Firestore
- Replace placeholder Firestore rules with role-aware rules
- Configure Google Calendar API
- Store sensitive credentials using secret management
- Implement Calendar create/update/delete functions
