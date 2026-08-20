import type { DepartureSnapshot, EventVehicleTripRecord } from '../types/models'

export type ArrivalReview = {
  eventId: string
  eventName: string
  eventLocation: string
  eventStatus: string
  eventUpdatedAtMillis: number
  eventStartedAtMillis: number
  eventStartedByUserId: string
  eventStartedByVehicleTripId: string
  tripId: string
  tripUpdatedAtMillis: number
  vehicleId: string
  vehicleName: string
  departureDriverName: string
  departedAtMillis: number
  departureOccupantCount: number
  departureSnapshot: DepartureSnapshot
  reviewToken: string
}

export function isValidDepartureSnapshot(snapshot: unknown, vehicleId: string) {
  if (!snapshot || typeof snapshot !== 'object') return false
  const value = snapshot as DepartureSnapshot
  return value.vehicleId === vehicleId && typeof value.vehicleName === 'string' && Boolean(value.vehicleName.trim()) &&
    typeof value.driverStaffId === 'string' && Boolean(value.driverStaffId) && typeof value.driverName === 'string' && Boolean(value.driverName.trim()) &&
    Array.isArray(value.studentOccupantIds) && Array.isArray(value.studentOccupantNames) && Array.isArray(value.staffOccupantIds) && Array.isArray(value.staffOccupantNames) &&
    Number.isInteger(value.studentCount) && value.studentCount === value.studentOccupantIds.length && value.studentCount === value.studentOccupantNames.length &&
    Number.isInteger(value.staffCount) && value.staffCount === value.staffOccupantIds.length && value.staffCount === value.staffOccupantNames.length &&
    value.totalOccupants === value.studentCount + value.staffCount && Number.isInteger(value.vehicleCapacity) && value.vehicleCapacity > 0 &&
    value.overCapacity === (value.totalOccupants > value.vehicleCapacity)
}

export function arrivalBlockingError(eventStatus: string, trip: Pick<EventVehicleTripRecord, 'assignmentStatus' | 'stage' | 'departedAt' | 'departedByUserId' | 'departureSnapshot' | 'arrivedAtEventAt' | 'arrivedAtEventByUserId' | 'returnStartedAt' | 'returnedAt' | 'vehicleId'>) {
  if (eventStatus !== 'in_progress') return 'The event must be in progress before recording arrival.'
  if (trip.assignmentStatus !== 'active') return 'The vehicle trip is inactive.'
  if (trip.stage !== 'departed') return trip.stage === 'planned' ? 'This vehicle has not departed.' : 'This vehicle is no longer eligible for Arrive at Event.'
  if (!trip.departedAt || !trip.departedByUserId || !isValidDepartureSnapshot(trip.departureSnapshot, trip.vehicleId)) return 'The vehicle is missing valid departure timestamp, audit, or snapshot data.'
  if (trip.arrivedAtEventAt || trip.arrivedAtEventByUserId) return 'Arrival has already been recorded for this vehicle.'
  if (trip.returnStartedAt || trip.returnedAt) return 'This vehicle has already advanced beyond arrival.'
  return null
}

export function arrivalReviewToken(input: Omit<ArrivalReview, 'reviewToken'>) {
  const snapshot = input.departureSnapshot
  return JSON.stringify({
    eventStatus: input.eventStatus,
    eventUpdatedAtMillis: input.eventUpdatedAtMillis,
    eventStartedAtMillis: input.eventStartedAtMillis,
    eventStartedByUserId: input.eventStartedByUserId,
    eventStartedByVehicleTripId: input.eventStartedByVehicleTripId,
    tripId: input.tripId,
    tripUpdatedAtMillis: input.tripUpdatedAtMillis,
    departedAtMillis: input.departedAtMillis,
    snapshot: {
      vehicleId: snapshot.vehicleId,
      vehicleName: snapshot.vehicleName,
      driverStaffId: snapshot.driverStaffId,
      driverName: snapshot.driverName,
      studentOccupantIds: snapshot.studentOccupantIds,
      studentOccupantNames: snapshot.studentOccupantNames,
      staffOccupantIds: snapshot.staffOccupantIds,
      staffOccupantNames: snapshot.staffOccupantNames,
      studentCount: snapshot.studentCount,
      staffCount: snapshot.staffCount,
      totalOccupants: snapshot.totalOccupants,
      vehicleCapacity: snapshot.vehicleCapacity,
      overCapacity: snapshot.overCapacity,
    },
  })
}
