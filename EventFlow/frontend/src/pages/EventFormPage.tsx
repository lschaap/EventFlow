import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listActiveActivities, listActivities } from '../services/activities'
import { listActiveEventTypes, listEventTypes } from '../services/eventTypes'
import { createEvent, getEventById, updateEvent } from '../services/events'
import { useAuth } from '../context/AuthContext'
import type { EventFormValues, EventRecord, MealType } from '../types/models'

const mealOptions: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']

const emptyForm: EventFormValues = {
  name: '',
  activityId: '',
  eventTypeId: '',
  departureDateTime: '',
  returnDateTime: '',
  location: '',
  purpose: '',
  mealsMissed: [],
  equipmentNeeded: '',
  notes: '',
}

export default function EventFormPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { appUser, firebaseUser } = useAuth()
  const [formValues, setFormValues] = useState<EventFormValues>(emptyForm)
  const [activities, setActivities] = useState<{ activityId: string; name: string }[]>([])
  const [eventTypes, setEventTypes] = useState<{ eventTypeId: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [activityRecords, eventTypeRecords] = await Promise.all([listActiveActivities(), listActiveEventTypes()])
        const activeActivities = activityRecords.map((record) => ({ activityId: record.activityId, name: record.name }))
        const activeEventTypes = eventTypeRecords.map((record) => ({ eventTypeId: record.eventTypeId, name: record.name }))
        setActivities(activeActivities)
        setEventTypes(activeEventTypes)

        let existingEvent = null
        if (eventId) {
          existingEvent = await getEventById(eventId)
          if (existingEvent) {
            setFormValues({
              name: existingEvent.name,
              activityId: existingEvent.activityId,
              eventTypeId: existingEvent.eventTypeId,
              departureDateTime: existingEvent.departureDateTime.toISOString().slice(0, 16),
              returnDateTime: existingEvent.returnDateTime.toISOString().slice(0, 16),
              location: existingEvent.location,
              purpose: existingEvent.purpose ?? '',
              mealsMissed: existingEvent.mealsMissed,
              equipmentNeeded: existingEvent.equipmentNeeded.join(', '),
              notes: existingEvent.notes ?? '',
            })
          }
        }

        // Preserve historical selections: if the event references an inactive activity or event type,
        // fetch the full lists and add the selected item to the dropdown so it remains selectable.
        if (eventId && existingEvent) {
          const [allActivities, allEventTypes] = await Promise.all([listActivities(), listEventTypes()])
          const selectedActivity = allActivities.find((a) => a.activityId === existingEvent.activityId)
          const selectedEventType = allEventTypes.find((t) => t.eventTypeId === existingEvent.eventTypeId)

          if (selectedActivity && !activeActivities.find((a) => a.activityId === selectedActivity.activityId)) {
            setActivities((cur) => [...cur, { activityId: selectedActivity.activityId, name: selectedActivity.name }])
          }
          if (selectedEventType && !activeEventTypes.find((t) => t.eventTypeId === selectedEventType.eventTypeId)) {
            setEventTypes((cur) => [...cur, { eventTypeId: selectedEventType.eventTypeId, name: selectedEventType.name }])
          }
        }
      } catch (err) {
        setError('Failed to load form data.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [eventId])

  const isEdit = Boolean(eventId)
  const title = isEdit ? 'Edit Event' : 'Create Event'

  const validate = useMemo(() => {
    const errors: string[] = []

    if (!formValues.name.trim()) errors.push('Event name is required.')
    if (!formValues.activityId.trim()) errors.push('Activity is required.')
    if (!formValues.eventTypeId.trim()) errors.push('Event type is required.')
    if (!formValues.departureDateTime.trim()) errors.push('Departure date/time is required.')
    if (!formValues.returnDateTime.trim()) errors.push('Return date/time is required.')
    if (!formValues.location.trim()) errors.push('Location is required.')
    if (formValues.returnDateTime && formValues.departureDateTime && new Date(formValues.returnDateTime) <= new Date(formValues.departureDateTime)) {
      errors.push('Return must occur after departure.')
    }

    return errors
  }, [formValues])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (validate.length > 0) {
      setError(validate.join(' '))
      return
    }

    if (!appUser) {
      setError('Unable to save event without an approved EventFlow user.')
      return
    }

    setSaving(true)

    try {
      if (isEdit && eventId) {
        await updateEvent(eventId, formValues)
        navigate(`/events/${eventId}`)
      } else {
        const userName = firebaseUser?.displayName || firebaseUser?.email || appUser.email
        const newEventId = await createEvent(formValues, appUser.userId, userName)
        navigate(`/events/${newEventId}`)
      }
    } catch {
      setError('Failed to save event. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const toggleMeal = (meal: MealType) => {
    setFormValues((current) => ({
      ...current,
      mealsMissed: current.mealsMissed.includes(meal)
        ? current.mealsMissed.filter((value) => value !== meal)
        : [...current.mealsMissed, meal],
    }))
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">Create or update an event with the required operational details.</p>

      {loading ? (
        <div className="mt-10 text-sm text-slate-600">Loading form…</div>
      ) : (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-800">
              Event name
              <input
                value={formValues.name}
                onChange={(event) => setFormValues({ ...formValues, name: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-800">
              Activity
              <select
                value={formValues.activityId}
                onChange={(event) => setFormValues({ ...formValues, activityId: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
              >
                <option value="">Select activity</option>
                {activities.map((activity) => (
                  <option key={activity.activityId} value={activity.activityId}>
                    {activity.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-800">
              Event type
              <select
                value={formValues.eventTypeId}
                onChange={(event) => setFormValues({ ...formValues, eventTypeId: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
              >
                <option value="">Select event type</option>
                {eventTypes.map((eventType) => (
                  <option key={eventType.eventTypeId} value={eventType.eventTypeId}>
                    {eventType.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-800">
              Location
              <input
                value={formValues.location}
                onChange={(event) => setFormValues({ ...formValues, location: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-800">
              Departure date/time
              <input
                type="datetime-local"
                value={formValues.departureDateTime}
                onChange={(event) => setFormValues({ ...formValues, departureDateTime: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-800">
              Return date/time
              <input
                type="datetime-local"
                value={formValues.returnDateTime}
                onChange={(event) => setFormValues({ ...formValues, returnDateTime: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm text-slate-800">
            Purpose
            <textarea
              value={formValues.purpose}
              onChange={(event) => setFormValues({ ...formValues, purpose: event.target.value })}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
              rows={3}
            />
          </label>

          <div className="space-y-2 text-sm text-slate-800">
            <span>Meals missed</span>
            <div className="flex flex-wrap gap-2">
              {mealOptions.map((meal) => (
                <button
                  type="button"
                  key={meal}
                  onClick={() => toggleMeal(meal)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    formValues.mealsMissed.includes(meal)
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>

          <label className="space-y-2 text-sm text-slate-800">
            Equipment needed (comma-separated)
            <input
              value={formValues.equipmentNeeded}
              onChange={(event) => setFormValues({ ...formValues, equipmentNeeded: event.target.value })}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
              placeholder="e.g. Jerseys, Volleyballs"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-800">
            Notes
            <textarea
              value={formValues.notes}
              onChange={(event) => setFormValues({ ...formValues, notes: event.target.value })}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
              rows={3}
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
