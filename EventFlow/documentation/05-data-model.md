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
