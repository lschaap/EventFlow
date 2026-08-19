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
Driver/vehicle relationship; all drivers are staff:
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

The structures above are the implemented baseline. For CR-001, the planned event status domain is `draft | confirmed | in_progress | completed | cancelled`; `events` adds nullable `startedAt`; and participant collections add nullable `departureVehicleId`, `returnVehicleId`, and latest-correction metadata. `in_progress` and `startedAt` are not currently deployed.

The planned `eventVehicleTrips/{eventId__vehicleId}` aggregate replaces `eventDrivers`. It stores `eventId`, `vehicleId`, `assignmentStatus`, the five-stage lifecycle, independent departure and return driver staff IDs, the four lifecycle timestamps, creation/update metadata, and latest-correction metadata. This makes the vehicle trip—not a driver assignment—the lifecycle owner while preserving one driver per vehicle per leg.

`returnDriverMirrorsDeparture` is required Boolean state. New and migrated planned trips use `true`. Explicit return-driver selection/clear sets it to `false`; Same as departure restores `true` and copies the departure driver atomically. Missing legacy target fields parse safely as `false` because equality alone does not prove intent. Future Depart will synchronize a true mirror and then snapshot it as false; that action is not implemented yet.

Before departure, return assignments mirror departure without independent editing. Depart atomically snapshots return assignments for that vehicle's occupants. Subsequent return changes do not mutate departure history or get silently overwritten by departure corrections. Latest correction fields overwrite on a later correction and are not full history.

`settings/transportation` stores `defaultReturnDestination`, initially `Mill Village`, plus update metadata and is surfaced in Admin Configuration > Vehicles. WhatsApp messages, edits, handoffs, and delivery state are not stored. Counts, occupancy, capacity, warnings, and message content remain derived. Capacity means total seats including the driver.

Migration and atomic-write boundaries are defined in [CR-001](change-requests/CR-001-transportation-trip-lifecycle.md). They are planned and have not been applied to Firestore.

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
