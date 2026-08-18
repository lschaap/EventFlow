# Change Log

## v0.5 - Admin Configuration Consistency
- Aligned Activity and Event Type configuration with Student, Staff, and Vehicle management patterns.
- Added hidden creation forms, separate record sections, consistent actions, and alphabetical display without visible sort-order values.

## v0.4 - Application Event Confirmation
- Added the Firestore-backed `draft` to `confirmed` transition for approved Admin and Staff users.
- Added persisted-event readiness validation and a confirmation prompt on Event Details.
- Protected event status transitions and creation audit fields in Firestore rules.
- Kept Calendar synchronization and confirmation email explicitly pending.

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
- Retained plain-text confirmation email.
- Deferred offline, AI, full activity log, and retention deletion.

## v0.1 - Initial MVP
- Event CRUD
- Student participants
- Driver/vehicle assignments
- Calendar synchronization
- Firebase architecture
