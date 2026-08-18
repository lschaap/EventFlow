# Change Log

## CR-001 Trip and Driver Planning - In Implementation (Not Deployed)

- Documented and implemented deterministic `returnDriverMirrorsDeparture` semantics.
- Cut Event Details planning over to `eventVehicleTrips` for Admin vehicle/departure/return driver planning with Staff read-only visibility.
- Kept passenger planning, lifecycle actions, event-list cutover, and target-model vehicle deactivation for later milestones.

## CR-001 Foundation - In Implementation (Not Deployed)

- Added vehicle-trip/settings types and services, two indexes, and restrictive Rules configuration; deployed only the Rules on 2026-08-18.
- Added `in_progress` and nullable `startedAt` compatibility without lifecycle actions or stored-status changes.
- Added Admin Vehicles-tab default destination editing; missing settings display `Mill Village` without an implicit write.
- Added dry-run-first, explicit-confirmation, idempotent migration tooling and fictional-fixture tests; no migration ran and `eventDrivers` remains the UI source.
- Participant assignments, lifecycle automation, Staff return editing, WhatsApp, and UI cutover remain unimplemented.

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
