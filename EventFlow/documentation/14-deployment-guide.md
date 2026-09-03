# Deployment Guide

## Prerequisites
- Firebase project and web app
- Google Authentication enabled
- Firestore database
- Firebase CLI
- Node.js/npm
- Google Calendar API enabled
- Configured school Calendar

## Frontend Environment
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

Do not commit `.env`.

## Authentication
- Enable Google sign-in.
- Configure authorized domains.
- Verify approved active EventFlow-user enforcement.

## Firestore
- Create production database.
- Deploy Security Rules.
- Deploy indexes.
- Load initial activities and event types.
- Load approved staff, students, vehicles, and users.

## Cloud Functions
Deploy functions for:
- Calendar create
- Calendar update
- Calendar delete

Use secret management for sensitive credentials.

## Google Calendar
- Enable API.
- Configure server-side authorization.
- Configure school Calendar ID securely.
- Test create/update/delete.

## Frontend
Run:
```bash
npm run build
```
Resolve all errors before deployment.

## Hosting
Deploy using selected hosting. Firebase Hosting is suitable but not required by product requirements.

## Post-Deployment Validation
Validate authentication, permissions, CRUD, assignments, search, dashboard, Calendar, and mobile layout. For the CR-001 Depart milestone, run transportation/Depart/concurrency tests, Rules policy and cloud compilation, production build, migration/isolation/reset safeguards, and `git diff --check`; then deploy only Firestore Rules if changed. Manually validate snapshot accuracy, zero-write cancellation/failure, first/later event transitions, warnings, stale reviews, total-seat capacity, and driver reconciliation. Do not deploy Hosting, Functions, indexes, or create operational test data for this milestone. WhatsApp is post-MVP.

For Arrive at Event, additionally validate exact `departed -> arrived_at_event`, request-time/user audit fields, stale/duplicate denial, preservation of event/departure/participant/return state, action visibility, and absence of Start Return. Combine this with deferred Depart manual UAT before authorizing the next lifecycle milestone.

For the return milestone, run return-planning/Start Return/correction/concurrency tests, executable Firestore emulator tests, Rules policy/cloud compilation, full regression suites, TypeScript and production builds, and `git diff --check`. Deploy Firestore Rules only; do not deploy Hosting, Functions, indexes, or operational data. Manually gate Returned work on accepted UAT for ordinary return edits, warning-confirmed Start Return, immutable snapshots, and audited post-start corrections.

The return-milestone Rules were deployed to `eventflow-612ed` on 2026-08-20 as ruleset `e8a29a89-d4bc-4413-a094-d9eae4365212` after warning-free cloud compilation and executable Java 21 emulator verification. No Functions, indexes, Hosting, or operational data were deployed.

## Rollback
Maintain:
- Last known-good release/tag
- Previous Firestore rules
- Manual event process as temporary pilot fallback
