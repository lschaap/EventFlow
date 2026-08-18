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

## Approved Planned Transportation Architecture (CR-001)

The implemented baseline uses `eventDrivers`. CR-001 replaces that relationship in the target architecture with deterministic `eventVehicleTrips/{eventId__vehicleId}` aggregates containing the vehicle lifecycle, separate leg drivers, timestamps, active/removed state, and latest correction metadata. Existing participant collections gain departure and return vehicle IDs. `settings/transportation` stores the default return destination.

Firestore remains authoritative. Transactions couple driver/participant occupancy, participant removal, lifecycle/event-status changes, corrections, and eligible future cleanup during vehicle deactivation. Firestore Rules must mirror Admin planning permissions and Staff forward-operation permissions. Composite indexes are finalized with the implementation queries.

WhatsApp remains a client-side, user-initiated handoff from Event Details. EventFlow generates editable text and opens WhatsApp or copies to the clipboard; there is no messaging backend, credential, recipient directory, delivery record, or Business API integration.

See [CR-001](change-requests/CR-001-transportation-trip-lifecycle.md) for the authoritative boundaries and migration plan.
