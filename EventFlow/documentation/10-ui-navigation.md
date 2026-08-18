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

The planned Event Details page adds transportation grouped by vehicle and **Unassigned**, with separate departure/return views. It shows drivers, participant names, counts, total-seat capacity including driver, warnings, stage, and lifecycle times. Before Depart return mirrors departure and is hidden as an independent list; Depart snapshots and reveals that vehicle's return list.

Admins edit departure passengers, both drivers, vehicles, corrections, and the default destination inside Admin Configuration > Vehicles. Staff/Admin may edit return passengers for eligible departed vehicles until Start Return; Staff cannot edit drivers or departure. Both roles see the next valid forward action. Vehicle-based events hide manual Start/Complete; vehicle-free events retain them with planned status/timestamps.

Depart and Start Return open an explicit review of vehicle, driver, occupants, count/capacity, overcapacity, and all event participants unassigned for that leg. Warnings do not disable confirmation. Corrections use a separate warning and required-reason confirmation.

WhatsApp controls appear only on Event Details: confirmation after confirmation, outbound after arrival, return after return starts. Preview edits do not change EventFlow. Copy explicitly copies. Open WhatsApp is best-effort; preview remains visible with instructions to use Copy if it does not open. The UI never reports opened/sent/delivered/received.
