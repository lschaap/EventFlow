# Architecture

## Logical MVP Architecture

```text
Admin / Staff
      │
      ▼
React + TypeScript + Vite
      │
      ├── Firebase Authentication
      │
      └── Firestore
              │
              ▼
      Firebase Cloud Functions
          │             │
          ▼             ▼
Google Calendar API   Email Delivery
```

## Data Flow

```text
User
  ↓
React UI
  ↓
Firestore
  ↓
Server-side trigger / callable function
  ↓
Cloud Function
  ↓
External integration
  ↓
Firestore sync-status update
```

## Responsibilities

### React Client
- Mobile-first UI
- Authentication state
- Event forms/views
- Admin master-data screens
- Participant/driver assignments
- Search/filtering
- Dashboard
- Client-side validation

### Firebase Authentication
- Google sign-in
- Session
- Firebase identity

### Firestore
System of record for:
users, staff, students, vehicles, activities, eventTypes, events, eventParticipants, eventStaffParticipants, eventDrivers.

### Cloud Functions
- Calendar create/update/delete
- Plain-text confirmation email
- Future server-side automation

### Google Calendar
External synchronized representation of confirmed events.

## Principles
- Firestore is source of truth.
- Browser holds no privileged Google credentials.
- Calendar operations are idempotent.
- Integration failures are recorded without losing EventFlow data.
- MVP avoids unnecessary infrastructure.
- AI is deferred.

## Environment Configuration
Public Firebase web configuration may be in frontend environment variables. Sensitive credentials belong in server-side secret management.
