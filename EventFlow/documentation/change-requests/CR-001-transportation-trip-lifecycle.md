# CR-001: Transportation Trip Lifecycle

## Record

| Field | Value |
|---|---|
| State | In implementation |
| Decision date | 2026-08-18 |
| Scope | Per-leg transportation planning, trip execution, capacity review, status automation, and manual vehicle-free lifecycle |
| Current implementation | Target-model planning, grouped participants, driver/occupant synchronization, Events-list summaries, eligible deactivation cleanup, participant cleanup, and legacy production isolation are implemented; trip lifecycle and return snapshot are not |
| Current milestone | Transportation-planning cutover and legacy isolation |

## Implementation progress

Implemented in the foundation milestone: shared `in_progress` and nullable `startedAt` compatibility; `eventVehicleTrips` types/foundation services; transportation-settings model/service and Admin Vehicles-tab control; restrictive Rules; two foundation indexes; and dry-run-first migration tooling with fictional-fixture tests. The foundation Firestore Rules were deployed to the configured Firebase project on 2026-08-18; indexes were not deployed.

The current milestone completes target-model production cutover for Event Details, Events list, eligible vehicle deactivation, and participant removal. Events-list data loading is constant-query and derives summaries without denormalized documents. New/migrated trips default mirroring true; explicit return selection/clear sets false; restoring matching copies the departure driver atomically.

Production UI/services no longer read or write `eventDrivers`; it remains only in migration/reset tooling, historical documentation, and restrictive Rules compatibility. The approved operational test-data reset was completed and verified on 2026-08-19; no live migration was performed. Per-vehicle Depart and Arrive at Event are implemented with automated verification, and their combined UAT was accepted by the Product Owner on 2026-08-20 after arrival stabilization. Start Return, Returned, return editing, corrections, automatic completion, vehicle-free controls, Calendar/email, and frontend deployment remain unimplemented. WhatsApp is post-MVP and outside CR-001 acceptance. CR-001 as a whole is not Accepted or Released.

## Scope

- Five stages per active vehicle trip; per-leg participant and driver assignments.
- A departure-time return snapshot and bounded Staff/Admin return-passenger editing window.
- Per-leg overlap, capacity, and unassigned review.
- Automatic vehicle-based status changes and manual vehicle-free controls.
- Admin corrections with latest-only correction metadata.
- Default return destination in Admin Configuration > Vehicles, initially `Mill Village`.
- Eligible future cleanup during vehicle deactivation.

## Exclusions and deferrals

- Confirmation email is removed from MVP and is an optional future enhancement.
- All WhatsApp behavior is post-MVP. No messaging UI, automated sending, API/paid integration, delivery/app-open verification, group discovery, phone numbers, credentials, stored templates, sent state, or share-attempt timestamps are part of MVP.
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

Before departure, each active participant's return assignment mirrors `departureVehicleId` and is not independently editable except for the independent return-driver occupant requirement. Active approved Admin and Staff users manage departure assignments and both leg drivers for all events.

When a vehicle reaches `departed`, the same transaction snapshots `returnVehicleId` for every active occupant departing in it, records the transition/timestamp, and reveals that vehicle's return list. Later return edits never alter departure history, and later departure corrections never silently rewrite the snapshot.

Only departed vehicles may receive independent return edits. After departure and before the target vehicle reaches `return_started`, active approved Staff and Admin users may move active student/staff participants between eligible departed return vehicles, assign an unassigned participant, clear an assignment, and bulk reassign. Valid Staff changes save immediately without Admin approval.

Admin and Staff cannot edit invalid stages or return passengers after Start Return. Both roles share ordinary vehicle, driver, departure, and eligible return planning permissions; after Start Return, only Admin correction can change return assignments.

### Validation, drivers, and capacity

Return edits verify active event participation, an active trip for the event, a target trip from `departed` through before `return_started`, no duplicate occupancy, participant overlap, and recalculated capacity. Participants and drivers count exactly once.

