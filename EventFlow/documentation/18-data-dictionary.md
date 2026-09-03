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
| dietaryRestrictions | string[] | Dietary restrictions |
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
| capacity | number | Total available seats, including the driver's seat |
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
| status | enum | draft/confirmed/in_progress/completed/cancelled |
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
| hasDietaryRestrictions | boolean | Any active student or staff participant has restriction |
| createdByUserId | string | Creator user |
| createdByUserName | string | Creator display name |
| createdAt | timestamp | Creation |
| updatedAt | timestamp | Last update |
| startedAt | timestamp/null | First actual vehicle departure time |
| startedByUserId | string/null | UID confirming the first vehicle departure |
| startedByVehicleTripId | string/null | Trip that first moved the event to in_progress |
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
| departureVehicleId | string/null | Active planned outbound vehicle; missing field parses as null |
| returnVehicleId | string/null | Active planned return vehicle; pre-Depart mirror except for an independent return driver; missing field parses as null |
| latestReturnCorrectionId | string/null | Most recent append-only return-roster correction operation affecting this participant |

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
| departureVehicleId | string/null | Active planned outbound vehicle; missing field parses as null |
| returnVehicleId | string/null | Active planned return vehicle; pre-Depart mirror except for an independent return driver; missing field parses as null |
| latestReturnCorrectionId | string/null | Most recent append-only return-roster correction operation affecting this participant |

## eventDrivers
Legacy compatibility data only. Production application code no longer reads or writes these records; fields remain documented for migration inspection and the approved reset procedure.
| Field | Type | Description |
|---|---|---|
| eventDriverId | string | Driver-event relationship key |
| eventId | string | Event FK |
| staffId | string | Staff driver FK |
| vehicleId | string/null | Optional vehicle FK |
| status | enum | assigned/removed |
| assignedByUserId | string | User who assigned |
| assignedAt | timestamp | Assignment time |
| removedByUserId | string/null | User who removed |
| removedAt | timestamp/null | Removal time |
| notes | string/null | Optional notes |

## Approved Planned Transportation Fields (CR-001)

Vehicle-trip/settings definitions now have foundation types/services and undeployed Rules/index configuration. They are not released or populated by this milestone; participant additions and lifecycle behavior remain planned.

### Participant collection additions

| Field | Type | Description |
|---|---|---|
| departureVehicleId | string/null | Vehicle used for departure |
| returnVehicleId | string/null | Vehicle used for return |
| transportCorrectedAt | timestamp/null | Server time of latest assignment correction |
| transportCorrectedByUserId | string/null | Admin UID for latest assignment correction |
| transportCorrectionReason | string/null | Required latest correction reason |

Before departure, `returnVehicleId` mirrors `departureVehicleId`. Depart creates the independent return snapshot. Subsequent permitted return edits do not change departure. Latest correction fields are overwritten by subsequent corrections and do not constitute full audit history.

### eventVehicleTrips

| Field | Type | Description |
|---|---|---|
| eventVehicleTripId | string | Deterministic `eventId__vehicleId` key |
| eventId | string | Event FK |
| vehicleId | string | Vehicle FK |
| assignmentStatus | enum | `active` or `removed` |
| stage | enum | `planned`, `departed`, `arrived_at_event`, `return_started`, or `returned` |
| departureDriverStaffId | string/null | Departure driver FK |
| returnDriverStaffId | string/null | Return driver FK |
| returnDriverMirrorsDeparture | boolean | True while departure changes must atomically copy to return; explicit return selection/clear sets false |
| departedAt | timestamp/null | Server departure time |
| departedByUserId | string/null | UID that confirmed Depart |
| departureSnapshot | map/null | Immutable vehicle/driver labels and IDs, typed occupant IDs/names, counts, capacity, and over-capacity result confirmed at departure |
| arrivedAtEventAt | timestamp/null | Server event-arrival time |
| arrivedAtEventByUserId | string/null | UID that confirmed Arrive at Event |
| returnStartedAt | timestamp/null | Server return-start time |
| returnStartedByUserId | string/null | Authenticated user who confirmed original Start Return |
| originalReturnSnapshot | map/null | Immutable vehicle, driver, occupant IDs/names, counts, capacity result, destination, and Start Return audit |
| returnedAt | timestamp/null | Server returned time |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update time |
| correctedAt | timestamp/null | Server time of latest trip correction |
| correctedByUserId | string/null | Admin UID for latest trip correction |
| correctionReason | string/null | Required latest correction reason |

### returnRosterCorrections

| Field | Type | Meaning |
|---|---|---|
| correctionId | string | Generated operation/document ID |
| eventId | string | Corrected event |
| correctionType | string | `return_roster_assignment` |
| correctedByUserId | string | Authenticated correcting user |
| correctedAt | timestamp | Server-authoritative correction time |

### returnDriverCorrections

| Field | Type | Meaning |
|---|---|---|
| correctionId | string | Generated immutable correction/document ID |
| eventId | string | Owning event |
| tripId | string | Deterministic affected trip ID |
| vehicleId | string | Affected vehicle |
| previousReturnDriverStaffId | string/null | Previous effective driver |
| correctedReturnDriverStaffId | string/null | New effective driver or cleared assignment |
| correctedByUserId | string | Authenticated correcting user |
| correctedAt | timestamp | Server-authoritative correction time |
| correctionType | string | `return_driver_assignment` |

| changes | map | 1–100 entries keyed by `participantType__participantId` |

Each change contains participant type/ID/historical display name, previous and corrected return vehicle IDs (nullable for Return Unassigned), source/destination trip IDs, and nullable cleared return-driver trip ID. History is append-only. Current participant `returnVehicleId` is the effective roster; `latestReturnCorrectionId` links to the most recent operation without replacing earlier history.

### settings/transportation

| Field | Type | Description |
|---|---|---|
| defaultReturnDestination | string | Default destination, initially `Mill Village` |
| updatedAt | timestamp | Server update time |
| updatedByUserId | string | Admin UID that updated the setting |

The setting is administered in Admin Configuration > Vehicles and readable by Staff where operationally required.

### events additions and planned status

| Field | Type | Description |
|---|---|---|
| status | enum | Planned domain: draft/confirmed/in_progress/completed/cancelled; implemented baseline does not yet include in_progress |
| startedAt | timestamp/null | Server time the event effectively entered in_progress |

Vehicle `capacity` means total available seats including the driver's seat.
