# Change Log

## v0.9 - Unified Add and Effective Return Editing

- Replaced separate event-add controls with one atomic Students/Staff/Vehicles dialog capped at 20 combined selections.
- Removed return correction-history creation/display and retained direct effective edits through `return_started`.
- Preserved immutable departure driver/occupant facts when the effective return driver changes.

## 2026-08-20 — CR-001 Return Planning and Start Return (Ready for verification)

- Closed the supplied Depart/Arrive UAT record at the Product Owner’s accepted overall outcome without fabricating individual case evidence.
- Added Admin/Staff individual and mixed bulk return editing among active departed/arrived trips and Return Unassigned, with return-driver warning/atomic clearing and locked departure history.
- Added per-vehicle Start Return review, combined warning confirmation, stale-roster protection, request-time/user audit, and immutable original return snapshot using the configured destination.
- Added effective post-start roster corrections for Admin/Staff after return start, Returned fixture states, and event completion through append-only `returnRosterCorrections` operation history; original snapshots and lifecycle/event timestamps remain unchanged.
- Deployed the matching Firestore Rules only to `eventflow-612ed` as ruleset `e8a29a89-d4bc-4413-a094-d9eae4365212` after warning-free cloud compilation and executable emulator verification; no Functions, indexes, Hosting, or operational data changed.
- UAT exposed Depart permission denial for both approved roles after the return Rules expansion. The broad legacy update paths exceeded Firestore's 1,000-expression evaluation ceiling; compact exact first-Depart event/trip paths and permanent Admin/Staff emulator regressions were added, then deployed as ruleset `dd4b94bb-a586-49b3-bde7-68cf8c0e6865`.
- Follow-up UAT exposed the same expression ceiling on Arrive at Event. A compact exact `departed -> arrived_at_event` path now permits only stage, arrival timestamp/user audit, and updated time while locking all other trip/event facts. Chained Admin/Staff Depart-and-Arrive emulator regressions pass, and ruleset `32d5839e-c550-496f-b8e8-9aa2eb39bfaa` was deployed.
- Start Return UAT then exposed silent client waiting during its multi-read review/transaction flow. All prerequisite, transactional, and verification reads are now bounded; the vehicle card immediately shows Preparing state and displays a specific local error instead of appearing inert. The emulator regression now chains Depart, Arrive, and Start Return for both roles. This client fix requires no additional Rules deployment.
- On 2026-09-03, redundant broad Depart/Arrive Rules branches were removed after the exact compact paths had superseded them. The complete Rules emulator suite and cloud compilation passed, and Rules-only deployment `16fb9b8e-0cfc-4719-b3b0-1157de1a59c6` was released. A broader post-Depart return-driver swap remains outside this milestone rather than shipping a non-atomic workaround.
- Returned, automatic completion, WhatsApp, generalized movements, Hosting, Functions deployment, and operational-data changes remain excluded.

## CR-001 Grouped Participant Planning - In Implementation

- Cut Events list summaries over to active target trips/participant assignments with constant-query loading, driver/vehicle resolution, no-plan state, incomplete/overcapacity warnings, and malformed-count reporting.
- Isolated legacy `eventDrivers` from all production frontend behavior while retaining migration tooling and restrictive Rules compatibility.
- Added eligible future target-trip vehicle deactivation cleanup and verified student/staff removal clears both leg assignments plus applicable target drivers.
- Added and executed a project-locked, dry-run-first, bounded operational test-data reset utility and runbook under Product Owner approval.
- Narrow participant-removal Rules changes were deployed to `eventflow-612ed` on 2026-08-19 as ruleset `741d4181-b59e-4cd7-b7d8-a21297702303`; all four unchanged trip indexes report READY.
- Product Owner approved the operational test-data reset on 2026-08-19. It deleted 47 scoped documents with no batch failures; post-reset verification reported all five operational collections empty, zero anomalies, and 27 preserved master/configuration documents.
- Added leg-specific driver/occupant synchronization: warned individual/bulk moves atomically clear disclosed driver roles, preserve unrelated legs, and maintain mirror consistency. Depart remains unimplemented.
- Deployed the matching driver/occupant invariant Rules to `eventflow-612ed` as ruleset `df4e8c69-0ac9-435e-adab-1192ef38511c`; no indexes or other Firebase resources changed.
- Product Owner moved all WhatsApp functionality out of CR-001 MVP acceptance and into the future roadmap; it is not an MVP UAT, deployment, or go-live dependency.
- Added the per-vehicle Arrive at Event review and atomic transition, durable arrival user audit, immutable departure-snapshot review, stale-write protection, and duplicate/invalid-stage denial. Matching Rules, including planned-trip compatibility for missing nullable lifecycle fields, were deployed to `eventflow-612ed` on 2026-08-20 as ruleset `385bfe7e-69e6-46be-96bd-334315411243`; no Functions, indexes, or Hosting resources changed.
- Stabilized arrival confirmation after UAT showed successful prerequisite reads but no commit: the transaction now rereads event, trip, and vehicle in deterministic sequence, applies bounded read waits, canonicalizes snapshot fields in the stale-review token, and displays failures inside explicit non-submit dialog controls. No Rules change is required.
- Product Owner reran and accepted the Depart/Arrive UAT on 2026-08-20 after the arrival stabilization fix; the next CR-001 lifecycle milestone may proceed, while Start Return and later stages remain unimplemented in this commit.

