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

Student and Staff tabs use an Add button to reveal the creation form. Editing expands the selected record in place.
