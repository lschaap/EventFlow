# Project Charter

## Project Name
EventFlow

## Project Type
School Event Operations Platform

## Purpose
Create a single source of truth for school events so authorized users can create, manage, confirm, and review events without relying on fragmented information in phone notes, email, memory, separate calendar entries, or WhatsApp as the system of record. WhatsApp remains an intentional user-initiated communication handoff.

## Business Problem
The current process creates friction because participant lists change frequently, driver and vehicle assignments are difficult to track, meal planning requires manual coordination, teachers need visibility into absences, and Google Calendar entries are maintained manually.

## Project Goal
Deliver a mobile-first MVP that allows authorized users to:
- Manage events in one system.
- Maintain current student and staff participant lists.
- Plan participant departure/return vehicles and independent per-leg drivers.
- Track per-vehicle operational stages, capacity, and unassigned participants.
- Track meals missed and dietary-restriction indicators.
- Search and review current, upcoming, and past events.
- Synchronize confirmed events with the school Google Calendar.
- Preserve a post-MVP option for editable, user-initiated WhatsApp staff-group handoff without making messaging part of MVP delivery.

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

The transportation lifecycle, per-leg assignments, vehicle-based status automation, and manual vehicle-free lifecycle are approved target-MVP scope under CR-001 and are not yet implemented. WhatsApp handoff is explicitly post-MVP and is not an MVP UAT or go-live requirement.

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
