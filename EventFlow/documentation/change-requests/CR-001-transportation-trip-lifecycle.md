# CR-001: Transportation Trip Lifecycle

## Record

| Field | Value |
|---|---|
| State | In implementation |
| Decision date | 2026-08-18 |
| Scope | Per-leg transportation planning, trip execution, capacity review, status automation, manual vehicle-free lifecycle, and user-initiated WhatsApp handoff |
| Current implementation | Event-level driver/vehicle assignment, overlap checks, and capacity warnings exist; the per-leg model, `in_progress`, trip lifecycle, return snapshot, and WhatsApp handoff do not |
| Current milestone | Vehicle-trip data foundation and legacy driver migration |

## Implementation progress

Implemented in the foundation milestone: shared `in_progress` and nullable `startedAt` compatibility; `eventVehicleTrips` types/foundation services; transportation-settings model/service and Admin Vehicles-tab control; restrictive Rules; two foundation indexes; and dry-run-first migration tooling with fictional-fixture tests. The foundation Firestore Rules were deployed to the configured Firebase project on 2026-08-18; indexes were not deployed.

The current milestone implements Admin Event Details vehicle-trip and driver planning plus required `returnDriverMirrorsDeparture`. New/migrated trips default true; explicit return selection/clear sets false; Same as departure restores true and copies atomically. Missing legacy target fields safely parse false. Passenger fields, lifecycle actions, event-list cutover, and target deactivation remain planned. Updated Rules/indexes are not deployed by this milestone.

The current driver/vehicle UI continues to read/write only `eventDrivers`; no dual writes or live migration occurred. Participant vehicle fields, snapshots, stage actions, Staff return editing, corrections, automatic status transitions, vehicle-free controls, WhatsApp, Calendar/email, and UI cutover remain unimplemented. CR-001 is not Ready for UAT, Accepted, or Released.

## Scope

- Five stages per active vehicle trip; per-leg participant and driver assignments.
- A departure-time return snapshot and bounded Staff/Admin return-passenger editing window.
- Per-leg overlap, capacity, and unassigned review.
- Automatic vehicle-based status changes and manual vehicle-free controls.
- Admin corrections with latest-only correction metadata.
- Default return destination in Admin Configuration > Vehicles, initially `Mill Village`.
- User-initiated WhatsApp preview, editing, copy, and best-effort handoff.
- Eligible future cleanup during vehicle deactivation.

## Exclusions and deferrals

- Confirmation email is removed from MVP and is an optional future enhancement.
- No automated WhatsApp sending, Business API, delivery/app-open verification, group discovery, phone numbers, credentials, stored templates, sent state, or share-attempt timestamps.
- No automatic scheduled completion for vehicle-free events or browser/read-time substitute.
- No route calculation, event-specific return destination, hard capacity/unassigned block, general activity log, or full correction history.

## Authoritative decisions

These decisions supersede conflicting statements and are approved and planned, not implemented.

### Status and lifecycle

The target event statuses are `draft`, `confirmed`, `in_progress`, `completed`, and `cancelled`. The ordinary vehicle sequence is:

`planned -> departed -> arrived_at_event -> return_started -> returned`

Depart, Arrive at Event, Start Return, and Returned record server `departedAt`, `arrivedAtEventAt`, `returnStartedAt`, and `returnedAt`. Ordinary skipping and reversal are prohibited.

For vehicle-based events, first departure changes `confirmed` to `in_progress`. An **applicable vehicle** is an active trip that actually reached `departed`; planned unused and removed trips do not count. The event cannot complete before a departure and completes when every applicable trip is `returned`. Manual Start/Complete controls are unavailable.

For vehicle-free events, active approved Staff and Admin users may use Start Event (`confirmed -> in_progress`, server `startedAt`) and Complete Event (`confirmed|in_progress -> completed`, server `completedAt`). Cancelled events cannot be started/completed normally, and completed events cannot restart normally. There is no automatic scheduled completion in MVP.

### Departure plan and return snapshot

Before departure, each active participant's return assignment mirrors `departureVehicleId` and is not independently editable. Departure assignments and both leg drivers are Admin-only.

