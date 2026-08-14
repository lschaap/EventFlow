import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { cancelEvent, completeEvent, getEventById } from '../services/events'
import { listActivities } from '../services/activities'
import { listEventTypes } from '../services/eventTypes'
import type { EventRecord } from '../types/models'

function formatDate(value: Date) {
  return value.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function EventDetailsPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [activitiesMap, setActivitiesMap] = useState<Record<string, string>>({})
  const [eventTypesMap, setEventTypesMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvent() {
      if (!eventId) {
        setError('Missing event ID.')
        setLoading(false)
        return
      }

      try {
        const [loaded, activities, eventTypes] = await Promise.all([getEventById(eventId), listActivities(), listEventTypes()])

        if (!loaded) {
          setError('Event not found.')
          return
        }

        setEvent(loaded)
        setActivitiesMap(Object.fromEntries(activities.map((a) => [a.activityId, a.name])))
        setEventTypesMap(Object.fromEntries(eventTypes.map((t) => [t.eventTypeId, t.name])))
      } catch {
        setError('Unable to load event details.')
      } finally {
        setLoading(false)
      }
    }

    void loadEvent()
  }, [eventId])

  const handleAction = async (action: 'complete' | 'cancel') => {
    if (!eventId) return
    setSaving(true)
    setError(null)

    try {
      if (action === 'complete') {
        await completeEvent(eventId)
      } else {
        await cancelEvent(eventId)
      }
      const refreshed = await getEventById(eventId)
      setEvent(refreshed)
    } catch {
      setError('Unable to update event. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Event details</h1>
          <p className="mt-2 text-sm text-slate-600">Review the selected event and manage its status.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-slate-900"
          >
            Back to list
          </button>
          {event && (
            <Link
              to={`/events/${event.eventId}/edit`}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Edit event
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">Loading event details…</div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">{error}</div>
      ) : event ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{event.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{event.location}</p>
              </div>
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                {event.status}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium">Activity</div>
                <div>{activitiesMap[event.activityId] ?? event.activityId}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium">Event type</div>
                <div>{eventTypesMap[event.eventTypeId] ?? event.eventTypeId}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium">Departure</div>
                <div>{formatDate(event.departureDateTime)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium">Return</div>
                <div>{formatDate(event.returnDateTime)}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Operational details</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div>
                  <span className="font-medium">Purpose:</span> {event.purpose || 'Not specified'}
                </div>
                <div>
                  <span className="font-medium">Meals missed:</span> {event.mealsMissed.length ? event.mealsMissed.join(', ') : 'None'}
                </div>
                <div>
                  <span className="font-medium">Equipment needed:</span> {event.equipmentNeeded.join(', ') || 'None'}
                </div>
                <div>
                  <span className="font-medium">Notes:</span> {event.notes || 'None'}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Event management</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div>
                  <span className="font-medium">Created by:</span> {event.createdByUserName}
                </div>
                <div>
                  <span className="font-medium">Created at:</span> {formatDate(event.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Last updated:</span> {formatDate(event.updatedAt)}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={saving || event.status === 'cancelled' || event.status === 'completed'}
                  onClick={() => void handleAction('cancel')}
                  className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel event
                </button>
                <button
                  type="button"
                  disabled={saving || event.status === 'completed' || event.status === 'cancelled'}
                  onClick={() => void handleAction('complete')}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Mark completed
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
