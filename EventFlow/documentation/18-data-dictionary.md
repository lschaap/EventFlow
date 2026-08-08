# Data Dictionary

## users
| Field | Type | Description |
|---|---|---|
| userId | string | EventFlow/Firebase-linked user key |
| email | string | User email |
| staffId | string/null | Optional staff relationship |
| role | enum | `admin` or `staff` |
| active | boolean | Whether user may access EventFlow |
| createdAt | timestamp | Record creation |
| lastLoginAt | timestamp/null | Most recent login |

## staff
| Field | Type | Description |
|---|---|---|
| staffId | string | Unique staff key |
| firstName | string | First name |
| lastName | string | Last name |
| displayName | string | UI name |
| email | string | Staff email |
| roleTitle | string | School title |
| active | boolean | Available for new assignments |
| canDrive | boolean | Eligible as driver |
| createdAt | timestamp | Creation |
| updatedAt | timestamp | Last update |

## students
| Field | Type | Description |
|---|---|---|
| studentId | string | Unique student key |
| firstName | string | First name |
| lastName | string | Last name |
| displayName | string | UI name |
| grade | number | Grade 6-12 |
| active | boolean | Available for new assignments |
| dietaryRestrictions | string[] | Dietary restrictions |
| notes | string/null | Optional notes |
| createdAt | timestamp | Creation |
| updatedAt | timestamp | Last update |

## vehicles
| Field | Type | Description |
|---|---|---|
| vehicleId | string | Unique vehicle key |
| name | string | Vehicle name |
| capacity | number | Passenger capacity |
| active | boolean | Available for assignment |
| createdAt | timestamp | Creation |
| updatedAt | timestamp | Last update |

## activities
| Field | Type | Description |
|---|---|---|
| activityId | string | Unique key |
| name | string | Activity label |
| active | boolean | Available for selection |
| sortOrder | number | UI ordering |
| createdAt | timestamp | Creation |
| updatedAt | timestamp | Last update |

## eventTypes
| Field | Type | Description |
|---|---|---|
| eventTypeId | string | Unique key |
| name | string | Event-type label |
| active | boolean | Available for selection |
| sortOrder | number | UI ordering |
| createdAt | timestamp | Creation |
| updatedAt | timestamp | Last update |

## events
| Field | Type | Description |
|---|---|---|
| eventId | string | Unique event key |
| name | string | Event name |
| activityId | string | Activity FK |
| eventTypeId | string | Event-type FK |
| status | enum | draft/confirmed/completed/cancelled |
| departureDateTime | timestamp | Departure |
| returnDateTime | timestamp | Expected return |
| location | string | Destination/location |
| purpose | string | Event purpose |
| mealsMissed | string[] | breakfast/lunch/snack/dinner |
| equipmentNeeded | string[] | Equipment list |
| notes | string/null | Event notes |
| studentParticipantCount | number | Derived active student count |
| staffParticipantCount | number | Derived active staff count |
| participantCount | number | Derived total count |
| hasDietaryRestrictions | boolean | Any active student has restriction |
| createdByUserId | string | Creator user |
| createdByUserName | string | Creator display name |
| createdAt | timestamp | Creation |
| updatedAt | timestamp | Last update |
| completedAt | timestamp/null | Completion |
| cancelledAt | timestamp/null | Cancellation |
| calendarEventId | string/null | Linked Calendar event |
| calendarSyncStatus | enum | not_synced/pending/synced/failed |
| calendarSyncError | string/null | Latest sync error |
| lastCalendarSyncAt | timestamp/null | Latest successful sync |

## eventParticipants
| Field | Type | Description |
|---|---|---|
| eventParticipantId | string | Student-event relationship key |
| eventId | string | Event FK |
| studentId | string | Student FK |
| status | enum | active/removed |
| addedByUserId | string | User who added |
| addedAt | timestamp | Add time |
| removedByUserId | string/null | User who removed |
| removedAt | timestamp/null | Removal time |
| notes | string/null | Optional notes |

## eventStaffParticipants
| Field | Type | Description |
|---|---|---|
| eventStaffParticipantId | string | Staff-event relationship key |
| eventId | string | Event FK |
| staffId | string | Staff FK |
| status | enum | active/removed |
| addedByUserId | string | User who added |
| addedAt | timestamp | Add time |
| removedByUserId | string/null | User who removed |
| removedAt | timestamp/null | Removal time |
| notes | string/null | Optional notes |

## eventDrivers
| Field | Type | Description |
|---|---|---|
| eventDriverId | string | Driver-event relationship key |
| eventId | string | Event FK |
| staffId | string | Staff driver FK |
| vehicleId | string/null | Optional vehicle FK |
| role | enum/null | primary/secondary/null |
| status | enum | assigned/removed |
| assignedByUserId | string | User who assigned |
| assignedAt | timestamp | Assignment time |
| removedByUserId | string/null | User who removed |
| removedAt | timestamp/null | Removal time |
| notes | string/null | Optional notes |
