# Functional Requirements

> Existing requirements describe the implemented baseline unless marked otherwise. CR-001 Depart and Arrive at Event requirements are implemented; later lifecycle stages remain approved and planned.

## Authentication and Access
- REQ-001: Authorized users must authenticate before accessing the application.
- REQ-002: The system must restrict application access to approved users with active accounts.
- REQ-003: The system supports two roles: Admin and Staff.
- REQ-004: Admin users can manage application users and assign Admin or Staff roles.

## Event Management
- REQ-005: Authorized users can create an event.
- REQ-006: Authorized users can edit an event.
- REQ-007: Authorized users can cancel an event.
- REQ-008: Authorized users can mark an event as Confirmed.
- REQ-009: Authorized users can mark an event as Completed.
- REQ-010: Completed events remain editable by authorized users.
- REQ-011: Events support Draft, Confirmed, Completed, and Cancelled statuses.
- REQ-012: Each event must have a unique Event ID.
- REQ-013: Event data is stored in Firestore.
- REQ-014: Cancelled events remain in Firestore and are clearly identified.
- REQ-015: An event must include name, departure date/time, return date/time, location, activity, and event type before it can be saved.
- REQ-016: Return date/time cannot occur before departure date/time.
- REQ-017: Required operational information must be present before an event is Confirmed.
- REQ-017A: Application confirmation permits only `draft` to `confirmed`, updates the existing event, and does not require participants, drivers, vehicles, sufficient vehicle capacity, meals, equipment, purpose, or notes.
- REQ-017B: Calendar synchronization remains a separate pending integration step and is not performed by the application-only confirmation workflow.
- REQ-018: Events store location, departure/return date-times, purpose, meals missed, equipment needed, and notes.
- REQ-019: Events record creator user ID and display name.
- REQ-020: Events record created date/time.
- REQ-021: Events record last-updated date/time.

## Student Participants
- REQ-022: Authorized users can add active students to an event.
- REQ-023: Authorized users can remove students from an event.
- REQ-024: Duplicate active student assignments to the same event are prevented.
- REQ-025: The system records who adds/removes a student and when.
- REQ-026: Student lists display student name and grade.
- REQ-027: Student lists can be sorted by grade.
- REQ-028: Only active students are selectable for new assignments.

## Staff Participants
- REQ-029: Authorized users can add one or more active staff members to an event as participants.
- REQ-030: Authorized users can remove staff participants.
- REQ-031: Duplicate active staff-participant assignments are prevented.
- REQ-032: The system records who adds/removes a staff participant and when.
- REQ-033: Only active staff are selectable as participants.
- REQ-033A: A student or staff member cannot participate in events with overlapping departure-to-return windows.

## Drivers and Vehicles
- REQ-034: Authorized users can assign multiple drivers to an event.
- REQ-035: Only active staff with canDrive = true are selectable as drivers.
- REQ-036: Each driver assignment can optionally include one vehicle.
- REQ-037: Authorized users can remove driver assignments.
- REQ-038: Authorized users can remove vehicle assignments.
- REQ-039: Duplicate active driver assignments are prevented.
- REQ-040: A vehicle cannot be assigned twice to the same event or to events whose departure-to-return windows overlap.
- REQ-041: Only active vehicles are selectable.
- REQ-042: The system records who assigns/removes a driver and when.
- REQ-042A: Authorized users can update an active driver's optional vehicle without recreating the assignment.
- REQ-042B: Assigning a driver atomically adds that staff member as an event participant when they are not already participating.

## Participant Counts and Meals
- REQ-043: The system displays active student participant count.
- REQ-044: The system displays active staff participant count.
- REQ-045: The system displays total active participant count.
- REQ-046: Meals missed may include zero or more of breakfast, lunch, snack, dinner.
- REQ-047: The system identifies whether any active student or staff participant has dietary restrictions.
- REQ-048: Kitchen staff can view participant names/counts, meals missed, and whether dietary restrictions are present.
- REQ-048A: Event details list each active participant with dietary restrictions and their specific restrictions when the event dietary indicator is true.
- REQ-049: Teachers can view student participants sorted by grade.

## Views, Dashboard, Search, Filtering
- REQ-050: Users can view upcoming events.
- REQ-051: Users can view current events.
- REQ-052: Users can view past events.
- REQ-053: Event-list views display name, status, departure/return, location, student/staff/total counts, meals missed, dietary indicator, assigned driver names, and unique assigned vehicle names.
- REQ-054: Dashboard displays Today's Events.
- REQ-055: Dashboard displays Upcoming Events.
- REQ-056: Dashboard displays events needing confirmation.
- REQ-057: Upcoming events display a transportation warning only when combined capacity of uniquely assigned vehicles is less than the participant count.
- REQ-058: Dashboard displays recent operational changes derivable from existing records.
- REQ-059: Users can search/filter by event name, date/date range, status, activity, event type, location, student, staff participant, or driver.

## Students - Admin Only
- REQ-060: Admin can create students.
- REQ-061: Admin can update students.
- REQ-062: Admin can activate/deactivate students.
- REQ-063: Student grades are numeric 6-12.

