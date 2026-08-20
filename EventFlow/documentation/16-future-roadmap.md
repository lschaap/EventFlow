# Future Roadmap

All items are outside MVP unless formally promoted.

## Approved Change Queue

CR-001, [Transportation Trip Lifecycle](change-requests/CR-001-transportation-trip-lifecycle.md), is approved for implementation and is no longer an unapproved future idea. It covers per-leg participant and driver assignments, the five-stage lifecycle, status automation, capacity review, corrections, default destination, and vehicle-deactivation cleanup. WhatsApp is no longer part of CR-001 MVP acceptance.

## Post-MVP WhatsApp Handoff

Preserve a future user-initiated Event Details workflow for confirmation, outbound, and return text. The user may preview/edit, explicitly Copy, or make a best-effort Open WhatsApp handoff, then choose an existing staff-only group and press Send. EventFlow remains the source of truth and never sends automatically, discovers groups, uses a paid/API integration, stores recipients/credentials/templates, or claims/persists launch, send, delivery, receipt, or attempt state. This is not required for MVP UAT or go-live, and transportation lifecycle actions must work without it.

## Things to Fix

1. When changing an event's departure or return date/time, list every current participant who is assigned to another event that conflicts with the requested time. Warn the user before saving, and, after confirmation, remove those participants from the conflicting events.

## Version 1.1 - Operational Improvements
- Richer dashboard
- Improved search
- More flexible event summaries
- Better admin bulk-management
- Improved reporting
- Duplicate/copy event
- Recurring events

## Version 1.2 - Reliability and Field Use
- Offline or limited-connectivity viewing for today's events
- More robust integration retry controls
- Mobile UX improvements from pilot feedback

## Version 1.3 - Auditability
Add an `activityLog` collection for a reliable Recent Changes feed and historical audit trail.

Potential fields:
- activityLogId
- eventId
- userId
- userDisplayName
- actionType
- entityType
- entityId
- description
- createdAt
- metadata

Potential actions:
- event_created
- event_updated
- event_confirmed
- event_completed
- event_cancelled
- student_added
- student_removed
- staff_added
- staff_removed
- driver_assigned
- driver_removed
- vehicle_changed

## Version 2 - Advanced Operations
- Driver availability
- Route planning
- Transportation optimization
- Budgeting
- Equipment inventory
- Parent communication portal
- Advanced analytics

Scheduling-conflict detection and vehicle-capacity warnings are already in the implemented MVP baseline. CR-001 expands their application independently to each transportation leg.

## Future Integrations
- Optional automated confirmation email (not part of MVP; requires a separate approved change)
- AI / Gemini or other LLM service
- Advanced email/messaging platforms
- Analytics/reporting integrations
- Offline synchronization services if required

## Deferred Vehicle-Free Automation

- Automatically complete eligible vehicle-free events at `returnDateTime` using a scheduled backend process.

This is deferred to avoid scheduled infrastructure and potential billing solely for convenience. Browser-open or read-time mutations are not reliable automatic completion substitutes.

## AI
AI is intentionally excluded from MVP. Specific AI features should be evaluated only after the core event workflow is stable and useful.

## Data Retention
A future retention process may permanently delete events older than one year if the school decides that is appropriate.
