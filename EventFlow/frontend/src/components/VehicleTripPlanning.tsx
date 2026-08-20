import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { addStudentParticipant, listParticipantsForEvent, removeStudentParticipant } from '../services/eventParticipants'
import { addStaffParticipant, listStaffParticipantsForEvent, removeStaffParticipant } from '../services/eventStaffParticipants'
import { listStudents } from '../services/students'
import { addPlannedEventVehicleTrip, listActiveEventVehicleTrips, mirrorReturnDriver, removePlannedEventVehicleTrip, setPlannedTripDriver } from '../services/eventVehicleTrips'
import { bulkMoveParticipantsToDepartureVehicle, findAffectedDriverRoles, MAX_BULK_TRANSPORTATION_SELECTION, moveParticipantsToDepartureVehicle } from '../services/transportationAssignments'
import { combineTransportationOccupants, groupTransportationOccupants, projectedOccupancy, returnDriverIsVisible, type TransportationOccupant } from '../services/transportationPlanning'
import { departVehicle, getDepartureReview } from '../services/departureWorkflow'
import type { DepartureReview } from '../services/departurePlanning'
import { arriveVehicleAtEvent, getArrivalReview } from '../services/arrivalWorkflow'
import type { ArrivalReview } from '../services/arrivalPlanning'
import type { EventParticipantRecord, EventRecord, EventStaffParticipantRecord, EventVehicleTripRecord, StaffRecord, StudentRecord, VehicleRecord } from '../types/models'

