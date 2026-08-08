# Project Charter

## Project Name
EventFlow

## Project Type
School Event Operations Platform

## Purpose
Create a single source of truth for school events so authorized users can create, manage, confirm, and review events without relying on fragmented information in WhatsApp, phone notes, email, memory, and separate calendar entries.

## Business Problem
The current process creates friction because participant lists change frequently, driver and vehicle assignments are difficult to track, meal planning requires manual coordination, teachers need visibility into absences, and Google Calendar entries are maintained manually.

## Project Goal
Deliver a mobile-first MVP that allows authorized users to:
- Manage events in one system.
- Maintain current student and staff participant lists.
- Assign multiple drivers and vehicles.
- Track meals missed and dietary-restriction indicators.
- Search and review current, upcoming, and past events.
- Synchronize confirmed events with the school Google Calendar.
- Send plain-text event-confirmation emails.

## Primary Users
- Admin
- Staff

## Key Stakeholders
- Athletic Director
- Coaches
- Teachers
- Kitchen staff
- Drivers
- School administration

## MVP Success Criteria
- Authorized users can create and manage events from mobile or desktop.
- Firestore is the system of record.
- EventFlow shows current participants, drivers, vehicles, meals missed, and dietary-restriction indicators.
- Confirming an event creates exactly one Calendar event.
- Editing a confirmed event updates the linked Calendar event.
- Cancelling a confirmed event removes the linked Calendar event.
- Inactive master-data records cannot be newly selected.
- Historical references remain intact when records are deactivated.

## Out of Scope
- Offline support
- AI
- Driver availability optimization
- Route planning
- Budgeting
- Parent portal
- Equipment inventory
- Advanced analytics
- Automatic one-year deletion
