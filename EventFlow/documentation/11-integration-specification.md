# Integration Specification

## 1. Firebase Authentication

### Purpose
Authenticate users through Google and establish Firebase identity.

### Access Decision
Authentication alone does not grant EventFlow access. A user must:
- Authenticate successfully.
- Have an EventFlow `users` record.
- Have `active = true`.

### Roles
- admin
- staff

## 2. Firestore

### Purpose
Primary EventFlow system of record.

### Collections
- users
- staff
- students
- vehicles
- activities
- eventTypes
- events
- eventParticipants
- eventStaffParticipants
- eventDrivers

### Access
Normal CRUD may occur through the authenticated frontend subject to Firestore Security Rules and role permissions.

## 3. Google Calendar API

Implementation status: pending. Application confirmation currently leaves Calendar fields unchanged and does not call Google Calendar.

### Purpose
Represent confirmed EventFlow events on the configured school Google Calendar.

### Security
Calendar operations execute server-side. Privileged credentials or tokens must not be stored in frontend source.

### Create

Trigger:
```text
event.status changes to confirmed
AND calendarEventId is null
```

Flow:
```text
calendarSyncStatus = pending
        ↓
Create event in school calendar
        ↓
Success:
calendarEventId = returned ID
calendarSyncStatus = synced
lastCalendarSyncAt = timestamp
calendarSyncError = null

Failure:
calendarSyncStatus = failed
calendarSyncError = concise error summary
Firestore event remains intact
```

### Update

Trigger:
```text
Confirmed event changes
AND calendarEventId exists
```

Action:
- Update the existing Calendar event.
- Do not create a replacement event as fallback.
- Preserve `calendarEventId`.
- Update sync status.

### Delete

Trigger:
```text
event.status changes to cancelled
AND calendarEventId exists
```

Success:
- Delete linked Calendar event.
- Set `calendarEventId = null`.
- Set `calendarSyncStatus = not_synced`.

Failure:
- Preserve EventFlow event.
- Set `calendarSyncStatus = failed`.
- Store error summary.

### Calendar Payload
- Event name
- Location
- Departure date/time
- Return date/time
- Purpose
- Participant count
- Participant names
- Student grades
- Staff participants
- Drivers
- Vehicles
- Meals missed
- Dietary-restriction indicator
- Equipment needed
- Notes

Detailed dietary restriction information must not be copied into Google Calendar. Use only:
```text
Dietary restrictions present: Yes/No
```

### Idempotency
Synchronization must use stored `calendarEventId` to prevent duplicate events.

## 4. Email Notification

Implementation status: pending. Application confirmation currently sends no email.

### MVP Requirement
Send a plain-text email when an event is confirmed.

### Delivery
Email should be initiated server-side. The specific provider/mechanism may be selected during implementation.

### Recommended Content
- Event name
- Status
- Location
- Departure
- Return
- Participant count
- Drivers
- Vehicles
- Meals missed
- Link to EventFlow event

## 5. Future Integrations
Future integrations are documented in `16-future-roadmap.md` and are not part of MVP.