- Expanded planned transportation authorization to active approved Admin and Staff users for all events while keeping master data, settings, users, and corrections Admin-only.
- Added nullable per-leg participant vehicle assignments, pre-departure return mirroring with an independent-return-driver exception, grouped planning, atomic individual/bulk movement, Unassigned groups, and per-leg capacity warnings.
- Kept lifecycle actions, snapshots, post-Depart return editing, corrections, and frontend deployment planned; moved all WhatsApp behavior to post-MVP.
- Consolidated participant and transportation management into one live-refreshing grouped section, retained bulk assignment as a Spark-compatible atomic Firestore transaction, standardized its failure message, and hid return occupants until the future per-departed-vehicle edit action.
- Fixed grouped-planning UAT findings: staff-occupant removal now clears current trip driver references atomically, individual assignments verify committed state and surface failures, and the return-driver selector stays hidden until return transportation is explicitly marked different.
- The four trip indexes are READY and the Spark-compatible transportation Rules adjustment is deployed; the grouped application is not deployed, and no Cloud Function is required.

## CR-001 Trip and Driver Planning - In Implementation (Not Deployed)

- Documented and implemented deterministic `returnDriverMirrorsDeparture` semantics.
- Cut Event Details planning over to `eventVehicleTrips` for Admin vehicle/departure/return driver planning with Staff read-only visibility.
- Kept passenger planning, lifecycle actions, event-list cutover, and target-model vehicle deactivation for later milestones.

## CR-001 Foundation - In Implementation (Not Deployed)

- Added vehicle-trip/settings types and services, two indexes, and restrictive Rules configuration; deployed only the Rules on 2026-08-18.
- Added `in_progress` and nullable `startedAt` compatibility without lifecycle actions or stored-status changes.
- Added Admin Vehicles-tab default destination editing; missing settings display `Mill Village` without an implicit write.
- Added dry-run-first, explicit-confirmation, idempotent migration tooling and fictional-fixture tests; no migration ran and `eventDrivers` remains the UI source.
- Participant assignments, lifecycle automation, Staff return editing, and UI cutover remain unimplemented; WhatsApp is post-MVP.

## Approved Change Definition - 2026-08-18 (Not Implemented)

- Added the change-management process and CR-001 transportation trip lifecycle specification.
- Documented the approved lifecycle, per-leg assignments, permissions, reviews, corrections, status automation, deactivation behavior, destination, and manual WhatsApp handoff.
- Added planned data, architecture, workflow, UI, security, integration, migration, and UAT impacts while preserving the implemented baseline.
- No application code, Firestore Rules, indexes, test data, dependencies, deployments, or generated files changed.

### Authoritative CR-001 correction

- Removed confirmation email from target MVP and made user-initiated WhatsApp preparation the notification approach, with explicit Copy and technically honest best-effort Open behavior.
- Defined departure-time return snapshots and allowed validated Staff/Admin return-passenger editing only after Depart and before Start Return; drivers remain Admin-only.
- Defined applicable vehicles, correction-driven status recalculation, manual vehicle-free Start/Complete, and deferred scheduled completion.
- Defined capacity as total seats including the driver's seat, placed settings in Admin Configuration > Vehicles, documented latest-only correction history, and strengthened migration/rollback requirements.

## v0.5 - Admin Configuration Consistency
- Aligned Activity and Event Type configuration with Student, Staff, and Vehicle management patterns.
- Added hidden creation forms, separate record sections, consistent actions, and alphabetical display without visible sort-order values.

## v0.4 - Application Event Confirmation
- Added the Firestore-backed `draft` to `confirmed` transition for approved Admin and Staff users.
- Added persisted-event readiness validation and a confirmation prompt on Event Details.
- Protected event status transitions and creation audit fields in Firestore rules.
- Kept Calendar synchronization pending; the later authoritative CR-001 correction removed confirmation email from MVP.

