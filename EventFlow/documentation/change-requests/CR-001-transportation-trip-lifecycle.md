# CR-001: Transportation Trip Lifecycle

## Record

| Field | Value |
|---|---|
| State | Approved for implementation |
| Decision date | 2026-08-18 |
| Scope | Transportation planning, vehicle trip execution, participant assignments, capacity review, and user-initiated WhatsApp handoff |
| Current implementation | Event-level vehicle/driver assignment and capacity warnings exist; the per-leg model and trip lifecycle described here do not |

## Problem

EventFlow currently associates a staff driver and an optional vehicle with an event, but it does not represent who rides in each vehicle on each leg or the operational progress of each vehicle. The target must support distinct departure and return plans, safe operational actions, accurate capacity review, narrowly controlled corrections, and staff-ready message preparation without adding automated messaging.

## Scope

- A five-stage lifecycle for every active event vehicle trip.
- Separate departure and return vehicle assignments for active student and staff participants.
- Separate departure and return drivers, with one active driver per vehicle per leg.
- Admin-only transportation planning and correction.
- Staff-visible transportation plans and staff-accessible normal lifecycle actions.
- Capacity and unassigned-participant review per leg.
- Event status automation for vehicle-based events.
- Configurable default return destination, initially displayed as `Mill Village`.
- User-initiated WhatsApp message preview, copy, and handoff.
- Vehicle deactivation cleanup for eligible future, not-started events.

## Exclusions

- Automated WhatsApp sending, WhatsApp Business API integration, delivery tracking, group discovery, phone-number storage, credentials, or message-template storage.
- Route calculation, travel-time overlap calculation, or event-specific return destinations.
- A general-purpose activity log.
- Hard blocking for unassigned participants or overcapacity.
- Retrospective mutation of completed, cancelled, historical, or already-started trips during vehicle deactivation.

## Authoritative decisions

This section supersedes conflicting transportation lifecycle, permission, and WhatsApp statements elsewhere.

### Vehicle trip lifecycle

The only ordinary stage sequence is:

`planned -> departed -> arrived_at_event -> return_started -> returned`

The corresponding actions are **Depart**, **Arrive at Event**, **Start Return**, and **Returned**. Each successful transition records a server timestamp in `departedAt`, `arrivedAtEventAt`, `returnStartedAt`, or `returnedAt`. Ordinary stage skipping and backward transitions are not allowed.

For an event with active vehicles:

- the first successful **Depart** changes `confirmed` to `in_progress`;
- **Arrive at Event** and **Start Return** do not change event status;
- the last applicable vehicle marked **Returned** changes `in_progress` to `completed`;
- ordinary manual **Start Event** and **Complete Event** actions are unavailable.

Events without vehicles retain manual **Start Event** and **Complete Event** actions. The target event lifecycle is `draft -> confirmed -> in_progress -> completed`, with cancellation governed by existing event rules.

### Participant assignments

Each active student and staff participant has an optional `departureVehicleId` and `returnVehicleId`. Return assignments initially copy the departure plan and may be changed by an Admin after departure. Participants can remain unassigned; EventFlow provides a strong warning and explicit review rather than a hard block.

The interface supports bulk assignment, individual movement, and grouping by vehicle plus **Unassigned**. Removing a participant atomically clears both vehicle fields. Existing participant documents remain the relationship records; no additional participant relationship collection is introduced.

Return assignments for a vehicle become visible immediately after that vehicle reaches `departed`.

### Permissions

Only an active approved Admin may create or edit participant departure/return vehicle assignments, departure/return driver assignments, and associated vehicle assignments. Staff can view transportation plans. Active approved Staff and Admin users may perform valid forward operational lifecycle actions.

Only an Admin can correct an accidentally recorded stage or an assignment after the affected leg has begun. A correction requires a warning, explicit confirmation, a reason, correcting user UID, and server timestamp. It is an explicit workflow, not unrestricted field editing. Staff cannot undo stages. Completed and cancelled events expose no normal transportation actions; an eligible correction remains separately controlled.

### Drivers and occupancy

Departure and return drivers are independent; the return driver initially copies the departure driver. Each vehicle has at most one active driver per leg, and the driver must be active staff with `canDrive = true`.

Assigning a driver atomically ensures that person is an active staff participant and assigns them to that vehicle for the applicable leg. A driver is an occupant and consumes exactly one seat, without double counting. A vehicle carrying only its driver may depart.

Removing only a driver retains staff participation. Removing a staff participant who is a driver warns the Admin and, on confirmation, removes the applicable driver assignment as part of the same atomic operation.

### Validation and review

Overlap validation remains an MVP rule and applies independently to departure participants, return participants, departure drivers, return drivers, and vehicles. It uses the event interval; no route calculation is introduced.

Capacity is calculated independently for each leg from all assigned people, including the driver exactly once. Overcapacity and unassigned participants produce strong warnings, not hard blocks.

Before **Depart**, the review shows the vehicle, departure driver, departure occupants, count, capacity, overcapacity state, and every event participant not assigned for departure. Before **Start Return**, it shows the equivalent return information. Each action requires explicit review confirmation.

### Lifecycle effects

- **Depart** validates the departure driver, presents review and warnings, records `departedAt`, moves the trip to `departed`, reveals its return plan, and may move the event to `in_progress`. It does not enable the outbound message.
- **Arrive at Event** records `arrivedAtEventAt`, moves the trip to `arrived_at_event`, and enables that vehicle's outbound message.
- **Start Return** validates the return driver, presents review and warnings, records `returnStartedAt`, moves the trip to `return_started`, and enables that vehicle's return message.
- **Returned** records `returnedAt`, moves the trip to `returned`, and may complete the event. It enables no message.

### Vehicle deactivation

