# Change Log

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
