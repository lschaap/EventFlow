# UI Navigation

## Principle
EventFlow is mobile-first. Core event information must remain readable on phones without horizontal page scrolling.

## Main Navigation
```text
Login
  ↓
Dashboard
  ├── Events
  └── Admin Configuration
```

Admin-only items are hidden from Staff users.

## Dashboard

### Today's Events
Show events whose operational time range overlaps today.

### Upcoming Events
Show next events ordered by departure.

### Needs Confirmation
Show Draft events requiring confirmation.

### Driver Issues
Show events with no driver and applicable missing-vehicle assignments.

### Recent Changes
MVP only shows changes derivable from existing records:
- Student added/removed
- Staff participant added/removed
- Driver assigned/removed
- Event confirmed/cancelled/updated

Where available show change, event, user, and time.

A dedicated activity log is a future enhancement.

## Events List
Each event card/row shows:
- Event name
- Activity
- Event type
- Status
- Departure date/time
- Return date/time
- Location
- Student count
- Staff count
- Total participant count
- Meals missed
- Dietary-restriction indicator
- Driver count
- Vehicle-assignment status

## Event Details
Recommended mobile sections:
1. Overview
2. Participants
3. Drivers & Vehicles
4. Meals
5. Equipment
6. Notes
7. Calendar Sync

Draft events show a **Confirm Event** action. The action requires a confirmation prompt and changes only the application event status; it does not yet create a Google Calendar event or send email. Confirmed, Completed, and Cancelled events do not show an enabled confirmation action.

Students are grouped/sorted by grade, with staff participants separate.

Detailed dietary restrictions remain inside EventFlow and are not copied to Google Calendar.

The dietary-restriction indicator is hidden on event cards and the event overview when false. When true, Event Details shows a separate section listing each affected active student or staff participant and their restrictions.

## Search and Filtering
- Event name
- Date/date range
- Status
- Activity
- Event type
- Location
- Student name
- Staff participant name
- Driver name

## Admin Configuration
Admin Configuration uses separate mobile-friendly tabs:
- Students: list/create/edit/activate
- Staff: list/create/edit/activate/change driver eligibility/manage dietary restrictions
- Vehicles: list/create/edit/activate
- Event Types: list/create/edit/activate
- Activities: list/create/edit/activate

Users/roles remain a future Admin Configuration addition.

Student, Staff, Vehicle, Event Type, and Activity tabs use an Add button to reveal a creation form in a section above the separate records section. Editing expands the selected record in place, with Edit shown before Deactivate/Reactivate. Activity and Event Type records are displayed alphabetically; internal sort-order values are not shown.

## Event Details Transportation - Approved and Planned (CR-001)

The current grouped-planning milestone supersedes earlier Admin-only planning text: both active approved Admin and Staff users may use all pre-departure planning controls for every event. Event Details shows one card per active planned vehicle plus Unassigned, departure occupants, count/capacity, individual selectors, group checkboxes, Select all, and an atomic Move selected action. Return occupant groups remain hidden until Depart makes them independently operational.

Participant management is merged into this section rather than duplicated. Add Student, Add Staff, and Add Vehicle controls appear first; participants are then grouped by departure vehicle and Unassigned with assignment, checkbox, and Remove controls. Removing a staff occupant also removes that person's current event-trip driver assignments after confirmation. Return occupants are not shown before Depart, and a Return driver selector is shown only after the user confirms that return occupants differ from departure. In the future lifecycle UI, each departed vehicle card—not the event as a whole—will show its own Edit return vehicle assignments button.

After Depart, the departed vehicle card shows recorded actual departure time, locks its departure controls, and reveals its initialized return occupants in the separate return-assignment section. Return movement remains available while source and target trips are eligible.

While the trip is exactly `departed`, the card shows **Arrive at Event**. Its mobile confirmation includes the event/vehicle, snapshot driver and occupant count, actual departure, location, and explicit statements that the event stays in progress, return assignments do not change, Start Return is not performed, and UI undo is unavailable. After success the action disappears, actual arrival time is displayed, and the per-vehicle Start Return action appears.

After Depart, a clearly labeled Return passenger assignments section shows vehicle and Return Unassigned groups, checkboxes, per-person selectors, select-all, and a mobile bulk action. Ordinary targets are departed/arrived active trips only. An arrived vehicle exposes per-vehicle Start Return review with required double-check confirmation. After Start Return, the card shows actual time, original snapshot, effective roster, divergence indicator, explicit correction controls, and concise append-only history. Errors appear inside active lifecycle dialogs. Returned is not exposed.

The planned Event Details page adds transportation grouped by vehicle and **Unassigned**, with separate departure/return views. It shows drivers, participant names, counts, total-seat capacity including driver, warnings, stage, and lifecycle times. Before Depart return mirrors departure and is hidden as an independent list; Depart snapshots and reveals that vehicle's return list.

Admin and Staff edit planned departure passengers, both drivers, and event vehicles for every event. Both roles may edit return passengers for eligible departed/arrived vehicles until Start Return and may use the explicit audited return-roster correction workflow afterward. The default destination inside Admin Configuration > Vehicles remains Admin-only. Both roles see the next valid forward action. Vehicle-based events hide manual Start/Complete; vehicle-free events retain them with planned status/timestamps.

The grouped-planning milestone replaces Event Details legacy controls with Admin/Staff vehicle-trip cards containing drivers, mirroring, grouped participants, bulk movement, Unassigned, and capacity warnings. Event-list cards now use only active `eventVehicleTrips` and active participant vehicle assignments. They show vehicle/driver summaries, differing return drivers, departure assigned/total counts, total capacity, no-plan state, and incomplete/overcapacity warnings without participant rosters.

Depart and Start Return open an explicit review of vehicle, driver, occupants, count/capacity, overcapacity, and all event participants unassigned for that leg. Warnings require explicit double-check confirmation but do not block. Return-roster corrections disclose any driver role that will be cleared and create immutable audit history; no free-text reason is required for this bounded correction type.

The implemented mobile Depart and Start Return reviews show event and vehicle names, student/staff/total counts, available seats or over-capacity result, and a required double-check checkbox. Closing or cancelling submits no transaction; progress disables repeat submission. Returned is not exposed.

WhatsApp controls are post-MVP and do not appear in the MVP navigation or acceptance scope. A future Event Details-only handoff may provide confirmation, outbound, and return previews with explicit Copy and best-effort Open behavior without delivery claims.
# Stage-focused transportation cards

Planned cards emphasize departure. Departed and arrived cards retain departure time/driver in a compact summary and place full departure details in a collapsed disclosure. Return cards display the effective driver, occupants, capacity, stage, and Arrive or Start Return action together. At `return_started`, the same area emphasizes effective return state and correction controls, with original snapshots and history progressively disclosed.
