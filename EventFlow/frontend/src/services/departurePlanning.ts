import type { DepartureSnapshot, EventVehicleTripRecord } from '../types/models'

export type DeparturePerson = {
  kind: 'student' | 'staff'
  personId: string
  displayName: string
  departureVehicleId: string | null
  returnVehicleId: string | null
}

export type DepartureReview = {
  eventId: string
  eventName: string
  eventStatus: string
  eventUpdatedAtMillis: number
  tripId: string
  vehicleId: string
  vehicleName: string
  vehicleCapacity: number
  departureDriverStaffId: string
  departureDriverName: string
  occupants: DeparturePerson[]
  studentCount: number
  staffCount: number
  totalOccupants: number
  availableSeats: number
  overCapacityBy: number
  unassignedDepartureCount: number
  reviewToken: string
}

export function departureReviewToken(input: Omit<DepartureReview, 'reviewToken'>) {
  return JSON.stringify({
    eventStatus: input.eventStatus,
    eventUpdatedAtMillis: input.eventUpdatedAtMillis,
    tripId: input.tripId,
    driver: input.departureDriverStaffId,
    occupants: input.occupants.map((person) => `${person.kind}:${person.personId}:${person.departureVehicleId ?? ''}:${person.returnVehicleId ?? ''}`).sort(),
    unassigned: input.unassignedDepartureCount,
    capacity: input.vehicleCapacity,
  })
}

export function buildDepartureSnapshot(review: DepartureReview): DepartureSnapshot {
  const students = review.occupants.filter((person) => person.kind === 'student')
  const staff = review.occupants.filter((person) => person.kind === 'staff')
  return {
    vehicleId: review.vehicleId,
    vehicleName: review.vehicleName,
    driverStaffId: review.departureDriverStaffId,
    driverName: review.departureDriverName,
    studentOccupantIds: students.map((person) => person.personId),
    studentOccupantNames: students.map((person) => person.displayName),
    staffOccupantIds: staff.map((person) => person.personId),
    staffOccupantNames: staff.map((person) => person.displayName),
    studentCount: students.length,
    staffCount: staff.length,
    totalOccupants: review.occupants.length,
    vehicleCapacity: review.vehicleCapacity,
    overCapacity: review.totalOccupants > review.vehicleCapacity,
  }
}

export function reconcileInitialReturnAssignments(occupants: DeparturePerson[], trips: EventVehicleTripRecord[], departingVehicleId: string) {
  const returnDriverVehicles = new Map<string, string>()
  for (const trip of trips.filter((item) => item.assignmentStatus === 'active' && item.returnDriverStaffId)) {
    const staffId = trip.returnDriverStaffId!
    const previous = returnDriverVehicles.get(staffId)
    if (previous && previous !== trip.vehicleId) throw new Error(`Return driver ${staffId} is assigned to multiple vehicles. Resolve the driver conflict before Depart.`)
    returnDriverVehicles.set(staffId, trip.vehicleId)
  }
  const result = new Map<string, string>()
  for (const person of occupants) {
    const returnVehicleId = person.kind === 'staff' ? returnDriverVehicles.get(person.personId) ?? departingVehicleId : departingVehicleId
    result.set(`${person.kind}:${person.personId}`, returnVehicleId)
  }
  const currentReturnDriver = trips.find((trip) => trip.vehicleId === departingVehicleId)?.returnDriverStaffId
  if (currentReturnDriver) result.set(`staff:${currentReturnDriver}`, departingVehicleId)
  return result
}
