# Data Model

## users
- userId (PK)
- email
- staffId (nullable FK)
- role: `admin | staff`
- active
- createdAt
- lastLoginAt

## staff
- staffId (PK)
- firstName
- lastName
- displayName
- email
- roleTitle
- dietaryRestrictions[]
- active
- canDrive
- createdAt
- updatedAt

## students
- studentId (PK)
- firstName
- lastName
- displayName
- grade: number (6-12)
- active
- dietaryRestrictions[]
- notes
- createdAt
- updatedAt

## vehicles
- vehicleId (PK)
- name
- capacity
- active
- createdAt
- updatedAt

## activities
- activityId (PK)
- name
- active
- sortOrder
- createdAt
- updatedAt

Initial values:
- Volleyball
- Cross country
- Track and field
- Table tennis
- Badminton
- Basketball
- Other

## eventTypes
- eventTypeId (PK)
- name
- active
- sortOrder
- createdAt
- updatedAt

Initial values:
- Practice
- Competition
- Appointment
- School Sponsored Event
- PE Class Outing
- Classroom Outing
- Other

## events
- eventId (PK)
- name
- activityId (FK)
- eventTypeId (FK)
- status: `draft | confirmed | completed | cancelled`
- departureDateTime
- returnDateTime
- location
- purpose
- mealsMissed[]
- equipmentNeeded[]
- notes
- studentParticipantCount
- staffParticipantCount
- participantCount
- hasDietaryRestrictions (derived from active student and staff participants)
- createdByUserId (FK)
- createdByUserName
- createdAt
- updatedAt
- completedAt
- cancelledAt
- calendarEventId
- calendarSyncStatus: `not_synced | pending | synced | failed`
- calendarSyncError
- lastCalendarSyncAt

Allowed meals:
- breakfast
- lunch
- snack
- dinner

## eventParticipants
Student-event relationship:
- `departureVehicleId` and `returnVehicleId` are nullable active-planned-trip vehicle references; missing legacy fields parse as null.
- eventParticipantId (PK)
- eventId (FK)
- studentId (FK)
- status: `active | removed`
- addedByUserId (FK)
- addedAt
- removedByUserId (nullable FK)
- removedAt
- notes

## eventStaffParticipants
Staff-event participant relationship:
- `departureVehicleId` and `returnVehicleId` are nullable active-planned-trip vehicle references; missing legacy fields parse as null.
- eventStaffParticipantId (PK)
- eventId (FK)
- staffId (FK)
- status: `active | removed`
- addedByUserId (FK)
- addedAt
- removedByUserId (nullable FK)
- removedAt
- notes

## eventDrivers
Legacy driver/vehicle relationship retained only for migration inspection and reset compatibility. Production UI and services no longer read or write this collection:
- eventDriverId (PK)
- eventId (FK)
- staffId (FK)
- vehicleId (nullable FK)
- status: `assigned | removed`
- assignedByUserId (FK)
- assignedAt
- removedByUserId (nullable FK)
- removedAt
- notes

Use one deterministic document per event/staff combination: `eventId__staffId`.

## Derived Event Fields
Stored on events for efficient rendering:
- studentParticipantCount
- staffParticipantCount
- participantCount
- hasDietaryRestrictions

Recalculate when active student or staff participant records change.

## Approved Planned Transportation Model (CR-001)

The implemented CR-001 Depart milestone uses event status domain `draft | confirmed | in_progress | completed | cancelled`. `events` includes nullable `startedAt`, `startedByUserId`, and `startedByVehicleTripId`; participant collections include nullable `departureVehicleId` and `returnVehicleId`. Later lifecycle correction metadata remains planned.

The return milestone adds nullable `returnStartedByUserId` and `originalReturnSnapshot` to each trip. The snapshot records vehicle/driver identities and historical names, student/staff identity/name lists, counts, capacity/overcapacity, configured destination, and Start Return user/time. It is created once during `arrived_at_event -> return_started` and is immutable afterward. Participant `returnVehicleId` remains the effective roster; optional `latestReturnCorrectionId` links a post-start change to its append-only audit operation.

`returnRosterCorrections/{generatedOperationId}` stores event ID, correction type, correcting user/server time, and a keyed `changes` map of up to 100 participant changes. Each entry stores participant type/ID/historical name, previous/corrected vehicle or Unassigned, source/destination trip IDs, and any cleared return-driver trip. Operation documents are append-only and are removed only by an explicitly approved operational reset/retention process.

The planned `eventVehicleTrips/{eventId__vehicleId}` aggregate replaces `eventDrivers`. It stores `eventId`, `vehicleId`, `assignmentStatus`, the five-stage lifecycle, independent departure and return driver staff IDs, the four lifecycle timestamps, creation/update metadata, and latest-correction metadata. This makes the vehicle trip—not a driver assignment—the lifecycle owner while preserving one driver per vehicle per leg.

`returnDriverMirrorsDeparture` is required Boolean state. New and migrated planned trips use `true`. Explicit return-driver selection/clear sets it to `false`; Same as departure restores `true` and copies the departure driver atomically. Depart ends mirroring after reconciling the initial return assignments and persists the independent departure snapshot.

Before departure, return assignments mirror departure without independent editing. Depart atomically snapshots return assignments for that vehicle's occupants. Subsequent return changes do not mutate departure history or get silently overwritten by departure corrections. Latest correction fields overwrite on a later correction and are not full history.

The implemented `departureSnapshot` map contains immutable vehicle/driver IDs and historical labels; typed student/staff occupant ID and display-name arrays; student, staff, and total counts; vehicle capacity; and the over-capacity result. `departedAt` is the authoritative snapshot time and `departedByUserId` identifies the confirming user.

Arrive at Event advances only `departed -> arrived_at_event`, recording server `arrivedAtEventAt` and `arrivedAtEventByUserId`. All departure snapshot/audit data, drivers, assignments, and event-start fields remain unchanged. Missing nullable audit fields on pre-milestone planned records are tolerated until their next lifecycle transition backfills the complete schema.

`settings/transportation` stores `defaultReturnDestination`, initially `Mill Village`, plus update metadata and is surfaced in Admin Configuration > Vehicles. Counts, occupancy, capacity, and warnings remain derived. Capacity means total seats including the driver. Post-MVP WhatsApp messages, edits, handoffs, and delivery state are not stored.

For each active trip, a non-null departure driver must match the staff participant's `departureVehicleId`, and a non-null return driver must match `returnVehicleId`. An occupant move that would break this invariant clears the disclosed applicable role in the same transaction; mirrored departure consequences remain internally consistent.

Migration and atomic-write boundaries are defined in [CR-001](change-requests/CR-001-transportation-trip-lifecycle.md). No live migration or reset has been applied.

## Relationships

```text
EVENTS
  ├── EVENT_PARTICIPANTS ─────── STUDENTS
  ├── EVENT_STAFF_PARTICIPANTS ─ STAFF
  ├── EVENT_DRIVERS ───────────── STAFF
  │                                 └── VEHICLES
  ├── ACTIVITIES
  └── EVENT_TYPES

USERS ── STAFF
```
