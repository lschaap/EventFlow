# Project Vision

## Product Name
EventFlow

## Vision Statement
EventFlow will provide school staff with one mobile-friendly operational system for creating, coordinating, confirming, and reviewing school events.

## Current-State Problem
Event planning currently depends on WhatsApp, phone notes, email, Google Calendar, and staff memory. This makes it difficult to maintain one accurate version of who is attending, who is driving, which vehicles are assigned, which meals will be missed, whether dietary restrictions are present, where and when the event occurs, and whether it is confirmed or cancelled.

## Future-State Experience
Authorized users can:
1. Find or create an event.
2. Add students and staff participants.
3. Plan departure vehicles for participants and independent drivers for each leg.
4. Review vehicle capacity/unassigned participants and operate each vehicle through its trip stages.
5. Review meals missed and dietary-restriction indicators.
6. Confirm the event.
7. Rely on EventFlow to synchronize with Google Calendar.
8. Search later for current, upcoming, or past events.
9. Prepare an editable WhatsApp message for manual handoff while treating EventFlow as the source of truth.

## Primary Goals
- Reduce manual coordination.
- Reduce conflicting event information.
- Maintain a reliable source of truth.
- Improve transportation visibility.
- Improve teacher and kitchen visibility.
- Reduce manual Calendar administration.
- Make event information usable from a phone.

## MVP Scope
- Firebase Authentication
- Approved-user access
- Admin and Staff roles
- Event CRUD and statuses
- Student and staff participants
- Participant departure/return vehicle assignments
- Independent per-leg drivers and per-vehicle operational stages
- Capacity and unassigned-participant review
- Automatic vehicle-based status changes and manual vehicle-free lifecycle
- Student, staff, vehicle, activity, event-type master data
- Active/inactive handling
- Upcoming/current/past event views
- Search/filtering
- Participant counts
- Meals missed
- Dietary-restriction indicator
- Google Calendar synchronization
- Calendar sync status/error tracking
- User-initiated WhatsApp message preparation and handoff
- Mobile-first interface

## Out of Scope
- Offline support
- AI
- Automated driver availability
- Route optimization
- Budgeting
- Parent portal
- Equipment inventory
- Advanced analytics
- Full audit log
- Automatic retention deletion

## Success Indicators
- Staff can use EventFlow—not WhatsApp or phone notes—as the operational source of truth while using WhatsApp for intentional communication handoff.
- Staff can find current participant lists from one location.
- Event lists answer common operational questions without opening every record.
- Confirmed events synchronize reliably to Calendar.
- Kitchen staff can identify meals missed and dietary-restriction presence.
- Teachers can access student participants sorted by grade.
- Core flows work well on mobile.

The transportation and WhatsApp capabilities above are approved target-MVP scope in CR-001 and are not yet implemented.
