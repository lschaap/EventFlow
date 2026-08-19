# Workflows

## Implemented Pre-Departure Grouped Planning (CR-001)

Active approved Admin and Staff users may manage planned vehicles, either leg's driver, mirroring, and departure passenger assignments for every event. An individual or bulk departure move atomically mirrors return for ordinary passengers. An independently selected return driver's `returnVehicleId` remains fixed to the vehicle they will drive, while their departure assignment remains their actual outbound plan. Clearing or replacing a driver changes only the role; the former driver remains a participant with their passenger fields. Capacity is recalculated per leg and warns without blocking. Mixed student/staff bulk requests are limited to 100 and either commit completely or make no changes.

After the future Depart action, departure groups become historical/read-only and return groups will use the same multi-group selection and Move selected interaction until Start Return. That switching behavior, lifecycle actions, snapshots, and corrections remain planned rather than active.

Participant management and departure planning use one list. Add Student, Add Staff, and Add Vehicle appear at the top; additions immediately enter Unassigned and removals immediately disappear from every departure group. Removing a staff occupant also clears every departure/return driver reference for that staff member in the event in the same transaction. Individual moves verify the committed assignment and display an error rather than silently accepting an unsaved move. Bulk Apply uses one secured Firestore client transaction and shows `Bulk assignment failed. Please try again or try individual assignment.` for every failure. Return occupants remain hidden before Depart, and the return-driver selector remains hidden while return transportation is confirmed to match departure. Later, each departed vehicle card receives its own Edit return vehicle assignments button; that control is not active yet.

# Staff and Admin Workflows

## 01 - Authenticate User
User → Google authentication → approved active EventFlow user? → Dashboard or access denied.

## 02 - Create Event
User enters required information → validation → save to Firestore as Draft.

## 03 - Edit Event
Open event → edit → validation → update same document → update `updatedAt`.

## 04 - Confirm Event
Draft → validate persisted name, activity, event type, departure, return, return-after-departure, and location → user confirmation prompt → update the existing event to Confirmed and update `updatedAt`. Calendar synchronization is a pending separate milestone; confirmation leaves Calendar fields unchanged. Automated email is not MVP scope.

## 05 - Complete Event
Mark Completed → set `completedAt`. Completed events remain editable.

## 06 - Cancel Event
Mark Cancelled → set `cancelledAt` → if Calendar event exists, run Calendar Delete.

## 07 - Add Student Participant
Select active student → prevent duplicate → create/restore active relationship → recalculate counts and dietary indicator.

## 08 - Remove Student Participant
Set relationship to removed → record remover/time → recalculate counts and dietary indicator.

## 09 - Add Staff Participant
Select active staff → prevent duplicate → create/restore active relationship → recalculate counts and dietary indicator.

## 10 - Remove Staff Participant
If the staff participant is an active driver, warn that continuing also removes the driver assignment, assigned vehicle, and driver role → cancel with no writes or confirm → atomically set the applicable relationships to removed → record remover/time → recalculate counts and dietary indicator.

## 11 - Assign Driver
Select active staff where `canDrive = true` → reject overlapping participation → prevent duplicate → optionally select active vehicle → atomically add the staff participant when needed and create the driver assignment.

## 12 - Remove Driver
Set assignment removed → record remover/time.

## 13 - Assign / Change Vehicle
Select active vehicle → reject assignment when that vehicle is already used by the same event or by an event with an overlapping departure-to-return window → update driver assignment.

## 14 - Remove Vehicle
Set `vehicleId = null` on driver assignment.

## 15 - Calendar Create
Confirmed + no `calendarEventId` → sync pending → server creates Calendar event → on success store ID/status/time; on failure preserve Firestore and record error.

## 16 - Calendar Update
Confirmed event changes + Calendar ID exists → sync pending → update same Calendar event → record success/failure.

## 17 - Calendar Delete
Cancelled + Calendar ID exists → delete linked Calendar event → clear ID/set not_synced on success; record failed status/error on failure.

## 18 - Calendar Sync Failure
Do not roll back EventFlow record → set failed status → store concise error → show user.

## 19 - Search and Filter Events
Search/filter by name, date, status, activity, event type, location, student, staff participant, or driver.

## 20 - View Event Summary
Display date/times, participant counts, meals, dietary indicator, drivers, vehicle status, and event status.

# Admin-Only Workflows

## A01 - Create Student
Create student with grade 6-12, active status, dietary restrictions, and optional notes.

## A02 - Update Student
Update student without changing historical references.

## A03 - Activate / Deactivate Student
Inactive students disappear from future participant selectors while historical references remain.