Deactivation requires confirmation and lists affected event names. For an affected event, departure and return participant assignments and applicable driver assignments are cleared only when the event has not started and `departureDateTime` is later than the current time. Historical, in-progress, completed, and cancelled transportation records are retained.

### WhatsApp handoff

Messaging is available only on Event Details and is always initiated by the user. EventFlow prepares editable local text, supports copy, and opens WhatsApp for the user to select an existing staff-only group and send manually. If handoff cannot be opened, the UI copies the message and explains the fallback. EventFlow stores no sent/share timestamp.

- The confirmation message is available after event confirmation and contains event name, planned times, location, student/staff counts, drivers, vehicles, meals, dietary-restrictions Yes/No, and an EventFlow link. It excludes participant names, restriction details, and contact information.
- A vehicle's outbound message becomes available only after **Arrive at Event**. It contains `departedAt`, participant display names, departure driver, vehicle, event location, and expected return.
- A vehicle's return message becomes available only after **Start Return**. It contains `returnStartedAt`, return occupants, return driver, vehicle, planned arrival, and the configured default destination.

## Planned data design

### Existing participant collections

Extend `eventParticipants` and `eventStaffParticipants` with:

| Field | Type | Notes |
|---|---|---|
| `departureVehicleId` | string or null | Active vehicle used for the outbound leg. |
| `returnVehicleId` | string or null | Active vehicle used for the return leg. |
| `transportCorrectedAt` | timestamp or null | Server timestamp of the latest assignment correction. |
| `transportCorrectedByUserId` | string or null | UID that made the latest correction. |
| `transportCorrectionReason` | string or null | Required reason for the latest correction. |

### `eventVehicleTrips/{eventId__vehicleId}`

This collection replaces `eventDrivers` for the planned target and makes the vehicle the trip aggregate.

| Field | Type | Notes |
|---|---|---|
| `eventId`, `vehicleId` | string | Deterministic relationship identity. |
| `assignmentStatus` | `active` or `removed` | Preserves readable history without treating a removed vehicle as applicable. |
| `stage` | lifecycle enum | One of the five authoritative stages. |
| `departureDriverStaffId` | string or null | One eligible driver for departure. |
| `returnDriverStaffId` | string or null | One eligible driver for return. |
| `departedAt`, `arrivedAtEventAt`, `returnStartedAt`, `returnedAt` | timestamp or null | Server-authored operational timestamps. |
| `createdAt`, `updatedAt` | timestamp | Audit metadata. |
| `correctedAt` | timestamp or null | Server timestamp of latest trip correction. |
| `correctedByUserId` | string or null | UID that made the latest trip correction. |
| `correctionReason` | string or null | Required reason for latest trip correction. |

### `settings/transportation`

| Field | Type | Notes |
|---|---|---|
| `defaultReturnDestination` | string | Initially `Mill Village`; no full address required. |
| `updatedAt` | timestamp | Server timestamp. |
| `updatedByUserId` | string | Admin UID. |

`events.status` gains `in_progress`. Message content and availability are derived and are not persisted as message or delivery records.

## Atomic boundaries

Transactions or equivalent atomic writes are required for:

- assigning a driver, ensuring staff participation, and assigning that driver to the leg's vehicle;
- initializing return participant and driver assignments from departure;
- removing a participant and clearing both leg assignments and applicable driver references;
- changing a stage and applying the first-departure or last-return event status effect;
- recording every correction with reason, UID, and server timestamp;
- deactivating a vehicle and clearing only eligible future references.

## Query and index impact

Implementation should validate composite indexes for active participants by `eventId`, status, and each leg's vehicle field; active trips by event; and active vehicle trips by vehicle for overlap checks. Exact index definitions must follow the final query implementation and be committed with it.

## Migration and compatibility

This project currently uses test data. The implementation plan should:

1. Create one planned trip record for each unique active event/vehicle relationship in `eventDrivers`.
2. Copy the existing driver into both departure and return driver fields when eligible.
3. Initialize all trip stages to `planned` with null lifecycle timestamps.
4. Initialize participant vehicle fields to null because the current model does not establish vehicle occupancy.
5. Flag existing drivers without vehicles for Admin resolution.
6. Keep legacy `eventDrivers` readable during validation, then remove or archive test records only after the new model passes migration checks.
7. Avoid retroactively changing completed or cancelled event history.

## Acceptance criteria

- Only valid forward stages can be performed, and each writes the correct server timestamp.
- The first departure and last return apply the required event status transitions.
- Vehicle-free events retain manual start/complete behavior.
- Admin-only planning permissions and Staff operational permissions are enforced in both UI and Firestore Rules.
- Departure and return occupants, drivers, capacity, warnings, and overlaps are evaluated independently.
- Driver participation and seat counting remain synchronized without duplicates.
- Unassigned and overcapacity states warn but do not prevent confirmed operational actions.
- Corrections require confirmation, reason, UID, and server timestamp.
- Deactivation preserves history and only clears eligible future, not-started assignments.
- WhatsApp content, timing, privacy limits, manual handoff, and fallback match this record.
- Existing application confirmation, dietary, participant, vehicle, and event behaviors remain intact unless explicitly superseded here.

## Implementation checklist

- [ ] Update application types, services, transactions, and UI.
- [ ] Update Firestore Rules and emulator coverage.
- [ ] Add required indexes after finalizing queries.
- [ ] Write and verify the test-data migration.
- [ ] Add automated tests for lifecycle, permissions, capacity, overlap, corrections, and deactivation.
- [ ] Execute the UAT scenarios in `13-uat-test-plan.md`.
- [ ] Record build, rule-test, migration, and UAT evidence.
- [ ] Update this record through Ready for UAT, Accepted, and Released as appropriate.
