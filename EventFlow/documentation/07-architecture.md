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
Google Calendar API   User-initiated WhatsApp handoff
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
- Editable WhatsApp preparation with explicit Copy and best-effort Open WhatsApp

### Firebase Authentication
- Google sign-in
- Session
- Firebase identity

### Firestore
System of record for:
users, staff, students, vehicles, activities, eventTypes, events, eventParticipants, eventStaffParticipants, eventDrivers.

### Cloud Functions
- Calendar create/update/delete
- Future server-side automation

### Google Calendar
External synchronized representation of confirmed events.

## Principles

### Grouped transportation planning milestone

Active approved Admin and Staff users manage planned transportation for every event through focused Firestore services. Participant relationships carry nullable per-leg vehicle IDs. Mixed student/staff bulk movement is capped at 100 relationships, validates every target, and commits in one transaction. Vehicle groups, Unassigned groups, occupancy, and capacity warnings are derived rather than stored. Master-data and settings services remain Admin-only; lifecycle transitions are not activated in this milestone.

Individual and bulk movement use field-bounded Firestore client transactions protected by Rules. Bulk movement validates up to 100 active relationships and the planned destination, preserves independent-return-driver assignments, and commits all participant changes atomically. The dedicated transportation-only Staff rule avoids distinct staff-master reads so mixed bulk writes remain within Rules access limits and do not require the Blaze plan or Cloud Functions.
- Firestore is source of truth.
- Browser holds no privileged Google credentials.
- Calendar operations are idempotent.
- Integration failures are recorded without losing EventFlow data.
- MVP avoids unnecessary infrastructure.
- AI is deferred.

## Environment Configuration
Public Firebase web configuration may be in frontend environment variables. Sensitive credentials belong in server-side secret management.

## Approved Planned Transportation Architecture (CR-001)

The implemented baseline uses `eventDrivers`. CR-001 replaces that relationship in the target architecture with deterministic `eventVehicleTrips/{eventId__vehicleId}` aggregates containing the vehicle lifecycle, separate leg drivers, timestamps, active/removed state, and latest correction metadata. Existing participant collections gain departure and return vehicle IDs. `settings/transportation` stores the default return destination.

Firestore remains authoritative. Transactions couple driver/participant occupancy, Depart return snapshots, participant removal, lifecycle/event-status changes, bounded return edits, corrections, and eligible future cleanup. Rules mirror Admin planning permissions, Staff/Admin forward actions, and Staff return-passenger edits only after Depart and before Start Return. Composite indexes are finalized with implementation queries.

WhatsApp is a client-side, user-initiated handoff from Event Details and replaces confirmation email in target MVP. Copy explicitly copies; Open WhatsApp is best-effort, leaves the preview visible, and provides Copy guidance. There is no messaging backend, launch/delivery detection, credential, recipient directory, state record, or Business API integration.

See [CR-001](change-requests/CR-001-transportation-trip-lifecycle.md) for the authoritative boundaries and migration plan.
