import { useEffect, useState } from 'react'
import {
  createActivity,
  listActivities,
  listActiveActivities,
  seedInitialActivities,
  updateActivity,
} from '../services/activities'
import {
  createEventType,
  listEventTypes,
  listActiveEventTypes,
  seedInitialEventTypes,
  updateEventType,
} from '../services/eventTypes'
import type { ActivityRecord, EventTypeRecord } from '../types/models'

export default function AdminConfigurationPage() {
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const [eventTypes, setEventTypes] = useState<EventTypeRecord[]>([])
  const [newActivityName, setNewActivityName] = useState('')
  const [newEventTypeName, setNewEventTypeName] = useState('')
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const [editingActivityName, setEditingActivityName] = useState('')
  const [editingEventTypeId, setEditingEventTypeId] = useState<string | null>(null)
  const [editingEventTypeName, setEditingEventTypeName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    const [activityRecords, eventTypeRecords] = await Promise.all([listActivities(), listEventTypes()])
    setActivities(activityRecords)
    setEventTypes(eventTypeRecords)
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleCreateActivity = async () => {
    if (!newActivityName.trim()) {
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await createActivity(newActivityName.trim())
      setNewActivityName('')
      await loadData()
      setMessage('Activity created.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to create activity.')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateEventType = async () => {
    if (!newEventTypeName.trim()) {
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await createEventType(newEventTypeName.trim())
      setNewEventTypeName('')
      await loadData()
      setMessage('Event type created.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to create event type.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivity = async (activity: ActivityRecord) => {
    setSaving(true)
    setMessage(null)
    try {
      await updateActivity(activity.activityId, { active: !activity.active })
      await loadData()
      setMessage('Activity updated.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update activity.')
    } finally {
      setSaving(false)
    }
  }

  const handleStartEditingActivity = (activity: ActivityRecord) => {
    setEditingActivityId(activity.activityId)
    setEditingActivityName(activity.name)
  }

  const handleSaveActivityName = async () => {
    if (!editingActivityId || !editingActivityName.trim()) {
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await updateActivity(editingActivityId, { name: editingActivityName.trim() })
      setEditingActivityId(null)
      setEditingActivityName('')
      await loadData()
      setMessage('Activity name updated.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update activity name.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelActivityEdit = () => {
    setEditingActivityId(null)
    setEditingActivityName('')
  }

  const handleToggleEventType = async (eventType: EventTypeRecord) => {
    setSaving(true)
    setMessage(null)
    try {
      await updateEventType(eventType.eventTypeId, { active: !eventType.active })
      await loadData()
      setMessage('Event type updated.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update event type.')
    } finally {
      setSaving(false)
    }
  }

  const handleStartEditingEventType = (eventType: EventTypeRecord) => {
    setEditingEventTypeId(eventType.eventTypeId)
    setEditingEventTypeName(eventType.name)
  }

  const handleSaveEventTypeName = async () => {
    if (!editingEventTypeId || !editingEventTypeName.trim()) {
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await updateEventType(editingEventTypeId, { name: editingEventTypeName.trim() })
      setEditingEventTypeId(null)
      setEditingEventTypeName('')
      await loadData()
      setMessage('Event type updated.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update event type name.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEventTypeEdit = () => {
    setEditingEventTypeId(null)
    setEditingEventTypeName('')
  }

  const handleSeed = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await seedInitialActivities()
      await seedInitialEventTypes()
      await loadData()
      setMessage('Seeded initial activities and event types.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Seeding failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin Configuration</h1>
            <p className="mt-1 text-sm text-slate-600">Manage activities and event types for EventFlow.</p>
          </div>
          <button
            type="button"
            onClick={handleSeed}
            disabled={saving}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Seed initial values
          </button>
        </div>
        {message ? <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Activities</h2>
          <p className="mt-2 text-sm text-slate-600">Only active activities are available when creating events.</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-medium text-slate-800">
              New activity
              <input
                type="text"
                value={newActivityName}
                onChange={(event) => setNewActivityName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900"
                placeholder="Activity name"
              />
            </label>
            <button
              type="button"
              onClick={handleCreateActivity}
              disabled={saving || !newActivityName.trim()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              Add Activity
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-600">Loading activities…</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.activityId} className="flex flex-col rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    {editingActivityId === activity.activityId ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingActivityName}
                          onChange={(event) => setEditingActivityName(event.target.value)}
                          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleSaveActivityName}
                            disabled={saving || !editingActivityName.trim()}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelActivityEdit}
                            disabled={saving}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium">{activity.name}</p>
                        <p className="mt-1 text-sm text-slate-600">Sort order: {activity.sortOrder}</p>
                      </>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
                    <button
                      type="button"
                      onClick={() => void handleToggleActivity(activity)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activity.active ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                      {activity.active ? 'Deactivate' : 'Activate'}
                    </button>
                    {editingActivityId !== activity.activityId ? (
                      <button
                        type="button"
                        onClick={() => handleStartEditingActivity(activity)}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Event Types</h2>
          <p className="mt-2 text-sm text-slate-600">Only active event types are available when creating events.</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-medium text-slate-800">
              New event type
              <input
                type="text"
                value={newEventTypeName}
                onChange={(event) => setNewEventTypeName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900"
                placeholder="Event type name"
              />
            </label>
            <button
              type="button"
              onClick={handleCreateEventType}
              disabled={saving || !newEventTypeName.trim()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              Add Event Type
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-600">Loading event types…</p>
            ) : (
              eventTypes.map((eventType) => (
                <div key={eventType.eventTypeId} className="flex flex-col rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    {editingEventTypeId === eventType.eventTypeId ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingEventTypeName}
                          onChange={(event) => setEditingEventTypeName(event.target.value)}
                          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleSaveEventTypeName}
                            disabled={saving || !editingEventTypeName.trim()}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEventTypeEdit}
                            disabled={saving}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium">{eventType.name}</p>
                        <p className="mt-1 text-sm text-slate-600">Sort order: {eventType.sortOrder}</p>
                      </>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
                    <button
                      type="button"
                      onClick={() => void handleToggleEventType(eventType)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${eventType.active ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                      {eventType.active ? 'Deactivate' : 'Activate'}
                    </button>
                    {editingEventTypeId !== eventType.eventTypeId ? (
                      <button
                        type="button"
                        onClick={() => handleStartEditingEventType(eventType)}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
