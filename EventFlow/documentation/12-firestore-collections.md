# Firestore Collections

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
