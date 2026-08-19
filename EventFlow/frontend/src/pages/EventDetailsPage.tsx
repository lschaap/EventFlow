import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import VehicleTripPlanning from '../components/VehicleTripPlanning'
import { useAuth } from '../context/AuthContext'
import { listActivities } from '../services/activities'
import { cancelEvent, completeEvent, confirmEvent, getEventById } from '../services/events'
import { listEventTypes } from '../services/eventTypes'
import { listParticipantsForEvent } from '../services/eventParticipants'
import { listStaffParticipantsForEvent } from '../services/eventStaffParticipants'
import { listStaff } from '../services/staff'
import { listStudents } from '../services/students'
import { listVehicles } from '../services/vehicles'
import type { EventParticipantRecord, EventRecord, EventStaffParticipantRecord, StaffRecord, StudentRecord, VehicleRecord } from '../types/models'

function formatDate(value: Date) { return value.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) }

export default function EventDetailsPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [activities, setActivities] = useState<Record<string, string>>({})
  const [eventTypes, setEventTypes] = useState<Record<string, string>>({})
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [studentParticipants, setStudentParticipants] = useState<EventParticipantRecord[]>([])
  const [staffParticipants, setStaffParticipants] = useState<EventStaffParticipantRecord[]>([])
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshParticipantSummary = async () => {
    if (!eventId) return
    const [nextStudents, nextStaff, nextEvent] = await Promise.all([listParticipantsForEvent(eventId), listStaffParticipantsForEvent(eventId), getEventById(eventId)])
    setStudentParticipants(nextStudents.filter((item) => item.status === 'active'))
    setStaffParticipants(nextStaff.filter((item) => item.status === 'active'))
    setEvent(nextEvent)
  }

  useEffect(() => {
    async function load() {
      if (!eventId) { setError('Missing event ID.'); setLoading(false); return }
      try {
        const [loadedEvent, activityRecords, typeRecords, studentRecords, studentParts, staffRecords, staffParts, vehicleRecords] = await Promise.all([
          getEventById(eventId), listActivities(), listEventTypes(), listStudents(), listParticipantsForEvent(eventId), listStaff(), listStaffParticipantsForEvent(eventId), listVehicles(),
        ])
        if (!loadedEvent) { setError('Event not found.'); return }
        setEvent(loadedEvent)
        setActivities(Object.fromEntries(activityRecords.map((item) => [item.activityId, item.name])))
        setEventTypes(Object.fromEntries(typeRecords.map((item) => [item.eventTypeId, item.name])))
        setStudents(studentRecords); setStaff(staffRecords); setVehicles(vehicleRecords)
        setStudentParticipants(studentParts.filter((item) => item.status === 'active'))
        setStaffParticipants(staffParts.filter((item) => item.status === 'active'))
      } catch (reason) { setError(reason instanceof Error ? `Unable to load event details: ${reason.message}` : 'Unable to load event details.') }
      finally { setLoading(false) }
    }
    void load()
  }, [eventId])

  const dietary = [
    ...studentParticipants.flatMap((participant) => { const person = students.find((item) => item.studentId === participant.studentId); return person?.dietaryRestrictions?.some((item) => item.trim()) ? [{ id: `student-${person.studentId}`, name: person.displayName, restrictions: person.dietaryRestrictions }] : [] }),
    ...staffParticipants.flatMap((participant) => { const person = staff.find((item) => item.staffId === participant.staffId); return person?.dietaryRestrictions?.some((item) => item.trim()) ? [{ id: `staff-${person.staffId}`, name: person.displayName, restrictions: person.dietaryRestrictions }] : [] }),
  ]

  async function handleAction(action: 'confirm' | 'complete' | 'cancel') {
    if (!eventId || !event) return
    if (action === 'confirm' && !window.confirm('Confirm this event? Its status will move from Draft to Confirmed.')) return
    setSaving(true); setError(null)
    try {
      if (action === 'confirm') await confirmEvent(eventId, firebaseUser?.uid ?? '')
      else if (action === 'complete') await completeEvent(eventId)
      else await cancelEvent(eventId)
      setEvent(await getEventById(eventId))
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update event.') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="rounded-3xl border bg-white p-6">Loading event…</div>
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><button onClick={() => navigate('/events')} className="text-sm font-semibold text-slate-600">← Back to events</button>{event ? <Link to={`/events/${event.eventId}/edit`} className="rounded-xl border px-4 py-2 text-sm font-semibold">Edit event</Link> : null}</div>
    {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
    {event ? <div className="space-y-6">
      <section className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:justify-between"><div><h1 className="text-2xl font-semibold">{event.name}</h1><p className="mt-1 text-slate-600">{event.location}</p></div><span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase">{event.status}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info label="Activity / Type">{activities[event.activityId] ?? event.activityId} · {eventTypes[event.eventTypeId] ?? event.eventTypeId}</Info><Info label="Departure / Return">{formatDate(event.departureDateTime)} → {formatDate(event.returnDateTime)}</Info></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><Count value={event.studentParticipantCount} label="Students" /><Count value={event.staffParticipantCount} label="Staff" /><Count value={event.participantCount} label="Total" dark /></div>{event.hasDietaryRestrictions ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">Dietary restrictions</div> : null}</section>
      <VehicleTripPlanning eventId={event.eventId} vehicles={vehicles} staff={staff} onParticipantsChanged={refreshParticipantSummary} />
      {event.hasDietaryRestrictions && dietary.length ? <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6"><h2 className="text-lg font-semibold">Dietary restrictions</h2><div className="mt-3 space-y-2">{dietary.map((person) => <div key={person.id}><span className="font-medium">{person.name}:</span> {person.restrictions.join(', ')}</div>)}</div></section> : null}
      <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-3xl border bg-white p-6"><h2 className="text-lg font-semibold">Operational details</h2><div className="mt-4 space-y-3 text-sm"><Info label="Purpose">{event.purpose || 'Not specified'}</Info><Info label="Meals missed">{event.mealsMissed.join(', ') || 'None'}</Info><Info label="Equipment needed">{event.equipmentNeeded.join(', ') || 'None'}</Info><Info label="Notes">{event.notes || 'None'}</Info></div></section><section className="rounded-3xl border bg-white p-6"><h2 className="text-lg font-semibold">Event management</h2><div className="mt-4 text-sm"><p>Created by: {event.createdByUserName}</p><p>Created: {formatDate(event.createdAt)}</p><p>Updated: {formatDate(event.updatedAt)}</p></div><div className="mt-5 flex flex-wrap gap-2">{event.status === 'draft' ? <button disabled={saving} onClick={() => void handleAction('confirm')} className="rounded-xl bg-emerald-700 px-4 py-2 text-white">Confirm Event</button> : null}<button disabled={saving || event.status === 'cancelled' || event.status === 'completed'} onClick={() => void handleAction('cancel')} className="rounded-xl border border-rose-300 px-4 py-2 text-rose-700">Cancel event</button><button disabled={saving || event.status === 'completed' || event.status === 'cancelled'} onClick={() => void handleAction('complete')} className="rounded-xl bg-slate-900 px-4 py-2 text-white">Mark completed</button></div></section></div>
    </div> : null}
  </div>
}

function Info({ label, children }: { label: string; children: ReactNode }) { return <div><span className="font-medium">{label}:</span> {children}</div> }
function Count({ value, label, dark = false }: { value: number; label: string; dark?: boolean }) { return <div className={`rounded-2xl p-3 ${dark ? 'bg-slate-900 text-white' : 'bg-slate-50'}`}><div className="text-xl font-semibold">{value}</div><div className="text-xs">{label}</div></div> }