## v0.3 - Vehicle and Driver Operations
- Added Admin vehicle master-data management.
- Added deterministic event driver assignments with optional vehicles.
- Added driver and unique-vehicle names plus capacity-based transportation warnings to event cards.
- Added overlap validation so a vehicle cannot be assigned to simultaneous events.
- Added confirmed vehicle deactivation that clears vehicle links only from future events.
- Added automatic driver removal when the matching staff participant is removed.
- Added atomic staff participation when assigning a new driver.
- Added overlap validation for student and staff participation.
- Corrected legacy driver-record compatibility during vehicle and participant removal.
- Aligned Student configuration creation and record sections with Staff configuration.
- Added explicit confirmation before removing a staff participant who is also an active driver.

## v0.2 - Requirements Baseline
- Established Admin and Staff roles.
- Added admin-only master-data permissions.
- Clarified all drivers are staff with `canDrive = true`.
- Added staff participants as a separate event relationship.
- Removed lead-staff requirement.
- Defined departure/return date-time model.
- Added configurable activities and event types.
- Added meals: breakfast, lunch, snack, dinner.
- Added student dietary-restriction indicator.
- Added student/staff/total participant counts.
- Added Calendar sync status/error fields.
- Added mobile-first requirements.
- Added dashboard and expanded search/filtering.
- Removed driver-change email.
- Historically retained plain-text confirmation email; the later authoritative CR-001 correction supersedes this decision and moves it to the Future Roadmap.
- Deferred offline, AI, full activity log, and retention deletion.

## v0.1 - Initial MVP
- Event CRUD
- Student participants
- Driver/vehicle assignments
- Calendar synchronization
- Firebase architecture
## 2026-08-19 CR-001 Per-Vehicle Depart - Implemented

- Added the Admin/Staff mobile pre-Depart review with current driver/occupants, typed counts, capacity, Unassigned and over-capacity warnings, and explicit double-check confirmation; cancellation writes nothing.
- Added the stale-safe atomic `planned -> departed` transaction, request-time/audit fields, immutable departure snapshot, return-passenger initialization with independent-driver reconciliation, committed-state verification, and first-depart event start.
- Locked departed departure planning, exposed actual departure time and read-only initialized return occupants, and left Arrive, Start Return, Returned, corrections, return editing, notifications, and generalized movements unimplemented.
- Added Rules protections and focused tests without adding Functions or indexes. Firestore Rules deployed only to `eventflow-612ed` as ruleset `4014d1a7-f011-48ce-83c1-39793c6ade77`.
## 2026-08-20 CR-001 Per-Vehicle Arrival - Implemented

- Added the Admin/Staff mobile Arrive at Event confirmation and exact `departed -> arrived_at_event` client transaction with request-time `arrivedAtEventAt` and authenticated `arrivedAtEventByUserId`.
- Revalidates event/trip/vehicle and durable departure data, rejects stale/duplicate/invalid attempts, verifies committed state, preserves event/participants/assignments/departure snapshot, and leaves other vehicles unchanged.
- Displays actual arrival and retains read-only return occupants without exposing Start Return, return editing, corrections, notifications, or completion.
- Added backward-compatible Rules handling for planned records missing newly introduced nullable lifecycle fields, resolving driver-assignment permission denials while keeping lifecycle writes strict.
- Automated verification is complete; combined Depart/Arrive manual UAT is pending and Depart tests 5–10 remain deferred.
# 2026-09-03 — CR-001 return stabilization (UAT pending)

- Recorded four Product Owner findings from UAT of `6ea8363` without marking acceptance.
- Added stage-focused vehicle cards, event-wide reversible post-start passenger corrections, and audited effective return-driver editing through `return_started`.
- Cross-vehicle driver conflicts are intentionally blocked; original snapshots and lifecycle timestamps remain immutable. Returned and automatic completion remain unimplemented.
- Production build, focused regressions, policy checks, migration/reset safeguards, legacy isolation, and the executable Firestore emulator suite passed. Firestore Rules only were deployed to `eventflow-612ed` as ruleset `f294a8cc-826f-4404-a25f-93352222c0b6`; Functions, indexes, Hosting, and operational data were unchanged.
- Follow-up UAT found insufficient permission when Admin or Staff assigned either planned-trip driver. Compact planned-driver and paired occupant Rules paths, stage-first lifecycle evaluation, and permanent role-paired emulator regressions were added. Firestore Rules only were deployed as ruleset `5bd0d8cd-150c-4044-896f-29d18ed18745`; UAT-202 records the production retest.
- The next UAT pass found the equivalent denial when an Unassigned student or staff passenger was first placed in a planned vehicle. Compact first-assignment paths and Admin/Staff emulator regressions were added, then Firestore Rules only were deployed as ruleset `146317d8-9e8b-4d3a-a375-d013bca36f22`; UAT-203 records the production retest.
- The departure Unassigned group calculated occupants correctly but hid its roster because rendering required a trip record. It now uses the editable-group condition, keeping Unassigned names/actions visible while progressed vehicle history remains collapsed; UAT-204 records the retest.
