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
- User-initiated WhatsApp preview, explicit Copy, and best-effort Open behavior (when CR-001 is implemented)

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
Validate authentication, permissions, CRUD, assignments, search, dashboard, Calendar, and mobile layout. When CR-001 is implemented, also validate snapshots, lifecycle/status transactions, bounded Staff return editing, total-seat capacity, settings permissions, and WhatsApp handoff without delivery claims.

## Rollback
Maintain:
- Last known-good release/tag
- Previous Firestore rules
- Manual event process as temporary pilot fallback