When a vehicle reaches `departed`, the same transaction snapshots `returnVehicleId` for every active occupant departing in it, records the transition/timestamp, and reveals that vehicle's return list. Later return edits never alter departure history, and later departure corrections never silently rewrite the snapshot.

Only departed vehicles may receive independent return edits. After departure and before the target vehicle reaches `return_started`, active approved Staff and Admin users may move active student/staff participants between eligible departed return vehicles, assign an unassigned participant, clear an assignment, and bulk reassign. Valid Staff changes save immediately without Admin approval.

Staff cannot edit departure assignments, either leg's driver, event vehicles, invalid stages, corrections, or return passengers after Start Return. Return-driver and trip planning remain Admin-only. After Start Return, only Admin correction can change return assignments.

### Validation, drivers, and capacity

Return edits verify active event participation, an active trip for the event, a target trip from `departed` through before `return_started`, no duplicate occupancy, participant overlap, and recalculated capacity. Participants and drivers count exactly once.

Vehicle capacity means **total available seats in the vehicle, including the driver's seat**. The driver and every assigned occupant each consume one seat; a driver who is also a staff participant is deduplicated. Capacity is independent per leg. Overcapacity warns but does not block. A driver-only vehicle may depart.

Each vehicle has one active eligible driver per leg. Assigning a driver atomically ensures staff participation and leg occupancy. Removing only a driver retains participation. Removing a participant-driver warns before atomically removing applicable driver references and both participant vehicle fields. Existing event-interval overlap checks apply independently to leg participants, drivers, and vehicles.

### Reviews and operations

Depart and Start Return reviews list vehicle, applicable driver, occupants, count/capacity, overcapacity, and every active participant unassigned for that leg. Cancelling either review writes nothing. Warnings require confirmation but do not block; a missing driver blocks.

- Depart validates/reviews, snapshots return occupants, records `departedAt`, advances the trip, reveals return, and applies first-departure status atomically. It does not enable outbound messaging.
- Arrive records `arrivedAtEventAt`, advances the trip, and enables outbound messaging.
- Start Return validates/reviews, records `returnStartedAt`, locks ordinary return editing, advances the trip, and enables return messaging.
- Returned records `returnedAt`, advances the trip, and completes only when every applicable trip is returned.

### Correction and status recalculation

Staff cannot undo stages. Admin correction requires warning, confirmation, reason, UID, and server timestamp. One transaction updates stage and consistent trip timestamps, overwrites latest correction metadata, recalculates event status, and updates event timestamps:

- cancelled remains `cancelled`;
- no active trip reached departed: `confirmed`;
- at least one applicable trip and not all returned: `in_progress`;
- all applicable trips returned: `completed` with server `completedAt`;
- moving away from completion clears `completedAt`; completing again writes a new server value;
- `startedAt` records effective start and clears only when correction returns the event to confirmed.

A completed event can return to `in_progress` after an authorized backward correction and complete again after correction forward. Planned unused/removed trips do not count. Completed/cancelled events have no normal transportation actions.

Only the latest correction reason, UID, and timestamp are stored and later corrections overwrite them. This is not full audit history; `activityLog` remains future. WhatsApp edits/handoffs are never corrections.

### Deactivation and settings

Vehicle deactivation lists affected event names and, after confirmation, clears participant leg assignments and applicable drivers only for not-started events with future departure. Historical, started, in-progress, completed, and cancelled records remain.

`defaultReturnDestination` is configured in Admin Configuration > Vehicles and initially displays `Mill Village`. Only Admin updates it; Staff may read it for operations/messages. No separate settings navigation is added.

### WhatsApp replaces confirmation email

EventFlow remains the source of truth while WhatsApp is an intentional handoff. Event Details generates editable text without changing data. Copy explicitly copies. Open WhatsApp attempts a best-effort handoff; the preview remains visible and instructs the user to use Copy if WhatsApp does not open. The user selects an existing staff-only group and presses Send. EventFlow never claims opened, sent, delivered, or received.

- Confirmation preview after confirmation: name, planned times, location, counts, drivers, vehicles, meals, dietary Yes/No, and EventFlow link; no participant names, restriction details, or contacts.
- Outbound preview only after Arrive: `departedAt`, departure occupants, driver, vehicle, event location, expected return.
- Return preview only after Start Return: `returnStartedAt`, return occupants, driver, vehicle, planned arrival, default destination.

