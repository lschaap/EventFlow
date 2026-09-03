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
Google Calendar API   Post-MVP user-initiated WhatsApp handoff
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
- Post-MVP editable WhatsApp preparation with explicit Copy and best-effort Open WhatsApp

### Firebase Authentication
- Google sign-in
- Session
- Firebase identity

### Firestore
System of record for:
users, staff, students, vehicles, activities, eventTypes, events, eventParticipants, eventStaffParticipants, and eventVehicleTrips. `eventDrivers` is legacy migration/reset input only and is isolated from production application behavior.

### Cloud Functions
- Calendar create/update/delete
- Future server-side automation

### Google Calendar
External synchronized representation of confirmed events.

## Principles

### Grouped transportation planning milestone

Active approved Admin and Staff users manage planned transportation for every event through focused Firestore services. Participant relationships carry nullable per-leg vehicle IDs. Mixed student/staff bulk movement is capped at 100 relationships, validates every target, and commits in one transaction. Vehicle groups, Unassigned groups, occupancy, and capacity warnings are derived rather than stored. Master-data and settings services remain Admin-only; lifecycle transitions are not activated in this milestone.

Individual and bulk movement use field-bounded Firestore client transactions protected by Rules. Bulk movement validates up to 100 active relationships and the planned destination, preserves independent-return-driver assignments, and commits all participant changes atomically. The dedicated transportation-only Staff rule avoids distinct staff-master reads so mixed bulk writes remain within Rules access limits and do not require the Blaze plan or Cloud Functions.

The Events list uses a bounded eight-query page load: events, activities, event types, active target trips, active student relationships, active staff relationships, staff masters, and vehicle masters. Query count is constant rather than per event. The MVP loads the complete event list; pagination and event-ID chunking are the future optimization path when event volume warrants them.
- Firestore is source of truth.
- Browser holds no privileged Google credentials.
- Calendar operations are idempotent.
- Integration failures are recorded without losing EventFlow data.
- MVP avoids unnecessary infrastructure.
- AI is deferred.

## Environment Configuration
Public Firebase web configuration may be in frontend environment variables. Sensitive credentials belong in server-side secret management.

## Approved Planned Transportation Architecture (CR-001)

The Depart slice is implemented as a direct Firestore client transaction. A read-only review is followed by a transaction that re-reads the event, vehicle, target trip, every active participant relationship and master label used by the snapshot, and all active trips. A review token rejects material assignment, driver, capacity, warning-count, or event-state changes. One commit initializes reconciled return fields, stores the snapshot/audit fields, advances the trip, and starts the event when applicable. Firestore Rules independently enforce the same `planned -> departed` boundary with `getAfter()` checks. No Cloud Function, generalized movement collection, or new index is used.

Arrive at Event follows the same client-transaction pattern with a smaller boundary: review event/vehicle/snapshot departure facts, re-read event/trip/vehicle, reject a changed review token, and update only trip stage plus server arrival timestamp/audit UID. The event and participants are read/preserved rather than written. Rules require the unchanged `in_progress` event and exact `departed -> arrived_at_event` field diff.

Return planning uses the existing participant relationship fields and grouped client UI. Ordinary return moves are atomic and target only active departed/arrived trips. Start Return re-reads event, trip, vehicle, driver, and every reviewed active relationship, then stores an immutable original snapshot and exact lifecycle audit fields. Post-start changes are append-only correction operations in `returnRosterCorrections`: one generated operation document contains a keyed map of up to 100 changes, and each changed participant stores the operation ID. Rules use `getAfter()` to require that linkage while keeping the operation inside Firestore access limits. No Cloud Function or new index is required.

The implemented baseline uses `eventDrivers`. CR-001 replaces that relationship in the target architecture with deterministic `eventVehicleTrips/{eventId__vehicleId}` aggregates containing the vehicle lifecycle, separate leg drivers, timestamps, active/removed state, and latest correction metadata. Existing participant collections gain departure and return vehicle IDs. `settings/transportation` stores the default return destination.

Firestore remains authoritative. Transactions couple driver/participant occupancy, Depart return snapshots, participant removal, lifecycle/event-status changes, bounded return edits, corrections, and eligible future cleanup. Rules mirror Admin planning permissions, Staff/Admin forward actions, and Staff return-passenger edits only after Depart and before Start Return. Composite indexes are finalized with implementation queries.

WhatsApp is deferred beyond MVP. The preserved future architecture is a client-side, user-initiated handoff from Event Details: Copy explicitly copies and Open WhatsApp is best-effort. There is no MVP messaging backend, API, paid integration, launch/delivery detection, credential, recipient directory, or state record. Transportation lifecycle behavior is independent of messaging.

See [CR-001](change-requests/CR-001-transportation-trip-lifecycle.md) for the authoritative boundaries and migration plan.
# Return stabilization architecture

Once return begins anywhere in an event, the client treats every later passenger reassignment as an audited correction, preventing source-stage changes from reverting the UI to ordinary mode. Effective driver changes use a bounded transaction over one trip and one append-only correction record; cross-vehicle driver conflicts are blocked rather than expanded into a Rules-heavy multi-trip operation.
