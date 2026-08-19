import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { listActivities } from '../services/activities'
import { listEvents } from '../services/events'
import { listEventTypes } from '../services/eventTypes'
import { listAllActiveStudentParticipants } from '../services/eventParticipants'
import { listAllActiveStaffParticipants } from '../services/eventStaffParticipants'
import { buildEventTransportationSummary } from '../services/eventTransportationSummary'
import { listAllActiveEventVehicleTrips } from '../services/eventVehicleTrips'
import { listStaff } from '../services/staff'
import { listVehicles } from '../services/vehicles'
import type { EventParticipantRecord, EventRecord, EventStaffParticipantRecord, EventVehicleTripRecord, StaffRecord, VehicleRecord } from '../types/models'

function formatDate(value: Date) { return value.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) }
function classifyEvent(event: EventRecord) { const now = new Date(); return event.returnDateTime < now ? 'past' : event.departureDateTime > now ? 'upcoming' : 'current' }

export default function EventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([])
  const [activitiesMap, setActivitiesMap] = useState<Record<string, string>>({})
  const [eventTypesMap, setEventTypesMap] = useState<Record<string, string>>({})
  const [trips, setTrips] = useState<EventVehicleTripRecord[]>([])
  const [studentParticipants, setStudentParticipants] = useState<EventParticipantRecord[]>([])
  const [staffParticipants, setStaffParticipants] = useState<EventStaffParticipantRecord[]>([])
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [loadedEvents, activities, eventTypes, activeTrips, activeStudents, activeStaff, staffRecords, vehicleRecords] = await Promise.all([
          listEvents(), listActivities(), listEventTypes(), listAllActiveEventVehicleTrips(), listAllActiveStudentParticipants(), listAllActiveStaffParticipants(), listStaff(), listVehicles(),
        ])
        setEvents(loadedEvents)
        setActivitiesMap(Object.fromEntries(activities.map((item) => [item.activityId, item.name])))
        setEventTypesMap(Object.fromEntries(eventTypes.map((item) => [item.eventTypeId, item.name])))
        setTrips(activeTrips); setStudentParticipants(activeStudents); setStaffParticipants(activeStaff); setStaff(staffRecords); setVehicles(vehicleRecords)
      } catch (reason) {
        setError(reason instanceof Error ? `Failed to load events: ${reason.message}` : 'Failed to load events.')
      } finally { setLoading(false) }
    }
    void load()
  }, [])

  const grouped = useMemo(() => ({
    upcoming: events.filter((event) => classifyEvent(event) === 'upcoming'),
    current: events.filter((event) => classifyEvent(event) === 'current'),
    past: events.filter((event) => classifyEvent(event) === 'past'),
  }), [events])

  return <div className="space-y-8">
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-semibold">Events</h1><p className="mt-2 text-sm text-slate-600">Browse upcoming, current, and past events.</p></div><Link to="/events/new" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">New Event</Link></div>
    {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
    {loading ? <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">Loading events…</div> : (['upcoming', 'current', 'past'] as const).map((group) => <section key={group} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold capitalize">{group} events</h2>
      {grouped[group].length === 0 ? <p className="mt-4 text-sm text-slate-600">No {group} events.</p> : <div className="mt-4 space-y-4">{grouped[group].map((event) => {
        const summary = buildEventTransportationSummary(event, trips, studentParticipants, staffParticipants, vehicles, staff)
        return <Link key={event.eventId} to={`/events/${event.eventId}`} className="block rounded-3xl border border-slate-200 p-4 transition hover:border-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-lg font-semibold">{event.name}</p><p className="mt-1 text-sm text-slate-600">{event.location}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">{event.status}</span></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2"><Info title="Dates">{formatDate(event.departureDateTime)} → {formatDate(event.returnDateTime)}</Info><Info title="Counts">{event.studentParticipantCount} students · {event.staffParticipantCount} staff · {event.participantCount} total</Info><Info title="Activity / Type">{activitiesMap[event.activityId] ?? event.activityId} · {eventTypesMap[event.eventTypeId] ?? event.eventTypeId}</Info><Info title="Meals missed">{event.mealsMissed.join(', ') || 'None'}</Info></div>
          {event.hasDietaryRestrictions ? <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">Dietary restrictions</div> : null}
          {summary.hasPlan ? <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700"><p><span className="font-medium">Vehicles ({summary.activeVehicleCount}):</span> {summary.vehicleNames.join(', ')}</p><p><span className="font-medium">Departure drivers:</span> {summary.departureDriverNames.join(', ') || 'None'}</p>{summary.returnDriverDifferences.length ? <p><span className="font-medium">Different return drivers:</span> {summary.returnDriverDifferences.join('; ')}</p> : null}<p><span className="font-medium">Departure occupants:</span> {summary.assignedDepartureOccupantCount}/{event.participantCount} · Capacity {summary.totalDepartureCapacity}</p></div> : <div className="mt-3 rounded-2xl border border-slate-300 bg-slate-50 p-3 text-sm font-semibold text-slate-700">No transportation plan.</div>}
          {summary.unassignedDepartureCount > 0 ? <Warning>Transportation Incomplete: {summary.unassignedDepartureCount} active participant(s) are unassigned for departure.</Warning> : null}
          {summary.hasOverCapacity ? <Warning>Transportation Over Capacity: at least one departure vehicle or the overall departure plan exceeds capacity.</Warning> : null}
          {summary.participantCountMismatch ? <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">Transportation data issue: {summary.activeParticipantRelationshipCount} active participant relationship(s) do not match the stored event count of {event.participantCount}.</div> : null}
        </Link>
      })}</div>}
    </section>)}
  </div>
}

function Info({ title, children }: { title: string; children: ReactNode }) { return <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700"><div className="font-medium">{title}</div><div>{children}</div></div> }
function Warning({ children }: { children: ReactNode }) { return <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{children}</div> }