No confirmation email is part of target MVP.

## Planned data design

Extend both participant collections with nullable `departureVehicleId`, `returnVehicleId`, and latest correction reason/UID/server timestamp. Before departure return mirrors departure; Depart creates the independent snapshot.

Replace `eventDrivers` with deterministic `eventVehicleTrips/{eventId__vehicleId}` containing identity, `assignmentStatus`, stage, independent drivers, lifecycle timestamps, created/updated metadata, and latest correction metadata. Add `events.startedAt` and planned `in_progress`; maintain `completedAt` per the lifecycle/correction rules.

Store `defaultReturnDestination` and update metadata in `settings/transportation`, surfaced inside Admin Configuration > Vehicles. Do not persist messages or handoff state.

## Atomic boundaries

Atomic writes cover driver/participant/occupancy synchronization; Depart plus return snapshot/visibility/event start; participant removal; validated return moves; Start Return plus edit locking; Returned plus applicable-trip completion; correction plus trip timestamps/audit/event status/`startedAt`/`completedAt`; and eligible vehicle-deactivation cleanup.

## Target rules and queries

Rules enforce Admin-only departure, driver, vehicle, settings, and correction writes. Active approved Staff/Admin may update only return-passenger fields for eligible departed trips before Start Return and may perform valid forward actions. Rules validate identities/stages rather than relying on UI. Implementation finalizes indexes for active participants by event/status/leg vehicle, active event trips, and vehicle overlap.

## Migration and rollback

1. Export/backup test data and document rollback before writes.
2. Map each unique active event/vehicle to `eventVehicleTrips/{eventId__vehicleId}`.
3. Copy an eligible current driver into both driver fields.
4. Resolve multiple legacy drivers on one vehicle because target permits one per leg.
5. Use legacy primary/secondary role only as migration input: prefer one eligible primary; otherwise flag for Admin choice. Do not persist legacy roles.
6. Initialize `planned` and null lifecycle timestamps.
7. Initialize participant vehicle fields null because legacy data does not prove occupancy.
8. Flag vehicle-less/ineligible drivers for Admin resolution.
9. Verify capacities mean total seats including driver and explicitly correct test data if needed.
10. Validate records and source/target totals before removing legacy test records.
11. Never silently delete legacy records or rewrite completed/cancelled history.
12. Record final migration, validation, retention/removal, and rollback during implementation.

## Risks

- Cross-document authorization and concurrent return edits/stage transitions require careful transactions and Rules.
- Ambiguous legacy drivers/capacities require explicit review.
- Browser WhatsApp handoff cannot prove launch or delivery.
- Latest-only correction metadata cannot reconstruct history.

## Acceptance criteria

- Statuses, stages, applicable completion, timestamps, and vehicle-free controls match this record.
- Depart creates the independent return snapshot; before it, return mirrors departure and is not editable.
- Staff return edits work only for departed eligible trips before Start Return with full validation.
- Departure, all drivers, vehicles, settings, and corrections remain Admin-only.
- Capacity includes the driver, is leg-specific/deduplicated, and warns without blocking.
- Corrections atomically recalculate status/timestamps backward and forward.
- Planned unused/removed trips do not block completion; no completion precedes a departure.
- WhatsApp timing, privacy, explicit Copy, best-effort Open, and no-storage rules apply; MVP has no confirmation email.
- Migration is backed up, validated, reversible, and does not silently delete legacy records.

## Implementation checklist

- [ ] Update types, services, transactions, UI, and vehicle-free controls.
- [ ] Update Rules/emulator tests for Admin planning and bounded Staff return editing.
- [ ] Add finalized indexes.
- [ ] Back up, migrate, validate, and document rollback for test data.
- [ ] Verify capacity values include the driver.
- [ ] Test lifecycle, snapshot, permissions, concurrency, capacity, overlap, corrections, settings, and deactivation.
- [ ] Execute `13-uat-test-cases.md`.
- [ ] Record build, rule-test, migration, and UAT evidence.
- [ ] Advance state only when Ready for UAT, Accepted, or Released is genuinely reached.
