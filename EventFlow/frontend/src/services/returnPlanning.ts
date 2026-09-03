import type { DepartureSnapshot, EventVehicleTripRecord } from '../types/models'
import type { TransportationOccupant } from './transportationPlanning'

export const ORDINARY_RETURN_STAGES = ['departed', 'arrived_at_event'] as const
export const CORRECTABLE_RETURN_STAGES = ['departed', 'arrived_at_event', 'return_started', 'returned'] as const

export type StartReturnReview = {
  eventId: string; eventName: string; eventStatus: string; eventUpdatedAtMillis: number
  tripId: string; tripUpdatedAtMillis: number; vehicleId: string; vehicleName: string
  returnDriverStaffId: string; returnDriverName: string; destination: string
  occupants: TransportationOccupant[]; studentCount: number; staffCount: number; totalOccupants: number
  capacity: number; overCapacityBy: number; unassignedReturnCount: number; arrivedAtEventMillis: number
  reviewToken: string
}

export function returnTargetIsEligible(stage: string, correction: boolean) {
  return (correction ? CORRECTABLE_RETURN_STAGES : ORDINARY_RETURN_STAGES).includes(stage as never)
}

export function returnMoveRequiresCorrection(sourceStage: string | null) { return sourceStage === 'return_started' || sourceStage === 'returned' }

export function returnCorrectionPhaseIsActive(eventStatus: string, stages: string[]) {
  return eventStatus === 'completed' || stages.some((stage) => stage === 'return_started' || stage === 'returned')
}

export function effectiveRosterDiffers(snapshot: DepartureSnapshot | null, occupants: TransportationOccupant[]) {
  const original = snapshotOccupantKeys(snapshot), effective = new Set(occupants.map((person) => `${person.kind}:${person.personId}`))
  return original.size !== effective.size || [...original].some((key) => !effective.has(key))
}

export function startReturnWarnings(unassignedReturnCount: number, overCapacityBy: number) {
  return [unassignedReturnCount > 0 ? `${unassignedReturnCount} event participant(s) remain Return Unassigned.` : null, overCapacityBy > 0 ? `This vehicle is ${overCapacityBy} occupant(s) over capacity.` : null].filter((item): item is string => Boolean(item))
}

export function startReturnBlockingError(eventStatus: string, trip: EventVehicleTripRecord) {
  if (eventStatus !== 'in_progress') return 'The event must be in progress before Start Return.'
  if (trip.assignmentStatus !== 'active') return 'The vehicle trip is inactive.'
  if (trip.stage !== 'arrived_at_event') return 'Only a vehicle that has arrived at the event may Start Return.'
  if (!trip.departedAt || !trip.departedByUserId || !trip.departureSnapshot || !trip.arrivedAtEventAt || !trip.arrivedAtEventByUserId) return 'The vehicle is missing valid Depart or Arrive audit data.'
  if (trip.returnStartedAt || trip.returnStartedByUserId || trip.originalReturnSnapshot || trip.returnedAt) return 'The vehicle contains incompatible return lifecycle data.'
  if (!trip.returnDriverStaffId) return 'Assign an eligible return driver before Start Return.'
  return null
}

export function startReturnReviewToken(input: Omit<StartReturnReview, 'reviewToken'>) {
  return JSON.stringify({ eventStatus: input.eventStatus, eventUpdatedAtMillis: input.eventUpdatedAtMillis, tripId: input.tripId, tripUpdatedAtMillis: input.tripUpdatedAtMillis, driver: input.returnDriverStaffId, destination: input.destination, capacity: input.capacity, arrived: input.arrivedAtEventMillis, unassigned: input.unassignedReturnCount, occupants: input.occupants.map((person) => `${person.kind}:${person.personId}:${person.displayName}:${person.returnVehicleId ?? ''}`).sort() })
}

export function buildOriginalReturnSnapshot(review: StartReturnReview, startedByUserId: string, startedAt: unknown) {
  const students = review.occupants.filter((person) => person.kind === 'student')
  const staff = review.occupants.filter((person) => person.kind === 'staff')
  return {
    vehicleId: review.vehicleId, vehicleName: review.vehicleName,
    driverStaffId: review.returnDriverStaffId, driverName: review.returnDriverName,
    studentOccupantIds: students.map((person) => person.personId), studentOccupantNames: students.map((person) => person.displayName),
    staffOccupantIds: staff.map((person) => person.personId), staffOccupantNames: staff.map((person) => person.displayName),
    studentCount: students.length, staffCount: staff.length, totalOccupants: review.totalOccupants,
    vehicleCapacity: review.capacity, overCapacity: review.overCapacityBy > 0,
    destination: review.destination, startedByUserId, startedAt,
  }
}

export function snapshotOccupantKeys(snapshot: DepartureSnapshot | null) {
  if (!snapshot) return new Set<string>()
  return new Set([...snapshot.studentOccupantIds.map((id) => `student:${id}`), ...snapshot.staffOccupantIds.map((id) => `staff:${id}`)])
}
