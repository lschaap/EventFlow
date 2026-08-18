# Workflows

# Staff and Admin Workflows

## 01 - Authenticate User
User → Google authentication → approved active EventFlow user? → Dashboard or access denied.

## 02 - Create Event
User enters required information → validation → save to Firestore as Draft.

## 03 - Edit Event
Open event → edit → validation → update same document → update `updatedAt`.

## 04 - Confirm Event
Draft → validate persisted name, activity, event type, departure, return, return-after-departure, and location → user confirmation prompt → update the existing event to Confirmed and update `updatedAt`. Calendar synchronization and confirmation email are pending separate milestones; confirmation leaves Calendar fields unchanged.

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

Admin adds active vehicles and eligible departure drivers, then bulk-assigns or individually moves active participants among vehicles or Unassigned. Driver assignment atomically ensures staff participation and occupancy. Return drivers and occupants initially copy departure and can then be revised independently. Each leg separately displays capacity, warnings, and overlap conflicts.

### T2 - Depart

Staff or Admin selects **Depart** on a planned trip. EventFlow validates the departure driver and presents the vehicle, driver, occupants, count/capacity, overcapacity, and all unassigned departure participants. Confirmation atomically records server `departedAt`, advances the trip, reveals its return plan, and moves a confirmed event to `in_progress` on its first departure.

### T3 - Arrive at Event

Staff or Admin confirms **Arrive at Event**. EventFlow records server `arrivedAtEventAt`, advances the trip, and enables that vehicle's outbound WhatsApp preview.

### T4 - Start Return

The return equivalent of T2 validates and reviews the return plan. Confirmation records server `returnStartedAt`, advances the trip, and enables that vehicle's return preview without changing event status.

### T5 - Returned

EventFlow records server `returnedAt`; when every applicable trip is returned, it atomically completes the event. Vehicle-based events have no ordinary manual Start/Complete actions. Vehicle-free events retain them.

### T6 - Correct a begun trip or assignment

Admin uses an explicit correction action, reviews a warning, supplies a required reason, and confirms. The atomic change records the reason, Admin UID, and server timestamp. Staff cannot undo stages. Completed and cancelled events expose no normal transportation operations.

### T7 - Deactivate a vehicle

EventFlow lists affected future event names. Confirmation clears departure/return participant assignments and applicable drivers only where the event has not started and departure is still in the future. Historical and started records remain readable.

### T8 - Prepare a WhatsApp message

From Event Details, the user previews and edits an eligible message, copies it or opens WhatsApp, chooses an existing staff-only group, and sends manually. Failed handoff copies the text and explains the fallback. No send state is recorded.
