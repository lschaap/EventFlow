# Firebase

This folder contains backend configuration and Cloud Functions.

The CR-001 vehicle-trip foundation includes a dry-run-first legacy migration. See `../documentation/migrations/CR-001-legacy-event-drivers.md`. Do not apply without a backup, reviewed report, explicit project ID, and confirmation token.

## Before production
- Configure Firebase Authentication
- Configure Firestore
- Replace placeholder Firestore rules with role-aware rules
- Configure Google Calendar API
- Store sensitive credentials using secret management
- Implement Calendar create/update/delete functions