Vehicle capacity means **total available seats in the vehicle, including the driver's seat**. The driver and every assigned occupant each consume one seat; a driver who is also a staff participant is deduplicated. Capacity is independent per leg. Overcapacity warns but does not block. A driver-only vehicle may depart.

Each vehicle has one active eligible driver per leg. Assigning a driver atomically ensures staff participation and leg occupancy. Removing only a driver retains participation. Removing a participant-driver warns before atomically removing applicable driver references and both participant vehicle fields. Existing event-interval overlap checks apply independently to leg participants, drivers, and vehicles.

Moving a driver occupant away from the vehicle they drive also requires a warning that names every affected role. Cancel writes nothing. Confirm revalidates and atomically clears the disclosed roles with the individual or bulk occupant move. Departure and return are independent. Moving a mirrored departure driver clears both disclosed roles and retains a consistent true mirror with null drivers; moving only the mirrored return occupant preserves departure and sets mirroring false.

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

### Post-MVP WhatsApp handoff

This section preserves future decisions but is not part of CR-001 MVP acceptance, UAT, deployment, or go-live. EventFlow remains the source of truth while a future WhatsApp feature may provide an intentional user-initiated handoff. Event Details generates editable text without changing data. Copy explicitly copies. Open WhatsApp attempts a best-effort handoff; the user selects an existing staff-only group and presses Send. EventFlow never claims opened, sent, delivered, or received. No paid/API integration is required, and lifecycle actions work independently.

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

### Implemented Depart milestone boundary

Depart is available to active approved Admin and Staff for an active planned trip on a confirmed or already in-progress event. A mobile review is read-only and requires explicit double-check confirmation. It shows event/vehicle/driver, named occupants, typed and total counts, capacity result, and event-level Unassigned count. Unassigned and over-capacity conditions warn but do not block; cancel/close submits no transaction.

The commit re-reads all critical event/trip/vehicle/participant/driver state and compares a review token, then atomically initializes reconciled return assignments, stores `departedAt`, `departedByUserId`, and `departureSnapshot`, sets stage `departed`, and ends mirroring. The first departure also stores event `startedAt`, `startedByUserId`, and `startedByVehicleTripId`; later departures preserve them. The snapshot map stores vehicle and driver IDs/labels, typed occupant ID/name arrays, counts, confirmed capacity, and over-capacity result. Duplicate or stale confirmation and every blocking invariant fail without partial writes. Rules enforce request-time timestamps, authenticated audit IDs, snapshot shape/counts, driver occupancy, participant field bounds, and the atomic first/later event state.

The Depart milestone did not itself implement later stages; Arrive at Event is now implemented separately below. Start Return, Returned, correction, return editing, automatic completion, outbound messaging, generalized movement/multi-run concepts, and frontend deployment remain unimplemented.

### Implemented Arrive at Event milestone boundary

For an active trip exactly at `departed` on an `in_progress` event, active approved Admin and Staff receive a vehicle-specific review of the durable departure facts and event destination. Confirmation re-reads event/trip/vehicle, rejects stale state, and atomically records only `stage = arrived_at_event`, server `arrivedAtEventAt`, authenticated `arrivedAtEventByUserId`, and `updatedAt`. Event start data, departure timestamp/audit/snapshot, drivers, mirroring, participant and return assignments, counts/dietary state, later timestamps, and other vehicles remain unchanged. Cancel/close writes nothing and duplicate or skipped transitions are denied by service and Rules.

Start Return remains blocked until combined Depart/Arrive manual UAT passes or the Product Owner explicitly accepts identified defects. No return editing, corrections, Returned, completion, messaging, generalized movement, frontend deployment, Functions, indexes, or operational data are included.

The scoped Firestore Rules deployment completed on 2026-08-19 as ruleset `4014d1a7-f011-48ce-83c1-39793c6ade77`; Hosting, Functions, and indexes were not deployed.

## Target rules and queries

Rules allow active approved Staff/Admin planned vehicle, driver, and participant transportation writes for all events while enforcing Admin-only settings and corrections. Rules validate identities and stages rather than relying on UI. Implementation finalizes only indexes required by actual queries.

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
- Post-MVP browser WhatsApp handoff cannot prove launch or delivery.
- Latest-only correction metadata cannot reconstruct history.

