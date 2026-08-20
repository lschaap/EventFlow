# Firestore Collections

> Current CR-001 rule target: active approved Admin and Staff users may plan transportation and atomically Depart an eligible vehicle. Rules permit only the `planned -> departed` lifecycle transition, its return initialization, and its first-depart event transition; later stages remain denied. Admin-only master-data, user, and transportation-settings permissions are unchanged.

## Strategy
Use top-level collections to support cross-event queries and avoid deeply nested data access.

## `users/{userId}`
```json
{
  "email": "staff@example.org",
  "staffId": "staff_123",
  "role": "staff",
  "active": true,
  "createdAt": "Timestamp",
  "lastLoginAt": "Timestamp"
}
```

## `staff/{staffId}`
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "displayName": "Jane Smith",
  "email": "jane@example.org",
  "roleTitle": "Teacher",
  "dietaryRestrictions": ["Example restriction"],
  "active": true,
  "canDrive": true,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## `students/{studentId}`
```json
{
  "firstName": "Alex",
  "lastName": "Student",
  "displayName": "Alex Student",
  "grade": 10,
  "active": true,
  "dietaryRestrictions": ["Example restriction"],
  "notes": null,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## `vehicles/{vehicleId}`
```json
{
  "vehicleId": "vehicle_123",
  "name": "School Van 1",
  "capacity": 8,
  "active": true,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## `activities/{activityId}`
```json
{
  "name": "Volleyball",
  "active": true,
  "sortOrder": 1,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

Use the deterministic document ID `eventId__staffId`. Active vehicle uniqueness within an event is checked by the client service; Firestore rules validate referenced records and transitions but do not query the collection to guarantee uniqueness.

## `eventTypes/{eventTypeId}`
```json
{
  "name": "Competition",
  "active": true,
  "sortOrder": 2,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## `events/{eventId}`
```json
{
  "name": "Regional Volleyball Competition",
  "activityId": "activity_volleyball",
  "eventTypeId": "type_competition",
  "status": "draft",
  "departureDateTime": "Timestamp",
  "returnDateTime": "Timestamp",
  "location": "Halifax",
  "purpose": "Regional competition",
  "mealsMissed": ["lunch", "dinner"],
  "equipmentNeeded": ["Jerseys", "Volleyballs"],
  "notes": null,
  "studentParticipantCount": 14,
  "staffParticipantCount": 2,
  "participantCount": 16,
  "hasDietaryRestrictions": true,
  "createdByUserId": "firebase_uid",
  "createdByUserName": "Example User",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp",
  "completedAt": null,
  "cancelledAt": null,
  "calendarEventId": null,
  "calendarSyncStatus": "not_synced",
  "calendarSyncError": null,
  "lastCalendarSyncAt": null
}
```

## `eventParticipants/{eventParticipantId}`
```json
{
  "eventId": "event_123",
  "studentId": "student_456",
  "status": "active",
  "addedByUserId": "firebase_uid",
  "addedAt": "Timestamp",
  "removedByUserId": null,
  "removedAt": null,
  "notes": null
}
```

Recommended duplicate-control strategy: deterministic ID such as `eventId_studentId` or transaction/query validation.

## `eventStaffParticipants/{eventStaffParticipantId}`
```json
{
  "eventId": "event_123",
  "staffId": "staff_789",
  "status": "active",
  "addedByUserId": "firebase_uid",
  "addedAt": "Timestamp",
  "removedByUserId": null,
  "removedAt": null,
  "notes": null
}
```

## `eventDrivers/{eventDriverId}`
Legacy compatibility collection. Production UI/services do not query or write it; only migration/reset tooling and temporary restrictive Rules compatibility remain.
```json
{
  "eventDriverId": "event_123__staff_driver",
  "eventId": "event_123",
  "staffId": "staff_driver",
  "vehicleId": "vehicle_123",
  "status": "assigned",
  "assignedByUserId": "firebase_uid",
  "assignedAt": "Timestamp",
  "removedByUserId": null,
  "removedAt": null,
  "notes": null
}
```

## Derived Event Fields
Stored on `events` for efficient rendering:
- studentParticipantCount
- staffParticipantCount
- participantCount
- hasDietaryRestrictions (active student or staff participant has a restriction)

Recalculate when active student or staff participant records change.

## Application Confirmation Transition

Confirmation updates the existing `events/{eventId}` document from `draft` to `confirmed` and updates only `status` and `updatedAt`. It requires structurally valid persisted event data. Creation audit fields, relationships, participant counts, dietary status, vehicle assignments, and Calendar fields remain unchanged. No confirmation-specific audit fields are currently defined.

New events are created in one write with `eventId` equal to the Firestore document ID; security rules protect that identity field from later changes.

## Historical Integrity
Do not delete master-data records merely because they become inactive. Use `active = false` so historical relationships remain resolvable.

## CR-001 Transportation Collections (In Implementation)

The schemas above include planning and the implemented Depart target. CR-001 still plans later lifecycle/correction extensions and operational rollout work:

- extend both participant collections with nullable `departureVehicleId`, `returnVehicleId`, and latest transport-correction metadata;
- use planned event status domain `draft | confirmed | in_progress | completed | cancelled` and add nullable `startedAt` (not currently deployed);
- replace `eventDrivers` with deterministic `eventVehicleTrips/{eventId__vehicleId}` documents containing active/removed state, the five-stage lifecycle, separate leg drivers, four server timestamps, and latest correction metadata;
- require Boolean `returnDriverMirrorsDeparture`; missing pre-field target records parse as false, while new/migrated records use true;
- add `settings/transportation` with `defaultReturnDestination` (initially `Mill Village`) and update metadata, managed in Admin Configuration > Vehicles;
- derive occupancy, capacity, and warnings; any post-MVP WhatsApp content remains unstored and outside MVP acceptance.

Before Depart, ordinary return fields mirror departure and cannot be independently edited; independent return-driver occupancy is preserved. Depart adds `departedByUserId` and `departureSnapshot` to the trip and may add `startedByUserId`/`startedByVehicleTripId` with `startedAt` to the event. Rules require request-time timestamps, immutable identities, valid drivers, snapshot shape/count consistency, driver/occupant consistency, field-bounded return initialization, and the atomic first/later event state. Departure planning fields for a departed vehicle are locked. Arrive/correction writes remain disabled. No new index or Cloud Function is required. The approved operational reset remains the baseline; no live legacy migration is required.

The Depart Rules were deployed to `eventflow-612ed` on 2026-08-19 as ruleset `4014d1a7-f011-48ce-83c1-39793c6ade77`.