## Staff and Users - Admin Only
- REQ-064: Admin can create staff.
- REQ-065: Admin can update staff.
- REQ-066: Admin can activate/deactivate staff.
- REQ-067: Admin can update canDrive.
- REQ-068: Deactivated staff are unavailable for new assignments while historical references remain.
- REQ-068A: Admin can maintain dietary restrictions for staff.

## Vehicles - Admin Only
- REQ-069: Admin can create vehicles.
- REQ-070: Admin can update vehicles.
- REQ-071: Admin can activate/deactivate vehicles.
- REQ-071A: Before deactivating a vehicle assigned to eligible future planned trips, Admin sees affected event names and confirms; target-model cleanup follows REQ-106 and preserves historical/started records.
- REQ-071B: Removing a staff participant who is also an active driver requires explicit confirmation and then atomically removes both assignments; cancelling makes no changes.
- REQ-072: Vehicle records contain name, capacity, and active status.

## Activities - Admin Only
- REQ-073: Admin can create activities.
- REQ-074: Admin can update activities.
- REQ-075: Admin can activate/deactivate activities.
- REQ-076: Only active activities are selectable.

## Event Types - Admin Only
- REQ-077: Admin can create event types.
- REQ-078: Admin can update event types.
- REQ-079: Admin can activate/deactivate event types.
- REQ-080: Only active event types are selectable.

## Historical Integrity
- REQ-081: Deactivating master-data records must not remove historical event references.
- REQ-082: Completed events remain available for up to one year during MVP.
- REQ-083: Automatic deletion after one year is a future enhancement, not MVP.

## Google Calendar
The following integration requirements remain pending and are not implemented by the current application-only confirmation workflow.

- REQ-084: Confirming an event creates a Calendar event in the configured school calendar.
- REQ-085: Confirming must not create more than one Calendar event.
- REQ-086: Calendar event ID is stored on the EventFlow event.
- REQ-087: Editing a confirmed event updates the linked Calendar event.
- REQ-088: Editing a confirmed event must not create a duplicate Calendar event.
- REQ-089: Cancelling a confirmed event deletes the linked Calendar event.
- REQ-090: Calendar sync failure must preserve the Firestore event.
- REQ-091: The system records Calendar sync status.
- REQ-092: The system records the most recent Calendar sync error.
- REQ-093: The system records the most recent successful Calendar sync time.

## Notifications

- REQ-094: Confirmation email is not part of the MVP. Optional automated confirmation email is deferred to the Future Roadmap.

## Transportation Trip Lifecycle - Depart and Arrival Implemented; Later Stages Planned (CR-001)