## Acceptance criteria

- Statuses, stages, applicable completion, timestamps, and vehicle-free controls match this record.
- Depart creates the independent return snapshot; before it, return mirrors departure and is not editable.
- Staff return edits work only for departed eligible trips before Start Return with full validation.
- Planned transportation and future valid forward actions are available to Admin and Staff; settings, master data, users, and corrections remain Admin-only.
- Capacity includes the driver, is leg-specific/deduplicated, and warns without blocking.
- Corrections atomically recalculate status/timestamps backward and forward.
- Planned unused/removed trips do not block completion; no completion precedes a departure.
- MVP has no confirmation email and no WhatsApp acceptance dependency. The deferred timing, privacy, explicit Copy, best-effort Open, and no-storage decisions remain preserved for a future change.
- Migration is backed up, validated, reversible, and does not silently delete legacy records.

## Current implementation progress

Implemented in the grouped-planning milestone: active approved Admin/Staff planning for all events; participant `departureVehicleId`/`returnVehicleId`; pre-departure mirroring with the independent-return-driver exception; grouped vehicle and Unassigned views; individual and atomic bulk movement up to 100 participants; driver/occupant synchronization; and per-leg occupancy/capacity warnings. The four trip indexes are READY and the latest Spark-compatible Rules adjustment is deployed; the grouped application is not deployed.

The UAT-fix iteration merges participant management into the departure groups, refreshes additions/removals immediately, keeps atomic groups up to 100 in one field-bounded Firestore client transaction, hides pre-Depart return occupants, and reserves a separate future return-edit action for each departed vehicle card. No Cloud Function or Blaze plan is required.

Implemented in this cutover milestone: Events-list target summaries, target-model eligible vehicle deactivation, student/staff removal transportation cleanup, production `eventDrivers` isolation, focused safeguards/tests, and a non-executed operational reset procedure.

Implemented in the stabilization milestone: individual and bulk driver-occupant moves disclose every affected role, Cancel writes nothing, Confirm clears roles and moves occupants atomically, departure/return consequences remain independent, and mirrored state remains consistent. No lifecycle action was added. All WhatsApp requirements moved to post-MVP.

The narrow participant-removal Rules correction was deployed to `eventflow-612ed` on 2026-08-19 as ruleset `741d4181-b59e-4cd7-b7d8-a21297702303`. Existing indexes are unchanged and sufficient for the implemented queries; all four required `eventVehicleTrips` indexes report `READY`.

The driver/occupant invariant Rules were deployed to `eventflow-612ed` on 2026-08-19 as ruleset `df4e8c69-0ac9-435e-adab-1192ef38511c`. They require each non-null leg driver to occupy the driven vehicle and reject occupant moves that leave the applicable source-trip driver reference in place.

Implemented with automated verification and Product Owner-accepted combined UAT: Depart and Arrive at Event actions/timestamps/audits, departure snapshot, initial return reconciliation, first-depart event start, and Rules. Still planned: Start Return, Returned, post-Depart return editing, corrections, automatic completion, frontend deployment, and remaining lifecycle UAT. No live legacy migration is required for cleared operational test data. WhatsApp is post-MVP.

The Arrive at Event and planned-trip compatibility Rules were deployed to `eventflow-612ed` on 2026-08-20 as ruleset `385bfe7e-69e6-46be-96bd-334315411243`. The deployment changed Firestore Rules only; Functions, indexes, and Hosting were not deployed.

Arrival UAT exposed a client-side interruption after successful prerequisite reads and before the commit request. The stabilization fix orders the transaction's event, trip, and vehicle rereads sequentially, bounds read waits, canonicalizes snapshot fields so equivalent Firestore map ordering cannot invalidate the review token, and surfaces failures inside non-submit confirmation-dialog controls. The write contract and deployed Rules are unchanged. The Product Owner reran the supplied UAT and accepted the corrected behavior on 2026-08-20.

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
