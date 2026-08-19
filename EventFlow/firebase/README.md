# Firebase

This folder contains backend configuration and Cloud Functions.

The CR-001 vehicle-trip foundation includes a dry-run-first legacy migration. See `../documentation/migrations/CR-001-legacy-event-drivers.md`. Do not apply without a backup, reviewed report, explicit project ID, and confirmation token.

The final operational test-data reset is documented at `../documentation/migrations/CR-001-test-data-reset.md`. It is project-locked, defaults to dry run, preserves master data, and must not be applied without Product Owner approval and the documented backup/disposable-data acknowledgement.

## Before production
- Configure Firebase Authentication
- Configure Firestore
- Replace placeholder Firestore rules with role-aware rules
- Configure Google Calendar API
- Store sensitive credentials using secret management
- Implement Calendar create/update/delete functions
