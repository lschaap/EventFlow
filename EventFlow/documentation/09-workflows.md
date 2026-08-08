# Workflows

# Staff and Admin Workflows

## 01 - Authenticate User
User → Google authentication → approved active EventFlow user? → Dashboard or access denied.

## 02 - Create Event
User enters required information → validation → save to Firestore as Draft.

## 03 - Edit Event
Open event → edit → validation → update same document → update `updatedAt`.

## 04 - Confirm Event
Draft → required operational information present? → Confirmed → Calendar sync pending → Calendar Create → plain-text confirmation email.

## 05 - Complete Event
Mark Completed → set `completedAt`. Completed events remain editable.

## 06 - Cancel Event
Mark Cancelled → set `cancelledAt` → if Calendar event exists, run Calendar Delete.

## 07 - Add Student Participant
Select active student → prevent duplicate → create/restore active relationship → recalculate counts and dietary indicator.

## 08 - Remove Student Participant
Set relationship to removed → record remover/time → recalculate counts and dietary indicator.

## 09 - Add Staff Participant
Select active staff → prevent duplicate → create/restore active relationship → recalculate counts.

## 10 - Remove Staff Participant
Set relationship to removed → record remover/time → recalculate counts.

## 11 - Assign Driver
Select active staff where `canDrive = true` → prevent duplicate → optionally select active vehicle → create assignment.

## 12 - Remove Driver
Set assignment removed → record remover/time.

## 13 - Assign / Change Vehicle
Select active vehicle → prevent duplicate active vehicle on same event → update driver assignment.

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
Update identity/title and operational fields.

## A06 - Activate / Deactivate Staff
Inactive staff disappear from future participant/driver selectors while history remains.

## A07 - Change Driver Eligibility
Set `canDrive`. False removes staff from driver selector but does not prevent event participation.

## A08 - Create Vehicle
Create name, capacity, active status.

## A09 - Update Vehicle
Update name/capacity/status.

## A10 - Activate / Deactivate Vehicle
Inactive vehicles disappear from future selectors while history remains.

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
