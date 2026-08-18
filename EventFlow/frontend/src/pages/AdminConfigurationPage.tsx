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
import type { StudentRecord } from '../types/models'
import { createStudent, listStudents, listActiveStudents, updateStudent } from '../services/students'
import StaffManagementPage from './StaffManagementPage'
import VehicleManagementPage from './VehicleManagementPage'

type AdminTab = 'students' | 'staff' | 'vehicles' | 'eventTypes' | 'activities'

export default function AdminConfigurationPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('students')
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const [eventTypes, setEventTypes] = useState<EventTypeRecord[]>([])
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [showStudentCreate, setShowStudentCreate] = useState(false)
  const [newStudentFirstName, setNewStudentFirstName] = useState('')
  const [newStudentLastName, setNewStudentLastName] = useState('')
  const [newStudentDisplayName, setNewStudentDisplayName] = useState('')
  const [newStudentGrade, setNewStudentGrade] = useState<number | ''>('')
  const [newStudentDietary, setNewStudentDietary] = useState('')
  const [newStudentNotes, setNewStudentNotes] = useState('')
  const [newStudentActive, setNewStudentActive] = useState(true)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [editingStudentFirstName, setEditingStudentFirstName] = useState('')
  const [editingStudentLastName, setEditingStudentLastName] = useState('')
  const [editingStudentDisplayName, setEditingStudentDisplayName] = useState('')
  const [editingStudentGrade, setEditingStudentGrade] = useState<number | ''>('')
  const [editingStudentDietary, setEditingStudentDietary] = useState('')
  const [editingStudentNotes, setEditingStudentNotes] = useState('')
  const [editingStudentActive, setEditingStudentActive] = useState(true)
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
    const studentRecords = await listStudents()
    setStudents(studentRecords)
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

  const handleCreateStudent = async () => {
    if (!newStudentFirstName.trim() || !newStudentLastName.trim() || !newStudentGrade) return
    setSaving(true)
    setMessage(null)
    try {
      await createStudent({
        firstName: newStudentFirstName.trim(),
        lastName: newStudentLastName.trim(),
        displayName: newStudentDisplayName.trim() || `${newStudentFirstName.trim()} ${newStudentLastName.trim()}`,
        grade: Number(newStudentGrade),
        active: newStudentActive,
        dietaryRestrictions: newStudentDietary ? newStudentDietary.split(',').map((s) => s.trim()).filter(Boolean) : [],
        notes: newStudentNotes.trim() || null,
      })
      setNewStudentFirstName('')
      setNewStudentLastName('')
      setNewStudentDisplayName('')
      setNewStudentGrade('')
      setNewStudentDietary('')
      setNewStudentNotes('')
      setNewStudentActive(true)
      setShowStudentCreate(false)
      const studentRecords = await listStudents()
      setStudents(studentRecords)
      setMessage('Student created.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to create student.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStudent = async (student: StudentRecord) => {
    setSaving(true)
    setMessage(null)
    try {
      await updateStudent(student.studentId, { active: !student.active })
      const studentRecords = await listStudents()
      setStudents(studentRecords)
      setMessage('Student updated.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update student.')
    } finally {
      setSaving(false)
    }
  }

  const handleStartEditingStudent = (student: StudentRecord) => {
    setEditingStudentId(student.studentId)
    setEditingStudentFirstName(student.firstName)
    setEditingStudentLastName(student.lastName)
    setEditingStudentDisplayName(student.displayName)
    setEditingStudentGrade(student.grade)
    setEditingStudentDietary(Array.isArray(student.dietaryRestrictions) ? student.dietaryRestrictions.join(', ') : '')
    setEditingStudentNotes(student.notes ?? '')
    setEditingStudentActive(student.active)
  }

  const handleSaveStudentName = async () => {
    if (!editingStudentId || !editingStudentFirstName.trim() || !editingStudentLastName.trim() || !editingStudentGrade) return
    setSaving(true)
    setMessage(null)
    try {
      await updateStudent(editingStudentId, {
        firstName: editingStudentFirstName.trim(),
        lastName: editingStudentLastName.trim(),
        displayName: editingStudentDisplayName.trim() || `${editingStudentFirstName.trim()} ${editingStudentLastName.trim()}`,
        grade: Number(editingStudentGrade),
        active: editingStudentActive,
        dietaryRestrictions: editingStudentDietary ? editingStudentDietary.split(',').map((s) => s.trim()).filter(Boolean) : [],
        notes: editingStudentNotes.trim() || null,
      })
      setEditingStudentId(null)
      setEditingStudentFirstName('')
      setEditingStudentLastName('')
      setEditingStudentDisplayName('')
      setEditingStudentGrade('')
      setEditingStudentDietary('')
      setEditingStudentNotes('')
      setEditingStudentActive(true)
      const studentRecords = await listStudents()
      setStudents(studentRecords)
      setMessage('Student updated.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update student.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelStudentEdit = () => {
    setEditingStudentId(null)
    setEditingStudentFirstName('')
    setEditingStudentLastName('')
    setEditingStudentDisplayName('')
    setEditingStudentGrade('')
    setEditingStudentDietary('')
    setEditingStudentNotes('')
    setEditingStudentActive(true)
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin Configuration</h1>
            <p className="mt-1 text-sm text-slate-600">Manage EventFlow master data.</p>
          </div>
          {(activeTab === 'activities' || activeTab === 'eventTypes') ? <button
            type="button"
            onClick={handleSeed}
            disabled={saving}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Seed initial values
          </button> : null}
        </div>
        {message ? <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div> : null}
        <div role="tablist" aria-label="Admin configuration sections" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {([['students', 'Students'], ['staff', 'Staff'], ['vehicles', 'Vehicles'], ['eventTypes', 'Event Types'], ['activities', 'Activities']] as const).map(([value, label]) => (
            <button key={value} type="button" role="tab" aria-selected={activeTab === value} onClick={() => setActiveTab(value)} className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${activeTab === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className={activeTab === 'activities' || activeTab === 'eventTypes' ? 'grid gap-6' : 'hidden'}>
        <section className={`${activeTab === 'activities' ? '' : 'hidden'} rounded-3xl border border-slate-200 bg-white p-6 shadow-sm`}>
          <h2 className="text-xl font-semibold">Activities</h2>
          <p className="mt-2 text-sm text-slate-600">Activities represent the high-level event category.</p>

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

        <section className={`${activeTab === 'eventTypes' ? '' : 'hidden'} rounded-3xl border border-slate-200 bg-white p-6 shadow-sm`}>
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

      {activeTab === 'staff' ? <StaffManagementPage /> : null}
      {activeTab === 'vehicles' ? <VehicleManagementPage /> : null}

      <section className={`${activeTab === 'students' ? '' : 'hidden'} rounded-3xl border border-slate-200 bg-white p-6 shadow-sm`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">Students</h2><p className="mt-2 text-sm text-slate-600">Manage student master data. Only Admins may create or update students.</p></div><button type="button" onClick={() => { handleCancelStudentEdit(); setShowStudentCreate(true) }} disabled={saving || showStudentCreate} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Add Student</button></div>

        {showStudentCreate ? <div className="mt-5 rounded-2xl border border-slate-200 p-4">
        <h3 className="mb-4 font-semibold">New student</h3>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={newStudentFirstName}
            onChange={(e) => setNewStudentFirstName(e.target.value)}
            placeholder="First name"
            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900"
          />
          <input
            type="text"
            value={newStudentLastName}
            onChange={(e) => setNewStudentLastName(e.target.value)}
            placeholder="Last name"
            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900"
          />
          <input
            type="text"
            value={newStudentDisplayName}
            onChange={(e) => setNewStudentDisplayName(e.target.value)}
            placeholder="Display name (optional)"
            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900"
          />
          <input
            type="number"
            min={6}
            max={12}
            value={newStudentGrade as any}
            onChange={(e) => setNewStudentGrade(e.target.value ? Number(e.target.value) : '')}
            placeholder="Grade"
            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900"
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <input
            id="new-student-active"
            type="checkbox"
            checked={newStudentActive}
            onChange={(e) => setNewStudentActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="new-student-active" className="text-sm text-slate-700">Active</label>
        </div>
        <div className="mt-4">
          <input
            type="text"
            value={newStudentDietary}
            onChange={(e) => setNewStudentDietary(e.target.value)}
            placeholder="Dietary restrictions (comma-separated)"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900"
          />
        </div>
        <div className="mt-4">
          <textarea
            value={newStudentNotes}
            onChange={(e) => setNewStudentNotes(e.target.value)}
            placeholder="Notes"
            rows={3}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900"
          />
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleCreateStudent}
            disabled={saving || !newStudentFirstName.trim() || !newStudentLastName.trim() || !newStudentGrade}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Save
          </button>
          <button type="button" onClick={() => setShowStudentCreate(false)} disabled={saving} className="ml-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button>
        </div>
        </div> : null}

      </section>

      <section className={`${activeTab === 'students' ? '' : 'hidden'} rounded-3xl border border-slate-200 bg-white p-6 shadow-sm`}>
        <h3 className="font-semibold">Student records</h3>
        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-slate-600">Loading students…</p>
          ) : (
            students.map((student) => (
              <div key={student.studentId} className="flex flex-col rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                    {editingStudentId === student.studentId ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input value={editingStudentFirstName} onChange={(e) => setEditingStudentFirstName(e.target.value)} placeholder="First name" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900" />
                        <input value={editingStudentLastName} onChange={(e) => setEditingStudentLastName(e.target.value)} placeholder="Last name" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900" />
                        <input value={editingStudentDisplayName} onChange={(e) => setEditingStudentDisplayName(e.target.value)} placeholder="Display name" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900" />
                        <input type="number" min={6} max={12} value={editingStudentGrade as any} onChange={(e) => setEditingStudentGrade(e.target.value ? Number(e.target.value) : '')} placeholder="Grade" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900" />
                      </div>
                      <div className="flex items-center gap-3">
                        <input id={`student-active-${student.studentId}`} type="checkbox" checked={editingStudentActive} onChange={(e) => setEditingStudentActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                        <label htmlFor={`student-active-${student.studentId}`} className="text-sm text-slate-700">Active</label>
                      </div>
                      <input value={editingStudentDietary} onChange={(e) => setEditingStudentDietary(e.target.value)} placeholder="Dietary restrictions (comma-separated)" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900" />
                      <textarea value={editingStudentNotes} onChange={(e) => setEditingStudentNotes(e.target.value)} placeholder="Notes" rows={3} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900" />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={handleSaveStudentName} disabled={saving || !editingStudentFirstName.trim() || !editingStudentLastName.trim() || !editingStudentGrade} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">Save</button>
                        <button type="button" onClick={handleCancelStudentEdit} disabled={saving} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium">{student.displayName} · Grade {student.grade}</p>
                      {student.notes ? <p className="mt-1 text-sm text-slate-600">{student.notes}</p> : null}
                      {Array.isArray(student.dietaryRestrictions) && student.dietaryRestrictions.length > 0 ? (
                        <p className="mt-1 text-xs text-amber-700">Dietary: {student.dietaryRestrictions.join(', ')}</p>
                      ) : null}
                    </>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
                  {editingStudentId !== student.studentId ? (
                    <button type="button" onClick={() => handleStartEditingStudent(student)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Edit</button>
                  ) : null}
                  <button type="button" onClick={() => void handleToggleStudent(student)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">{student.active ? 'Deactivate' : 'Reactivate'}</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
