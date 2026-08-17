import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEvents } from '../services/events'
import { listActivities } from '../services/activities'
import { listEventTypes } from '../services/eventTypes'
import type { EventRecord } from '../types/models'

function formatDate(value: Date) {
  return value.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function classifyEvent(event: EventRecord) {
  const now = new Date()
  if (event.returnDateTime < now) {
    return 'past'
  }
  if (event.departureDateTime > now) {
    return 'upcoming'
  }
  return 'current'
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([])
  const [activitiesMap, setActivitiesMap] = useState<Record<string, string>>({})
  const [eventTypesMap, setEventTypesMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [loaded, activities, eventTypes] = await Promise.all([listEvents(), listActivities(), listEventTypes()])
          
        setEvents(loaded)
        setActivitiesMap(Object.fromEntries(activities.map((a) => [a.activityId, a.name])))
        setEventTypesMap(Object.fromEntries(eventTypes.map((t) => [t.eventTypeId, t.name])))
      } catch {
        setError('Failed to load events.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const grouped = useMemo(
    () => ({
      upcoming: events.filter((event) => classifyEvent(event) === 'upcoming'),
      current: events.filter((event) => classifyEvent(event) === 'current'),
      past: events.filter((event) => classifyEvent(event) === 'past'),
    }),
    [events]
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="mt-2 text-sm text-slate-600">Browse upcoming, current, and past events.</p>
        </div>
        <Link to="/events/new" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
          New Event
        </Link>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">Loading events…</div>
      ) : (
        ['upcoming', 'current', 'past'].map((group) => {
          const items = grouped[group as keyof typeof grouped]
          return (
            <section key={group} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold capitalize">{group} events</h2>
              {items.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">No {group} events.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {items.map((event) => (
                    <Link
                      key={event.eventId}
                      to={`/events/${event.eventId}`}
                      className="block rounded-3xl border border-slate-200 p-4 transition hover:border-slate-900"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-lg font-semibold">{event.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{event.location}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                          {event.status}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                          <div className="font-medium">Dates</div>
                          <div>{formatDate(event.departureDateTime)} → {formatDate(event.returnDateTime)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                          <div className="font-medium">Counts</div>
                          <div>{event.studentParticipantCount} students · {event.staffParticipantCount} staff · {event.participantCount} total</div>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                          <div className="font-medium">Activity / Type</div>
                          <div>{activitiesMap[event.activityId] ?? event.activityId} · {eventTypesMap[event.eventTypeId] ?? event.eventTypeId}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                          <div className="font-medium">Meals missed</div>
                          <div>{event.mealsMissed.join(', ') || 'None'}</div>
                        </div>
                      </div>
                      {event.hasDietaryRestrictions ? <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">Dietary restrictions</div> : null}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )
        })
      )}
    </div>
  )
}