- REQ-095: Each active event vehicle follows `planned -> departed -> arrived_at_event -> return_started -> returned` without ordinary skipping or reversal.
- REQ-096: Depart, Arrive at Event, Start Return, and Returned record their corresponding server timestamps.
- REQ-097: The first vehicle departure moves a confirmed vehicle-based event to `in_progress`; the event completes only after at least one departure and every applicable vehicle—an active trip that actually departed—has returned. Planned unused and removed trips do not count.
- REQ-098: Vehicle-based events hide ordinary manual Start/Complete controls. For vehicle-free events, Staff/Admin may Start (`confirmed -> in_progress`, server `startedAt`) and Complete (`confirmed|in_progress -> completed`, server `completedAt`); cancelled/completed invalid transitions are prohibited and no scheduled completion occurs.
- REQ-099: Before Depart, return vehicle assignments mirror departure and are not independently editable. Depart atomically creates and reveals an independent return snapshot for that vehicle's occupants.
- REQ-100: Active approved Admin and Staff users may manage transportation plans for all events and perform valid forward actions; settings, master data, application users, and corrections remain Admin-only.
- REQ-101: Each vehicle has at most one eligible active staff driver per leg, and assigning that driver also ensures staff participation and vehicle occupancy for that leg.
- REQ-102: Vehicle capacity is total available seats including the driver's seat. Drivers and occupants consume one seat each, are deduplicated, and capacity/overlap/unassigned review is independent per leg.
- REQ-103: Overcapacity and unassigned participants require a strong warning and explicit review but do not hard-block Depart or Start Return.
- REQ-104: Removing a participant atomically clears both vehicle fields; removing a staff participant also removes applicable driver assignments after warning and confirmation.
- REQ-105: After Start Return, return assignments are locked except for Admin correction. Corrections require warning, confirmation, reason, UID, server timestamp, and atomic event-status/timestamp recalculation.
- REQ-106: Vehicle deactivation lists affected future events and clears eligible participant and driver assignments only for not-started events whose departure is in the future.
- REQ-107: Admin configures the default return destination, initially `Mill Village`, inside Admin Configuration > Vehicles; Staff may read it operationally.
- REQ-108 (post-MVP): Event Details provides editable WhatsApp preparation. Copy explicitly copies; Open WhatsApp is best-effort, leaves the preview visible, and instructs use of Copy if it does not open. EventFlow never claims or records opening, sending, delivery, or receipt.
- REQ-109 (post-MVP): Confirmation messages become available after confirmation, outbound vehicle messages after Arrive at Event, and return vehicle messages after Start Return.
- REQ-110 (post-MVP): Confirmation messages exclude participant names and restriction details; vehicle messages contain only the leg-specific operational content approved for the future handoff.
- REQ-111: Staff/Admin return edits validate active participation, an active eligible departed target trip before return start, uniqueness, overlap, and recalculated capacity; warnings do not hard-block.
- REQ-112: Cancelling Depart or Start Return review performs no writes and unassigned warnings list every applicable active participant.
- REQ-113: Correction recalculation preserves cancelled, returns to confirmed when no active trip departed, uses in_progress while applicable trips remain out, and completes when all applicable trips returned; `startedAt`/`completedAt` remain consistent.
- REQ-114: Planned trips store `returnDriverMirrorsDeparture`. While true, departure-driver changes atomically update return driver; an explicit return selection or clear sets false; Same as departure restores true and copies the departure driver.
- REQ-115: Active approved Admin and Staff users may manage planned event vehicles, both leg drivers, and participant transportation for every event; master data, settings, users, and corrections remain Admin-only.
- REQ-116: Active student and staff participant relationships store nullable `departureVehicleId` and `returnVehicleId`; missing fields parse as null and only active planned trips for the same event are valid assignments.
- REQ-117: Before Depart, ordinary departure passenger moves atomically mirror return assignments, except an independent return driver's required return vehicle is preserved. Driver-role clearing or replacement does not erase ordinary passenger assignments.
- REQ-118: Admin and Staff may individually or atomically bulk-move up to 100 mixed active participants between planned vehicles and Unassigned while preserving participation, counts, dietary state, and audit metadata.
- REQ-119: Event Details derives per-leg vehicle and Unassigned groups, counts every occupant including a driver exactly once, and warns without blocking for overcapacity or incomplete transportation.
- REQ-120: Event Details combines participant management and departure transportation into one grouped section with Add Student, Add Staff, and Add Vehicle controls at the top; participant additions/removals refresh the groups immediately.
- REQ-121: Bulk departure assignment supports up to 100 mixed participants through one Firestore client transaction protected by field-bounded Rules. Any failure leaves all assignments unchanged and displays `Bulk assignment failed. Please try again or try individual assignment.`
- REQ-122: Return occupants are hidden before departure. A future lifecycle milestone exposes a separate Edit return vehicle assignments action on each departed vehicle card.
- REQ-123: Event-list transportation summaries derive only from active `eventVehicleTrips` and active participant vehicle fields, showing vehicles, per-leg driver differences, departure occupancy/capacity, incomplete/overcapacity warnings, and an explicit no-plan state without participant rosters.
- REQ-124: Production application behavior does not read or write legacy `eventDrivers`; that collection remains only for migration tooling and temporary Rules compatibility until the approved reset decision is executed.
- REQ-125: For each leg, a driver must occupy the vehicle they drive. Moving an individual or bulk-selected staff driver to another vehicle or Unassigned warns which leg roles will clear; Cancel writes nothing and Confirm atomically moves every selected occupant and clears the disclosed roles.
- REQ-126: Driver-role clearing caused by an occupant move is leg-independent. A mirrored departure-driver move discloses and clears both roles while retaining a consistent mirror; a return-only move preserves departure and sets mirroring false when necessary.
- REQ-127: Admin and Staff Depart an active planned vehicle only from a confirmed or in-progress event after a mobile review of committed driver, occupants, counts, capacity, and event-level Unassigned count. Unassigned and over-capacity conditions warn and require explicit confirmation but do not block.
- REQ-128: Depart atomically records server `departedAt`, authenticated `departedByUserId`, an immutable departure snapshot, reconciled initial return assignments, and the trip's `planned -> departed` transition. The first departure also records server `startedAt` and event-start audit IDs while later departures preserve them.
- REQ-129: A stale Depart review, duplicate attempt, invalid driver/trip/event, inconsistent return-driver plan, or failed write produces no partial changes and requires a fresh review. Arrive at Event, Start Return, Returned, corrections, and return editing remain unavailable.
- REQ-130: Active approved Admin and Staff may confirm a per-vehicle `departed -> arrived_at_event` transition only while the event remains `in_progress` and valid departure timestamp, audit, and snapshot data exist. Arrival records request-time `arrivedAtEventAt` and authenticated `arrivedAtEventByUserId` atomically while preserving event, departure, driver, participant, and return-assignment state.
- REQ-131: The Arrive review shows event, vehicle, departure driver/time, location, and snapshot occupant count; cancellation writes nothing. Duplicate, stale, skipped, inactive, malformed, unauthorized, or invalid-event attempts fail without overwriting the original lifecycle data.

The complete authoritative behavior and acceptance criteria are in [CR-001](change-requests/CR-001-transportation-trip-lifecycle.md).

## Post-MVP WhatsApp Handoff

REQ-108 through REQ-110 are retained as future requirements, not MVP acceptance criteria. No WhatsApp API, paid integration, message UI, UAT gate, or go-live dependency is required for MVP. Any future implementation remains a user-initiated preview/edit/copy/best-effort handoff to an existing staff-only group and must operate independently of transportation lifecycle actions.
