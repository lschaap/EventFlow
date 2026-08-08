# Deployment Guide

## Prerequisites
- Firebase project and web app
- Google Authentication enabled
- Firestore database
- Firebase CLI
- Node.js/npm
- Google Calendar API enabled
- Configured school Calendar
- Server-side email delivery mechanism selected

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
- Confirmation email

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
Validate authentication, permissions, CRUD, assignments, search, dashboard, Calendar, email, and mobile layout.

## Rollback
Maintain:
- Last known-good release/tag
- Previous Firestore rules
- Manual event process as temporary pilot fallback
