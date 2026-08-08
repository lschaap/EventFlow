# Future Roadmap

All items are outside MVP unless formally promoted.

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
- Scheduling-conflict detection
- Vehicle-capacity warnings
- Route planning
- Transportation optimization
- Budgeting
- Equipment inventory
- Parent communication portal
- Advanced analytics

## Future Integrations
- AI / Gemini or other LLM service
- Advanced email/messaging platforms
- Analytics/reporting integrations
- Offline synchronization services if required

## AI
AI is intentionally excluded from MVP. Specific AI features should be evaluated only after the core event workflow is stable and useful.

## Data Retention
A future retention process may permanently delete events older than one year if the school decides that is appropriate.