export default function VehicleTripPlanning({ event, vehicles, staff, onParticipantsChanged }: { event: EventRecord; vehicles: VehicleRecord[]; staff: StaffRecord[]; onParticipantsChanged?: () => Promise<void> }) {
  const eventId = event.eventId
  const { firebaseUser, appUser } = useAuth()
  const canPlan = appUser?.active === true && (appUser.role === 'admin' || appUser.role === 'staff')
  const [trips, setTrips] = useState<EventVehicleTripRecord[]>([])
  const [students, setStudents] = useState<EventParticipantRecord[]>([])
  const [staffParts, setStaffParts] = useState<EventStaffParticipantRecord[]>([])
  const [studentNames, setStudentNames] = useState(new Map<string, string>())
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([])
  const [studentToAdd, setStudentToAdd] = useState('')
  const [staffToAdd, setStaffToAdd] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [selected, setSelected] = useState(new Set<string>())
  const [destination, setDestination] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [departureReview, setDepartureReview] = useState<DepartureReview | null>(null)
  const [reviewConfirmed, setReviewConfirmed] = useState(false)
  const [arrivalReview, setArrivalReview] = useState<ArrivalReview | null>(null)

  const load = async () => {
    const [nextTrips, people, studentParts, nextStaffParts] = await Promise.all([listActiveEventVehicleTrips(eventId), listStudents(), listParticipantsForEvent(eventId), listStaffParticipantsForEvent(eventId)])
    setTrips(nextTrips)
    setStudents(studentParts.filter((item) => item.status === 'active'))
    setStaffParts(nextStaffParts.filter((item) => item.status === 'active'))
    setStudentNames(new Map(people.map((item) => [item.studentId, item.displayName])))
    setStudentRecords(people)
  }
  useEffect(() => { setLoading(true); load().catch(showError).finally(() => setLoading(false)) }, [eventId])

  const occupants = useMemo(() => combineTransportationOccupants(students, staffParts, studentNames, new Map(staff.map((item) => [item.staffId, item.displayName]))), [students, staffParts, studentNames, staff])
  const departureGroups = useMemo(() => groupTransportationOccupants(occupants, trips, vehicles, 'departure'), [occupants, trips, vehicles])
  const returnGroups = useMemo(() => groupTransportationOccupants(occupants, trips, vehicles, 'return'), [occupants, trips, vehicles])
  const selectedPeople = occupants.filter((item) => selected.has(keyOf(item)))
  const destinationId = destination === 'unassigned' ? null : destination || null
  const destinationGroup = departureGroups.find((group) => group.vehicleId === destinationId)
  const projected = destinationGroup ? projectedOccupancy(destinationGroup.occupancy, selectedPeople.filter((item) => item.departureVehicleId === destinationId).length, selectedPeople.length) : selectedPeople.length
  const projectedOver = destinationGroup?.capacity == null ? 0 : Math.max(0, projected - destinationGroup.capacity)
  const drivers = staff.filter((item) => item.active && item.canDrive)

  function showError(error: unknown) { setMessage(error instanceof Error ? error.message : 'Unable to update transportation plan.') }
  async function act(action: () => Promise<unknown>, success: string) {
    if (busy) return false
    setBusy(true); setMessage(null)
    try { await action(); await load(); await onParticipantsChanged?.(); setMessage(success); return true } catch (error) { showError(error); return false } finally { setBusy(false) }
  }
  function toggle(key: string) { setSelected((current) => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next }) }
  function toggleGroup(members: TransportationOccupant[]) {
    const keys = members.map(keyOf), all = keys.length > 0 && keys.every((key) => selected.has(key))
    setSelected((current) => { const next = new Set(current); keys.forEach((key) => all ? next.delete(key) : next.add(key)); return next })
  }
  const confirmAndMove = async (members: TransportationOccupant[], target: string | null, success: string, bulk = false) => {
    const keys = members.map(({ kind, personId }) => ({ kind, personId }))
    try {
      const affected = await findAffectedDriverRoles(eventId, keys, target, 'departure')
      if (affected.length) {
        const staffNames = new Map(staff.map((item) => [item.staffId, item.displayName]))
        const vehicleNames = new Map(vehicles.map((item) => [item.vehicleId, item.name]))
        const details = affected.map((item) => `${staffNames.get(item.staffId) ?? item.staffId}: ${item.leg} driver of ${vehicleNames.get(item.vehicleId) ?? item.vehicleId}`).join('\n')
        if (!window.confirm(`Moving ${bulk ? 'these occupants' : members[0]?.displayName ?? 'this occupant'} will clear the following driver role${affected.length === 1 ? '' : 's'}:\n\n${details}\n\nContinue with the occupant move and driver removal?`)) return false
      }
      return await act(() => bulk ? bulkMoveParticipantsToDepartureVehicle(eventId, keys, target, affected) : moveParticipantsToDepartureVehicle(eventId, keys, target, affected), success)
    } catch (error) { showError(error); return false }
  }
  const move = (members: TransportationOccupant[], target: string | null, success: string) => confirmAndMove(members, target, success)
  const removeParticipant = (occupant: TransportationOccupant) => {
    if (occupant.kind === 'staff' && trips.some((trip) => trip.departureDriverStaffId === occupant.personId || trip.returnDriverStaffId === occupant.personId) && !window.confirm('This staff participant is assigned as a driver. Removing them as an occupant will also remove all of their driver assignments for this event. Continue?')) return Promise.resolve()
    return act(() => occupant.kind === 'student' ? removeStudentParticipant(eventId, occupant.personId, firebaseUser?.uid ?? '') : removeStaffParticipant(eventId, occupant.personId, firebaseUser?.uid ?? ''), `${occupant.displayName} removed.`)
  }
  async function openDepartureReview(vehicleId: string) {
    if (busy) return
    setBusy(true); setMessage(null); setReviewConfirmed(false)
    try { setDepartureReview(await getDepartureReview(eventId, vehicleId)) } catch (error) { showError(error) } finally { setBusy(false) }
  }
  async function confirmDeparture() {
    if (!departureReview || !reviewConfirmed || busy) return
    const succeeded = await act(() => departVehicle(eventId, departureReview.vehicleId, firebaseUser?.uid ?? '', departureReview.reviewToken), `${departureReview.vehicleName} departure recorded.`)
    if (succeeded) setDepartureReview(null)
  }
  async function openArrivalReview(vehicleId: string) {
    if (busy) return
    setBusy(true); setMessage(null)
    try { setArrivalReview(await getArrivalReview(eventId, vehicleId)) } catch (error) { showError(error) } finally { setBusy(false) }
  }
  async function confirmArrival() {
    if (!arrivalReview || busy) return
    const succeeded = await act(() => arriveVehicleAtEvent(eventId, arrivalReview.vehicleId, firebaseUser?.uid ?? '', arrivalReview.reviewToken), `${arrivalReview.vehicleName} arrival recorded.`)
    if (succeeded) setArrivalReview(null)
  }

  if (loading) return <section className="rounded-3xl border bg-white p-6"><p className="text-sm text-slate-600">Loading transportation plan…</p></section>
  return <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <h3 className="text-lg font-semibold">Transportation planning</h3>
    <p className="mt-1 text-sm text-slate-600">Add participants and vehicles, assign drivers, and group departure occupants. Depart records the reviewed occupants and initializes a read-only return list.</p>
    {message ? <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm" role="status">{message}</p> : null}
    {canPlan ? <div className="mt-4 grid gap-3 lg:grid-cols-3">
      <div className="flex gap-2"><select value={studentToAdd} disabled={busy} onChange={(event) => setStudentToAdd(event.target.value)} className="min-w-0 flex-1 rounded-xl border px-3 py-2"><option value="">Add student…</option>{studentRecords.filter((student) => student.active && !students.some((item) => item.studentId === student.studentId)).map((student) => <option key={student.studentId} value={student.studentId}>{student.displayName} · Grade {student.grade}</option>)}</select><button disabled={busy || !studentToAdd} onClick={() => void act(async () => { await addStudentParticipant(eventId, studentToAdd, firebaseUser?.uid ?? ''); setStudentToAdd('') }, 'Student added.')} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Add</button></div>
      <div className="flex gap-2"><select value={staffToAdd} disabled={busy} onChange={(event) => setStaffToAdd(event.target.value)} className="min-w-0 flex-1 rounded-xl border px-3 py-2"><option value="">Add staff…</option>{staff.filter((person) => person.active && !staffParts.some((item) => item.staffId === person.staffId)).map((person) => <option key={person.staffId} value={person.staffId}>{person.displayName}</option>)}</select><button disabled={busy || !staffToAdd} onClick={() => void act(async () => { await addStaffParticipant(eventId, staffToAdd, firebaseUser?.uid ?? ''); setStaffToAdd('') }, 'Staff added.')} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Add</button></div>
      <div className="flex gap-2"><select value={vehicleId} disabled={busy} onChange={(event) => setVehicleId(event.target.value)} className="min-w-0 flex-1 rounded-xl border px-3 py-2"><option value="">Add vehicle…</option>{vehicles.filter((vehicle) => vehicle.active && !trips.some((trip) => trip.vehicleId === vehicle.vehicleId)).map((vehicle) => <option value={vehicle.vehicleId} key={vehicle.vehicleId}>{vehicle.name}</option>)}</select><button disabled={busy || !vehicleId} onClick={() => void act(async () => { await addPlannedEventVehicleTrip(eventId, vehicleId); setVehicleId('') }, 'Vehicle added.')} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Add</button></div>
    </div> : null}
    {departureGroups.at(-1)?.occupancy ? <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Transportation Incomplete: {departureGroups.at(-1)!.occupancy} participant(s) are unassigned.</p> : null}

    <div className="mt-5 space-y-4">{departureGroups.map((group) => {
      const trip = group.vehicleId ? trips.find((item) => item.vehicleId === group.vehicleId)! : null
      const vehicle = group.vehicleId ? vehicles.find((item) => item.vehicleId === group.vehicleId) : null
      const tripIsPlanned = trip?.stage === 'planned'
      const departureEditable = !trip || tripIsPlanned
      const returnGroup = trip && ['departed', 'arrived_at_event'].includes(trip.stage) ? returnGroups.find((item) => item.vehicleId === trip.vehicleId) : null
      const groupSelected = group.occupants.length > 0 && group.occupants.every((item) => selected.has(keyOf(item)))
      return <article key={group.vehicleId ?? 'unassigned'} className={`rounded-2xl border p-4 ${group.overCapacityBy ? 'border-rose-400 bg-rose-50' : ''}`}>
        <div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="font-semibold">{vehicle?.name ?? 'Unassigned'}</h4>{vehicle ? <p className="text-sm text-slate-600">Departure {group.occupancy}/{vehicle.capacity}{group.overCapacityBy ? ` — ${group.overCapacityBy} over capacity` : ` — ${group.availableSeats} available`} · {trip?.stage ?? 'unplanned'}</p> : <p className="text-sm text-slate-600">{group.occupancy} participant(s)</p>}{trip?.departedAt ? <p className="mt-1 text-sm font-medium text-emerald-700">Departed {trip.departedAt.toDate().toLocaleString()}</p> : null}{trip?.arrivedAtEventAt ? <p className="mt-1 text-sm font-medium text-emerald-700">Arrived at event {trip.arrivedAtEventAt.toDate().toLocaleString()}</p> : null}</div><div className="flex gap-3">{trip && canPlan && tripIsPlanned && ['confirmed', 'in_progress'].includes(event.status) ? <button disabled={busy} onClick={() => void openDepartureReview(trip.vehicleId)} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Depart</button> : null}{trip && canPlan && trip.stage === 'departed' && event.status === 'in_progress' ? <button disabled={busy} onClick={() => void openArrivalReview(trip.vehicleId)} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Arrive at Event</button> : null}{trip && canPlan && tripIsPlanned ? <button disabled={busy} onClick={() => void act(() => removePlannedEventVehicleTrip(eventId, trip.vehicleId), 'Vehicle removed.')} className="text-sm font-semibold text-rose-700">Remove</button> : null}</div></div>
        {trip ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Departure driver<select disabled={!canPlan || busy || !tripIsPlanned} value={trip.departureDriverStaffId ?? ''} onChange={(event) => void act(() => setPlannedTripDriver(eventId, trip.vehicleId, 'departure', event.target.value || null, firebaseUser?.uid ?? ''), 'Departure driver updated.')} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">No driver</option>{drivers.map(driverOption)}</select></label><div><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" disabled={!canPlan || busy || !tripIsPlanned} checked={returnDriverIsVisible(trip.returnDriverMirrorsDeparture)} onChange={(event) => event.target.checked ? void act(() => setPlannedTripDriver(eventId, trip.vehicleId, 'return', trip.returnDriverStaffId, firebaseUser?.uid ?? ''), 'Return transportation marked as different.') : void act(() => mirrorReturnDriver(eventId, trip.vehicleId, firebaseUser?.uid ?? ''), 'Return transportation now matches departure.')} /> Return occupants differ from departure</label>{returnDriverIsVisible(trip.returnDriverMirrorsDeparture) ? <label className="mt-2 block text-sm font-medium">Return driver<select disabled={!canPlan || busy || !tripIsPlanned} value={trip.returnDriverStaffId ?? ''} onChange={(event) => void act(() => setPlannedTripDriver(eventId, trip.vehicleId, 'return', event.target.value || null, firebaseUser?.uid ?? ''), 'Return driver updated.')} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">No driver</option>{drivers.map(driverOption)}</select></label> : null}</div></div> : null}
        <div className="mt-4 flex items-center justify-between"><h5 className="text-sm font-semibold">Departure occupants</h5>{group.occupants.length && departureEditable ? <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={groupSelected} disabled={busy} onChange={() => toggleGroup(group.occupants)} /> Select all</label> : null}</div>
        <div className="mt-2 space-y-2">{group.occupants.length === 0 ? <p className="text-sm text-slate-500">No occupants.</p> : group.occupants.map((occupant) => <div key={keyOf(occupant)} className="grid gap-2 rounded-xl bg-white p-2 sm:grid-cols-[1fr_auto_auto] sm:items-center"><label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy || !departureEditable} checked={selected.has(keyOf(occupant))} onChange={() => toggle(keyOf(occupant))} /><span>{occupant.displayName} <span className="text-xs text-slate-500">({occupant.kind})</span></span></label><select aria-label={`Move ${occupant.displayName}`} disabled={!canPlan || busy || !departureEditable} value={occupant.departureVehicleId ?? 'unassigned'} onChange={(event) => void move([occupant], event.target.value === 'unassigned' ? null : event.target.value, `${occupant.displayName} moved.`)} className="rounded-lg border px-2 py-1 text-sm"><option value="unassigned">Unassigned</option>{trips.filter((item) => item.stage === 'planned').map((item) => <option key={item.vehicleId} value={item.vehicleId}>{vehicles.find((candidate) => candidate.vehicleId === item.vehicleId)?.name ?? item.vehicleId}</option>)}</select><button disabled={!canPlan || busy || !departureEditable} onClick={() => void removeParticipant(occupant)} className="rounded-lg border border-rose-300 px-2 py-1 text-sm font-semibold text-rose-700">Remove</button></div>)}</div>
        {returnGroup ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><h5 className="text-sm font-semibold">Initial return occupants (read-only)</h5><p className="mt-2 text-sm">{returnGroup.occupants.map((person) => person.displayName).join(', ') || 'No return occupants.'}</p></div> : null}
      </article>
    })}</div>

    {selected.size ? <div className="sticky bottom-3 mt-5 rounded-2xl border bg-white p-4 shadow-lg"><p className="text-sm font-semibold">{selected.size} selected</p><div className="mt-2 flex flex-col gap-2 sm:flex-row"><select value={destination} disabled={busy} onChange={(event) => setDestination(event.target.value)} className="rounded-xl border px-3 py-2"><option value="">Move selected to…</option><option value="unassigned">Unassigned</option>{trips.filter((trip) => trip.stage === 'planned').map((trip) => <option key={trip.vehicleId} value={trip.vehicleId}>{vehicles.find((item) => item.vehicleId === trip.vehicleId)?.name ?? trip.vehicleId}</option>)}</select><button disabled={!canPlan || busy || !destination || selected.size > MAX_BULK_TRANSPORTATION_SELECTION} onClick={() => void confirmAndMove(selectedPeople, destinationId, 'Selected participants moved.', true).then((moved) => { if (moved) { setSelected(new Set()); setDestination('') } })} className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-50">Apply</button><button disabled={busy} onClick={() => setSelected(new Set())} className="rounded-xl border px-4 py-2">Clear</button></div>{destination ? <p className={`mt-2 text-sm ${projectedOver ? 'font-semibold text-rose-700' : 'text-slate-600'}`}>Projected destination occupancy: {projected}{destinationGroup?.capacity == null ? '' : `/${destinationGroup.capacity}`}{projectedOver ? ` — ${projectedOver} over capacity (warning only)` : ''}</p> : null}</div> : null}
    {departureReview ? <DepartureReviewDialog review={departureReview} busy={busy} confirmed={reviewConfirmed} onConfirmed={setReviewConfirmed} onCancel={() => { if (!busy) setDepartureReview(null) }} onDepart={() => void confirmDeparture()} /> : null}
    {arrivalReview ? <ArrivalReviewDialog review={arrivalReview} busy={busy} error={message} onCancel={() => { if (!busy) setArrivalReview(null) }} onArrive={() => void confirmArrival()} /> : null}
  </section>
}

function ArrivalReviewDialog({ review, busy, error, onCancel, onArrive }: { review: ArrivalReview; busy: boolean; error: string | null; onCancel: () => void; onArrive: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="arrival-review-title"><div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-6"><h4 id="arrival-review-title" className="text-xl font-semibold">Confirm arrival at event</h4><p className="mt-2 text-sm text-slate-600">This records the actual arrival time for this vehicle only. The event remains in progress; Start Return is not performed and return assignments do not change.</p>{error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p> : null}<dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Event</dt><dd>{review.eventName}</dd></div><div><dt className="font-semibold">Vehicle</dt><dd>{review.vehicleName}</dd></div><div><dt className="font-semibold">Departure driver</dt><dd>{review.departureDriverName}</dd></div><div><dt className="font-semibold">Actual departure</dt><dd>{new Date(review.departedAtMillis).toLocaleString()}</dd></div><div><dt className="font-semibold">Destination</dt><dd>{review.eventLocation}</dd></div><div><dt className="font-semibold">Departure occupants</dt><dd>{review.departureOccupantCount}</dd></div></dl><p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Confirming records the vehicle's actual arrival time. This action cannot currently be undone through the UI.</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={busy} onClick={onCancel} className="rounded-xl border px-4 py-2 font-semibold">Cancel</button><button type="button" disabled={busy} onClick={onArrive} className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Recording arrival…' : 'Confirm Arrive at Event'}</button></div></div></div>
}

function keyOf(item: Pick<TransportationOccupant, 'kind' | 'personId'>) { return `${item.kind}:${item.personId}` }
function driverOption(driver: StaffRecord) { return <option key={driver.staffId} value={driver.staffId}>{driver.displayName}</option> }

function DepartureReviewDialog({ review, busy, confirmed, onConfirmed, onCancel, onDepart }: { review: DepartureReview; busy: boolean; confirmed: boolean; onConfirmed: (value: boolean) => void; onCancel: () => void; onDepart: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="depart-review-title">
    <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-6">
      <h4 id="depart-review-title" className="text-xl font-semibold">Double-check departure</h4>
      <p className="mt-1 text-sm text-slate-600">Confirming records the actual departure and initializes the return-passenger list from the current committed assignments.</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="font-semibold">Event</dt><dd>{review.eventName}</dd></div><div><dt className="font-semibold">Vehicle</dt><dd>{review.vehicleName}</dd></div>
        <div><dt className="font-semibold">Departure driver</dt><dd>{review.departureDriverName}</dd></div><div><dt className="font-semibold">Capacity</dt><dd>{review.totalOccupants}/{review.vehicleCapacity} · {review.overCapacityBy ? `${review.overCapacityBy} over capacity` : `${review.availableSeats} available`}</dd></div>
        <div><dt className="font-semibold">Students</dt><dd>{review.studentCount}</dd></div><div><dt className="font-semibold">Staff / total</dt><dd>{review.staffCount} / {review.totalOccupants}</dd></div>
      </dl>
      <div className="mt-4"><h5 className="text-sm font-semibold">Departure occupants</h5><ul className="mt-2 space-y-1 text-sm">{review.occupants.map((person) => <li key={`${person.kind}:${person.personId}`}>{person.displayName} <span className="text-slate-500">({person.kind})</span></li>)}</ul></div>
      {review.unassignedDepartureCount || review.overCapacityBy ? <div className="mt-4 space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{review.unassignedDepartureCount ? <p><strong>Warning:</strong> {review.unassignedDepartureCount} event participant(s) remain Unassigned for departure.</p> : null}{review.overCapacityBy ? <p><strong>Warning:</strong> This vehicle is {review.overCapacityBy} occupant(s) over capacity.</p> : null}<p>These warnings do not block departure, but require your explicit confirmation.</p></div> : null}
      <label className="mt-5 flex items-start gap-3 rounded-xl border p-3 text-sm font-medium"><input className="mt-1" type="checkbox" checked={confirmed} disabled={busy} onChange={(event) => onConfirmed(event.target.checked)} /> I have double-checked the driver and occupant assignments and confirm this vehicle is departing now.</label>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button disabled={busy} onClick={onCancel} className="rounded-xl border px-4 py-2 font-semibold">Cancel</button><button disabled={busy || !confirmed} onClick={onDepart} className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Recording departure…' : 'Confirm Depart'}</button></div>
    </div>
  </div>
}
