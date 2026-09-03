import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { addStudentParticipant, listParticipantsForEvent, removeStudentParticipant } from '../services/eventParticipants'
import { addStaffParticipant, listStaffParticipantsForEvent, removeStaffParticipant } from '../services/eventStaffParticipants'
import { listStudents } from '../services/students'
import { addPlannedEventVehicleTrip, listActiveEventVehicleTrips, mirrorReturnDriver, removePlannedEventVehicleTrip, setPlannedTripDriver } from '../services/eventVehicleTrips'
import { bulkMoveParticipantsToDepartureVehicle, bulkMoveParticipantsToReturnVehicle, findAffectedDriverRoles, MAX_BULK_TRANSPORTATION_SELECTION, moveParticipantsToDepartureVehicle, moveParticipantsToReturnVehicle } from '../services/transportationAssignments'
import { combineTransportationOccupants, groupTransportationOccupants, projectedOccupancy, returnDriverIsVisible, type TransportationOccupant } from '../services/transportationPlanning'
import { departVehicle, getDepartureReview } from '../services/departureWorkflow'
import type { DepartureReview } from '../services/departurePlanning'
import { arriveVehicleAtEvent, getArrivalReview } from '../services/arrivalWorkflow'
import type { ArrivalReview } from '../services/arrivalPlanning'
import { getStartReturnReview, startReturn } from '../services/startReturnWorkflow'
import type { StartReturnReview } from '../services/returnPlanning'
import { returnCorrectionPhaseIsActive, returnTargetIsEligible, snapshotOccupantKeys } from '../services/returnPlanning'
import { correctReturnAssignments, listReturnCorrections } from '../services/returnCorrections'
import { correctReturnDriver, listReturnDriverCorrections } from '../services/returnDriverCorrections'
import type { EventParticipantRecord, EventRecord, EventStaffParticipantRecord, EventVehicleTripRecord, ReturnDriverCorrectionRecord, ReturnRosterCorrectionRecord, StaffRecord, StudentRecord, VehicleRecord } from '../types/models'

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
  const [startReturnReview, setStartReturnReview] = useState<StartReturnReview | null>(null)
  const [startReturnConfirmed, setStartReturnConfirmed] = useState(false)
  const [openingStartReturnVehicleId, setOpeningStartReturnVehicleId] = useState<string | null>(null)
  const [startReturnActionError, setStartReturnActionError] = useState<string | null>(null)
  const [returnSelected, setReturnSelected] = useState(new Set<string>())
  const [returnDestination, setReturnDestination] = useState('')
  const [corrections, setCorrections] = useState<ReturnRosterCorrectionRecord[]>([])
  const [driverCorrections, setDriverCorrections] = useState<ReturnDriverCorrectionRecord[]>([])

  const load = async () => {
    const [nextTrips, people, studentParts, nextStaffParts, nextCorrections, nextDriverCorrections] = await Promise.all([listActiveEventVehicleTrips(eventId), listStudents(), listParticipantsForEvent(eventId), listStaffParticipantsForEvent(eventId), listReturnCorrections(eventId), listReturnDriverCorrections(eventId)])
    setTrips(nextTrips)
    setStudents(studentParts.filter((item) => item.status === 'active'))
    setStaffParts(nextStaffParts.filter((item) => item.status === 'active'))
    setStudentNames(new Map(people.map((item) => [item.studentId, item.displayName])))
    setStudentRecords(people)
    setCorrections(nextCorrections)
    setDriverCorrections(nextDriverCorrections)
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
  const returnSelectedPeople = occupants.filter((item) => returnSelected.has(keyOf(item)))
  const returnCorrectionPhase = returnCorrectionPhaseIsActive(event.status, trips.map((trip) => trip.stage))
  const returnSelectionNeedsCorrection = returnCorrectionPhase
  const eligibleReturnTargets = trips.filter((trip) => returnTargetIsEligible(trip.stage, returnSelectionNeedsCorrection))
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
  async function openStartReturnReview(vehicleId: string) {
    if (busy) return
    setBusy(true); setOpeningStartReturnVehicleId(vehicleId); setMessage(null); setStartReturnActionError(null); setStartReturnConfirmed(false)
    try { setStartReturnReview(await getStartReturnReview(eventId, vehicleId)) } catch (error) { const detail = error instanceof Error ? error.message : 'Unable to prepare Start Return.'; setStartReturnActionError(detail); showError(error) } finally { setOpeningStartReturnVehicleId(null); setBusy(false) }
  }
  async function confirmStartReturn() {
    if (!startReturnReview || !startReturnConfirmed || busy) return
    setStartReturnActionError(null)
    const succeeded = await act(() => startReturn(eventId, startReturnReview.vehicleId, firebaseUser?.uid ?? '', startReturnReview.reviewToken), `${startReturnReview.vehicleName} return started.`)
    if (succeeded) setStartReturnReview(null)
  }
  async function confirmReturnMove(members: TransportationOccupant[], target: string | null, correction: boolean, bulk = false) {
    const keys = members.map(({ kind, personId }) => ({ kind, personId }))
    try {
      const affected = await findAffectedDriverRoles(eventId, keys, target, 'return')
      if (affected.length) {
        const details = affected.map((role) => `${staff.find((person) => person.staffId === role.staffId)?.displayName ?? role.staffId}: return driver of ${vehicles.find((vehicle) => vehicle.vehicleId === role.vehicleId)?.name ?? role.vehicleId}`).join('\n')
        if (!window.confirm(`Moving ${bulk ? 'these return passengers' : members[0]?.displayName ?? 'this return passenger'} will clear the following return-driver role${affected.length === 1 ? '' : 's'}:\n\n${details}\n\nContinue?`)) return false
      }
      const action = correction
        ? () => correctReturnAssignments(eventId, members.map((person) => ({ kind: person.kind, personId: person.personId, displayName: person.displayName })), target, firebaseUser?.uid ?? '', affected)
        : () => bulk ? bulkMoveParticipantsToReturnVehicle(eventId, keys, target, affected) : moveParticipantsToReturnVehicle(eventId, keys, target, affected)
      return await act(action, correction ? 'Return-roster correction recorded.' : 'Return assignment updated.')
    } catch (error) { showError(error); return false }
  }
  async function changeReturnDriver(trip: EventVehicleTripRecord, staffId: string | null) {
    const vehicleName = vehicles.find((vehicle) => vehicle.vehicleId === trip.vehicleId)?.name ?? trip.vehicleId
    const previous = staff.find((person) => person.staffId === trip.returnDriverStaffId)?.displayName ?? 'Unassigned'
    const proposed = staff.find((person) => person.staffId === staffId)?.displayName ?? 'Unassigned'
    if (!window.confirm(`Update the effective return driver for ${vehicleName}?\n\nPrevious: ${previous}\nProposed: ${proposed}\n\nThe original Start Return snapshot and all lifecycle timestamps will remain unchanged.`)) return
    await act(() => correctReturnDriver(eventId, trip.vehicleId, staffId, firebaseUser?.uid ?? ''), 'Effective return driver updated and audited.')
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
      const groupSelected = group.occupants.length > 0 && group.occupants.every((item) => selected.has(keyOf(item)))
      return <article key={group.vehicleId ?? 'unassigned'} className={`rounded-2xl border p-4 ${group.overCapacityBy ? 'border-rose-400 bg-rose-50' : ''}`}>
        <div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="font-semibold">{vehicle?.name ?? 'Unassigned'}</h4>{vehicle ? <p className="text-sm text-slate-600">{tripIsPlanned ? `Departure ${group.occupancy}/${vehicle.capacity}${group.overCapacityBy ? ` — ${group.overCapacityBy} over capacity` : ` — ${group.availableSeats} available`}` : `Completed departure · ${trip?.stage ?? ''}`}</p> : <p className="text-sm text-slate-600">{group.occupancy} participant(s)</p>}{trip?.departedAt ? <p className="mt-1 text-sm font-medium text-emerald-700">Departed {trip.departedAt.toDate().toLocaleString()} · Driver: {staff.find((person) => person.staffId === trip.departureDriverStaffId)?.displayName ?? 'Unassigned'}</p> : null}</div><div className="flex gap-3">{trip && canPlan && tripIsPlanned && ['confirmed', 'in_progress'].includes(event.status) ? <button type="button" disabled={busy} onClick={() => void openDepartureReview(trip.vehicleId)} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Depart</button> : null}{trip && canPlan && tripIsPlanned ? <button type="button" disabled={busy} onClick={() => void act(() => removePlannedEventVehicleTrip(eventId, trip.vehicleId), 'Vehicle removed.')} className="text-sm font-semibold text-rose-700">Remove</button> : null}</div></div>
        {tripIsPlanned ? <>{trip ? <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Departure driver<select disabled={!canPlan || busy || !tripIsPlanned} value={trip.departureDriverStaffId ?? ''} onChange={(event) => void act(() => setPlannedTripDriver(eventId, trip.vehicleId, 'departure', event.target.value || null, firebaseUser?.uid ?? ''), 'Departure driver updated.')} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">No driver</option>{drivers.map(driverOption)}</select></label>
          <div><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" disabled={!canPlan || busy || !tripIsPlanned} checked={returnDriverIsVisible(trip.returnDriverMirrorsDeparture)} onChange={(event) => event.target.checked ? void act(() => setPlannedTripDriver(eventId, trip.vehicleId, 'return', trip.returnDriverStaffId, firebaseUser?.uid ?? ''), 'Return transportation marked as different.') : void act(() => mirrorReturnDriver(eventId, trip.vehicleId, firebaseUser?.uid ?? ''), 'Return transportation now matches departure.')} /> Return occupants differ from departure</label>
            {returnDriverIsVisible(trip.returnDriverMirrorsDeparture) ? <label className="mt-2 block text-sm font-medium">Return driver<select disabled={!canPlan || busy || !tripIsPlanned} value={trip.returnDriverStaffId ?? ''} onChange={(event) => void act(() => setPlannedTripDriver(eventId, trip.vehicleId, 'return', event.target.value || null, firebaseUser?.uid ?? ''), 'Return driver updated.')} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">No driver</option>{drivers.map(driverOption)}</select></label> : null}
          </div>
        </div> : null}
        <div className="mt-4 flex items-center justify-between"><h5 className="text-sm font-semibold">Departure occupants</h5>{group.occupants.length && departureEditable ? <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={groupSelected} disabled={busy} onChange={() => toggleGroup(group.occupants)} /> Select all</label> : null}</div>
        <div className="mt-2 space-y-2">{group.occupants.length === 0 ? <p className="text-sm text-slate-500">No occupants.</p> : group.occupants.map((occupant) => <div key={keyOf(occupant)} className="grid gap-2 rounded-xl bg-white p-2 sm:grid-cols-[1fr_auto_auto] sm:items-center"><label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy || !departureEditable} checked={selected.has(keyOf(occupant))} onChange={() => toggle(keyOf(occupant))} /><span>{occupant.displayName} <span className="text-xs text-slate-500">({occupant.kind})</span></span></label><select aria-label={`Move ${occupant.displayName}`} disabled={!canPlan || busy || !departureEditable} value={occupant.departureVehicleId ?? 'unassigned'} onChange={(event) => void move([occupant], event.target.value === 'unassigned' ? null : event.target.value, `${occupant.displayName} moved.`)} className="rounded-lg border px-2 py-1 text-sm"><option value="unassigned">Unassigned</option>{trips.filter((item) => item.stage === 'planned').map((item) => <option key={item.vehicleId} value={item.vehicleId}>{vehicles.find((candidate) => candidate.vehicleId === item.vehicleId)?.name ?? item.vehicleId}</option>)}</select><button type="button" disabled={!canPlan || busy || !departureEditable} onClick={() => void removeParticipant(occupant)} className="rounded-lg border border-rose-300 px-2 py-1 text-sm font-semibold text-rose-700">Remove</button></div>)}</div></> : trip ? <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold">Completed departure details</summary><p className="mt-2">Driver: {staff.find((person) => person.staffId === trip.departureDriverStaffId)?.displayName ?? 'Unassigned'} · Occupants: {group.occupants.map((occupant) => occupant.displayName).join(', ') || 'None'} · Capacity: {group.occupancy}/{vehicle?.capacity ?? '—'}</p></details> : null}
      </article>
    })}</div>

    {trips.some((trip) => trip.stage !== 'planned') ? <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
      <h4 className="text-base font-semibold">Return passenger assignments</h4>
      <p className="mt-1 text-sm text-slate-600">These are return-only assignments. Departure assignments and the immutable departure snapshot are locked.</p>
      {returnGroups.at(-1)?.occupancy ? <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Warning: {returnGroups.at(-1)!.occupancy} participant(s) are Return Unassigned.</p> : null}
      <div className="mt-4 space-y-4">{returnGroups.filter((group) => group.vehicleId == null || trips.find((trip) => trip.vehicleId === group.vehicleId)?.stage !== 'planned').map((group) => {
        const trip = group.vehicleId ? trips.find((item) => item.vehicleId === group.vehicleId) ?? null : null
        const correctionMode = returnCorrectionPhase
        const originalKeys = snapshotOccupantKeys(trip?.originalReturnSnapshot ?? null)
        const effectiveKeys = new Set(group.occupants.map(keyOf))
        const differs = trip?.originalReturnSnapshot ? [...originalKeys].some((key) => !effectiveKeys.has(key)) || [...effectiveKeys].some((key) => !originalKeys.has(key)) : false
        const allSelected = group.occupants.length > 0 && group.occupants.every((person) => returnSelected.has(keyOf(person)))
        return <article key={`return:${group.vehicleId ?? 'unassigned'}`} className="rounded-2xl border bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h5 className="font-semibold">{group.vehicleId ? vehicles.find((vehicle) => vehicle.vehicleId === group.vehicleId)?.name ?? group.vehicleId : 'Return Unassigned'}</h5><p className={`text-sm ${group.overCapacityBy ? 'font-semibold text-rose-700' : 'text-slate-600'}`}>{group.occupancy}{group.capacity == null ? '' : `/${group.capacity}`}{group.overCapacityBy ? ` — ${group.overCapacityBy} over capacity` : ''}{trip ? ` · ${trip.stage}` : ''}</p>{differs ? <p className="mt-1 text-xs font-semibold text-amber-700">Effective roster differs from the original Start Return snapshot.</p> : null}</div>{group.occupants.length ? <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={allSelected} disabled={busy} onChange={() => { setReturnSelected(new Set(allSelected ? [] : group.occupants.map(keyOf))); setReturnDestination('') }} /> Select all</label> : null}</div>
          {trip ? <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Current return operation</p>{trip.returnStartedAt ? <p className="text-sm font-medium">Return started {trip.returnStartedAt.toDate().toLocaleString()}</p> : trip.arrivedAtEventAt ? <p className="text-sm font-medium">Arrived {trip.arrivedAtEventAt.toDate().toLocaleString()}</p> : <p className="text-sm font-medium">Preparing return</p>}<p className="text-sm">Effective driver: {staff.find((person) => person.staffId === trip.returnDriverStaffId)?.displayName ?? 'Unassigned'}</p></div><div className="flex flex-wrap gap-2">{canPlan && trip.stage === 'departed' && event.status === 'in_progress' ? <button type="button" disabled={busy} onClick={() => void openArrivalReview(trip.vehicleId)} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Arrive at Event</button> : null}{canPlan && trip.stage === 'arrived_at_event' && event.status === 'in_progress' ? <button type="button" disabled={busy} onClick={() => void openStartReturnReview(trip.vehicleId)} className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{openingStartReturnVehicleId === trip.vehicleId ? 'Preparing…' : 'Start Return'}</button> : null}</div></div>{trip.vehicleId === openingStartReturnVehicleId ? <p className="mt-2 text-sm font-medium text-indigo-700" role="status">Preparing Start Return review…</p> : null}{trip.stage === 'arrived_at_event' && startReturnActionError ? <p className="mt-2 text-sm font-medium text-rose-700" role="alert">{startReturnActionError}</p> : null}{canPlan && ['departed', 'arrived_at_event', 'return_started'].includes(trip.stage) ? <label className="mt-3 block text-sm font-medium">Assign or change effective return driver<select aria-label={`Effective return driver for ${vehicles.find((vehicle) => vehicle.vehicleId === trip.vehicleId)?.name ?? trip.vehicleId}`} disabled={busy} value={trip.returnDriverStaffId ?? ''} onChange={(change) => void changeReturnDriver(trip, change.target.value || null)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2"><option value="">Clear return driver</option>{group.occupants.filter((person) => person.kind === 'staff').flatMap((person) => { const candidate = staff.find((item) => item.staffId === person.personId); return candidate?.active && candidate.canDrive ? [<option key={person.personId} value={person.personId}>{person.displayName}</option>] : [] })}</select></label> : null}</div> : null}
          <div className="mt-3 space-y-2">{group.occupants.length ? group.occupants.map((person) => {
            const personCorrection = returnCorrectionPhase
            const targets = trips.filter((candidate) => returnTargetIsEligible(candidate.stage, personCorrection))
            return <div key={`return-person:${keyOf(person)}`} className="grid gap-2 rounded-xl bg-slate-50 p-2 sm:grid-cols-[1fr_auto] sm:items-center"><label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy} checked={returnSelected.has(keyOf(person))} onChange={() => setReturnSelected((current) => { const next = new Set(current); next.has(keyOf(person)) ? next.delete(keyOf(person)) : next.add(keyOf(person)); return next })} />{person.displayName} <span className="text-xs text-slate-500">({person.kind})</span></label><select aria-label={`Move return passenger ${person.displayName}`} disabled={!canPlan || busy} value={person.returnVehicleId ?? 'unassigned'} onChange={(change) => void confirmReturnMove([person], change.target.value === 'unassigned' ? null : change.target.value, personCorrection)} className="rounded-lg border px-2 py-1 text-sm"><option value="unassigned">Return Unassigned</option>{targets.map((candidate) => <option key={candidate.vehicleId} value={candidate.vehicleId}>{vehicles.find((vehicle) => vehicle.vehicleId === candidate.vehicleId)?.name ?? candidate.vehicleId}</option>)}</select></div>
          }) : <p className="text-sm text-slate-500">No effective return passengers.</p>}</div>
          {trip?.originalReturnSnapshot ? <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold">Original Start Return roster</summary><p className="mt-2">{[...trip.originalReturnSnapshot.studentOccupantNames, ...trip.originalReturnSnapshot.staffOccupantNames].join(', ') || 'No passengers'} · Driver: {trip.originalReturnSnapshot.driverName} · {trip.originalReturnSnapshot.destination}</p></details> : null}
          {correctionMode ? <p className="mt-3 text-xs font-semibold text-indigo-700">Changes from this roster are recorded as audited corrections.</p> : null}
        </article>
      })}</div>
      {returnSelected.size ? <div className="sticky bottom-3 mt-4 rounded-2xl border bg-white p-4 shadow-lg"><p className="text-sm font-semibold">{returnSelected.size} return passenger(s) selected · {returnSelectionNeedsCorrection ? 'Correction' : 'Ordinary return edit'}</p><div className="mt-2 flex flex-col gap-2 sm:flex-row"><select value={returnDestination} disabled={busy} onChange={(change) => setReturnDestination(change.target.value)} className="rounded-xl border px-3 py-2"><option value="">Move selected return passengers to…</option><option value="unassigned">Return Unassigned</option>{eligibleReturnTargets.map((trip) => <option key={trip.vehicleId} value={trip.vehicleId}>{vehicles.find((vehicle) => vehicle.vehicleId === trip.vehicleId)?.name ?? trip.vehicleId}</option>)}</select><button type="button" disabled={!canPlan || busy || !returnDestination || returnSelected.size > MAX_BULK_TRANSPORTATION_SELECTION} onClick={() => void confirmReturnMove(returnSelectedPeople, returnDestination === 'unassigned' ? null : returnDestination, returnSelectionNeedsCorrection, true).then((moved) => { if (moved) { setReturnSelected(new Set()); setReturnDestination('') } })} className="rounded-xl bg-indigo-800 px-4 py-2 font-semibold text-white disabled:opacity-50">Apply return move</button><button type="button" disabled={busy} onClick={() => setReturnSelected(new Set())} className="rounded-xl border px-4 py-2">Clear</button></div></div> : null}
      {corrections.length ? <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">Return correction history ({corrections.length})</summary><ul className="mt-2 space-y-2 text-sm">{corrections.map((item) => <li key={item.correctionId} className="rounded-xl bg-white p-3"><span className="font-medium">{item.participantName}</span>: {item.previousReturnVehicleId ? vehicles.find((v) => v.vehicleId === item.previousReturnVehicleId)?.name ?? 'previous vehicle' : 'Return Unassigned'} → {item.correctedReturnVehicleId ? vehicles.find((v) => v.vehicleId === item.correctedReturnVehicleId)?.name ?? 'corrected vehicle' : 'Return Unassigned'} · {item.correctedAt?.toDate?.().toLocaleString() ?? 'pending timestamp'}{item.clearedReturnDriverTripId ? ' · return-driver role cleared' : ''}</li>)}</ul></details> : null}
      {driverCorrections.length ? <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold">Return-driver correction history ({driverCorrections.length})</summary><ul className="mt-2 space-y-2 text-sm">{driverCorrections.map((item) => <li key={item.correctionId} className="rounded-xl bg-white p-3">{vehicles.find((vehicle) => vehicle.vehicleId === item.vehicleId)?.name ?? item.vehicleId}: {staff.find((person) => person.staffId === item.previousReturnDriverStaffId)?.displayName ?? 'Unassigned'} → {staff.find((person) => person.staffId === item.correctedReturnDriverStaffId)?.displayName ?? 'Unassigned'} · {item.correctedAt?.toDate?.().toLocaleString() ?? 'pending timestamp'}</li>)}</ul></details> : null}
    </section> : null}

    {selected.size ? <div className="sticky bottom-3 mt-5 rounded-2xl border bg-white p-4 shadow-lg"><p className="text-sm font-semibold">{selected.size} selected</p><div className="mt-2 flex flex-col gap-2 sm:flex-row"><select value={destination} disabled={busy} onChange={(event) => setDestination(event.target.value)} className="rounded-xl border px-3 py-2"><option value="">Move selected to…</option><option value="unassigned">Unassigned</option>{trips.filter((trip) => trip.stage === 'planned').map((trip) => <option key={trip.vehicleId} value={trip.vehicleId}>{vehicles.find((item) => item.vehicleId === trip.vehicleId)?.name ?? trip.vehicleId}</option>)}</select><button disabled={!canPlan || busy || !destination || selected.size > MAX_BULK_TRANSPORTATION_SELECTION} onClick={() => void confirmAndMove(selectedPeople, destinationId, 'Selected participants moved.', true).then((moved) => { if (moved) { setSelected(new Set()); setDestination('') } })} className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-50">Apply</button><button disabled={busy} onClick={() => setSelected(new Set())} className="rounded-xl border px-4 py-2">Clear</button></div>{destination ? <p className={`mt-2 text-sm ${projectedOver ? 'font-semibold text-rose-700' : 'text-slate-600'}`}>Projected destination occupancy: {projected}{destinationGroup?.capacity == null ? '' : `/${destinationGroup.capacity}`}{projectedOver ? ` — ${projectedOver} over capacity (warning only)` : ''}</p> : null}</div> : null}
    {departureReview ? <DepartureReviewDialog review={departureReview} busy={busy} confirmed={reviewConfirmed} onConfirmed={setReviewConfirmed} onCancel={() => { if (!busy) setDepartureReview(null) }} onDepart={() => void confirmDeparture()} /> : null}
    {arrivalReview ? <ArrivalReviewDialog review={arrivalReview} busy={busy} error={message} onCancel={() => { if (!busy) setArrivalReview(null) }} onArrive={() => void confirmArrival()} /> : null}
    {startReturnReview ? <StartReturnReviewDialog review={startReturnReview} busy={busy} error={message} confirmed={startReturnConfirmed} onConfirmed={setStartReturnConfirmed} onCancel={() => { if (!busy) setStartReturnReview(null) }} onStart={() => void confirmStartReturn()} /> : null}
  </section>
}

function ArrivalReviewDialog({ review, busy, error, onCancel, onArrive }: { review: ArrivalReview; busy: boolean; error: string | null; onCancel: () => void; onArrive: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="arrival-review-title"><div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-6"><h4 id="arrival-review-title" className="text-xl font-semibold">Confirm arrival at event</h4><p className="mt-2 text-sm text-slate-600">This records the actual arrival time for this vehicle only. The event remains in progress; Start Return is not performed and return assignments do not change.</p>{error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p> : null}<dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Event</dt><dd>{review.eventName}</dd></div><div><dt className="font-semibold">Vehicle</dt><dd>{review.vehicleName}</dd></div><div><dt className="font-semibold">Departure driver</dt><dd>{review.departureDriverName}</dd></div><div><dt className="font-semibold">Actual departure</dt><dd>{new Date(review.departedAtMillis).toLocaleString()}</dd></div><div><dt className="font-semibold">Destination</dt><dd>{review.eventLocation}</dd></div><div><dt className="font-semibold">Departure occupants</dt><dd>{review.departureOccupantCount}</dd></div></dl><p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Confirming records the vehicle's actual arrival time. This action cannot currently be undone through the UI.</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={busy} onClick={onCancel} className="rounded-xl border px-4 py-2 font-semibold">Cancel</button><button type="button" disabled={busy} onClick={onArrive} className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Recording arrival…' : 'Confirm Arrive at Event'}</button></div></div></div>
}

function StartReturnReviewDialog({ review, busy, error, confirmed, onConfirmed, onCancel, onStart }: { review: StartReturnReview; busy: boolean; error: string | null; confirmed: boolean; onConfirmed: (value: boolean) => void; onCancel: () => void; onStart: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="start-return-title"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-6">
    <h4 id="start-return-title" className="text-xl font-semibold">Double-check Start Return</h4><p className="mt-2 text-sm text-slate-600">Confirmation records the actual return-start time. This displayed roster becomes the immutable original Start Return snapshot; later changes are audited corrections.</p>
    {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p> : null}
    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Event</dt><dd>{review.eventName}</dd></div><div><dt className="font-semibold">Vehicle</dt><dd>{review.vehicleName}</dd></div><div><dt className="font-semibold">Return driver</dt><dd>{review.returnDriverName}</dd></div><div><dt className="font-semibold">Destination</dt><dd>{review.destination}</dd></div><div><dt className="font-semibold">Arrived at event</dt><dd>{new Date(review.arrivedAtEventMillis).toLocaleString()}</dd></div><div><dt className="font-semibold">Capacity</dt><dd>{review.totalOccupants}/{review.capacity}{review.overCapacityBy ? ` · ${review.overCapacityBy} over` : ''}</dd></div><div><dt className="font-semibold">Students</dt><dd>{review.studentCount}</dd></div><div><dt className="font-semibold">Staff / total</dt><dd>{review.staffCount} / {review.totalOccupants}</dd></div></dl>
    <div className="mt-4"><h5 className="text-sm font-semibold">Original return occupants</h5><ul className="mt-2 space-y-1 text-sm">{review.occupants.map((person) => <li key={keyOf(person)}>{person.displayName} <span className="text-slate-500">({person.kind})</span></li>)}</ul></div>
    {review.unassignedReturnCount || review.overCapacityBy ? <div className="mt-4 space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{review.unassignedReturnCount ? <p><strong>Warning:</strong> {review.unassignedReturnCount} event participant(s) remain Return Unassigned.</p> : null}{review.overCapacityBy ? <p><strong>Warning:</strong> This vehicle is {review.overCapacityBy} occupant(s) over capacity.</p> : null}<p>These warnings do not block Start Return, but require explicit confirmation.</p></div> : null}
    <label className="mt-5 flex items-start gap-3 rounded-xl border p-3 text-sm font-medium"><input className="mt-1" type="checkbox" checked={confirmed} disabled={busy} onChange={(change) => onConfirmed(change.target.checked)} /> I double-checked the return driver and passenger assignments and confirm this vehicle is starting its return now.</label>
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={busy} onClick={onCancel} className="rounded-xl border px-4 py-2 font-semibold">Cancel</button><button type="button" disabled={busy || !confirmed} onClick={onStart} className="rounded-xl bg-indigo-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Recording Start Return…' : 'Confirm Start Return'}</button></div>
  </div></div>
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