## A04 - Create Staff
Create staff master record.

## A05 - Update Staff
Update identity/title, dietary restrictions, and operational fields.

## A06 - Activate / Deactivate Staff
Inactive staff disappear from future participant/driver selectors while history remains.

## A07 - Change Driver Eligibility
Set `canDrive`. False removes staff from driver selector but does not prevent event participation.

## A08 - Create Vehicle
Create name, capacity, active status.

## A09 - Update Vehicle
Update name/capacity/status.

## A10 - Activate / Deactivate Vehicle
Before deactivation, list future events whose departure is later than the current time and request confirmation. On confirmation, clear only `vehicleId` from those assignments; drivers remain assigned and past/current assignments remain unchanged. Inactive vehicles disappear from future selectors.

## A11 - Create Activity
Create configurable activity.

## A12 - Update Activity
Update display value/sort order.

## A13 - Activate / Deactivate Activity
Inactive activity disappears from new selections while history remains.

## A14 - Create Event Type
Create configurable event type.

## A15 - Update Event Type
Update display value/sort order.

## A16 - Activate / Deactivate Event Type
Inactive type disappears from new selections while history remains.

## A17 - Manage Application User
Create/approve user record.

## A18 - Assign Role
Assign `admin` or `staff`.

## A19 - Activate / Deactivate Application User
Inactive user cannot access protected functionality.

## Approved Planned Transportation Workflows (CR-001)

The workflows above describe the implemented baseline. Where they describe a single event driver/vehicle assignment or universal manual completion, this approved target supersedes them.

### T1 - Plan departure and return

Admin adds vehicles and both leg drivers, then bulk-assigns or individually moves departure participants. Before Depart, return passengers mirror departure and cannot be edited independently. Capacity means total seats including the driver. Each leg has independent warnings and overlap validation.

During the driver-planning milestone, new trips set `returnDriverMirrorsDeparture = true`. Departure changes update both drivers while true. Explicit return selection or clear makes the return independent; Same as departure restores mirroring and copies the current departure driver. Future Depart will end mirroring after its snapshot, but is not implemented in this milestone.

### T2 - Depart

Staff or Admin selects **Depart**. Review shows the vehicle, driver, occupants, total-seat capacity, overcapacity, and every unassigned active departure participant. Cancel writes nothing. Confirmation atomically records `departedAt`, advances the trip, snapshots return assignments for that vehicle's occupants, reveals the return list, and applies first-departure status/`startedAt`.

### T2A - Edit return passengers

After a vehicle departs and before the target vehicle starts return, Staff/Admin may immediately save validated individual or bulk return-passenger changes among eligible departed vehicles or Unassigned. Changes never alter departure history. Staff cannot edit drivers or vehicles. Start Return locks ordinary return editing.

### T3 - Arrive at Event

Staff or Admin confirms **Arrive at Event**. EventFlow records server `arrivedAtEventAt`, advances the trip, and enables that vehicle's outbound WhatsApp preview.

### T4 - Start Return

The return equivalent of T2 validates and reviews the return plan. Confirmation records server `returnStartedAt`, advances the trip, and enables that vehicle's return preview without changing event status.

### T5 - Returned

EventFlow records server `returnedAt`. It completes only after at least one vehicle departed and every applicable trip—active and actually departed—returned. Planned unused/removed trips do not block. Vehicle-based events have no manual Start/Complete controls.

### T5A - Operate a vehicle-free event

Staff/Admin uses Start Event to record server `startedAt` and change confirmed to in_progress. Complete Event records `completedAt` and changes confirmed or in_progress to completed. Cancelled/completed invalid actions are unavailable. No scheduler or browser/read-time behavior completes events automatically.

### T6 - Correct a begun trip or assignment

Admin uses an explicit correction action, reviews a warning, supplies a required reason, and confirms. One transaction updates stage/timestamps, overwrites latest correction metadata, and recalculates event status plus `startedAt`/`completedAt`. Cancelled remains cancelled; backward/forward corrections can move completed to in_progress and back. Staff cannot undo stages.

### T7 - Deactivate a vehicle

EventFlow lists affected future event names. Confirmation clears departure/return participant assignments and applicable drivers only where the event has not started and departure is still in the future. Historical and started records remain readable.

### T8 - Prepare a WhatsApp message

From Event Details, the user previews/edits eligible text without changing data. Copy explicitly copies. Open WhatsApp makes a best-effort attempt while the preview remains visible and instructs use of Copy if it does not open. The user selects a staff-only group and sends manually. EventFlow claims/stores no launch, send, delivery, receipt, or attempt state.
