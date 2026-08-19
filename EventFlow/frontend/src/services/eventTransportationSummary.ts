import type { EventParticipantRecord, EventRecord, EventStaffParticipantRecord, EventVehicleTripRecord, StaffRecord, VehicleRecord } from '../types/models'

export interface EventTransportationSummary {
  vehicleNames: string[]
  departureDriverNames: string[]
  returnDriverDifferences: string[]
  activeVehicleCount: number
  assignedDepartureOccupantCount: number
  activeParticipantRelationshipCount: number
  totalDepartureCapacity: number
  unassignedDepartureCount: number
  hasOverCapacity: boolean
  hasPlan: boolean
  participantCountMismatch: boolean
}

export function buildEventTransportationSummary(event: EventRecord, trips: EventVehicleTripRecord[], studentParticipants: EventParticipantRecord[], staffParticipants: EventStaffParticipantRecord[], vehicles: VehicleRecord[], staff: StaffRecord[]): EventTransportationSummary {
  const activeTrips = trips.filter((trip) => trip.eventId === event.eventId && trip.assignmentStatus === 'active')
  const tripVehicleIds = new Set(activeTrips.map((trip) => trip.vehicleId))
  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.vehicleId, vehicle]))
  const staffNameById = new Map(staff.map((person) => [person.staffId, person.displayName]))
  const relationships = [
    ...studentParticipants.filter((item) => item.eventId === event.eventId && item.status === 'active').map((item) => ({ key: `student:${item.studentId}`, departureVehicleId: item.departureVehicleId })),
    ...staffParticipants.filter((item) => item.eventId === event.eventId && item.status === 'active').map((item) => ({ key: `staff:${item.staffId}`, departureVehicleId: item.departureVehicleId })),
  ]
  const participants = [...new Map(relationships.map((item) => [item.key, item])).values()]
  const occupancyByVehicle = new Map<string, number>()
  let unassignedDepartureCount = 0
  for (const participant of participants) {
    if (!participant.departureVehicleId || !tripVehicleIds.has(participant.departureVehicleId)) {
      unassignedDepartureCount += 1
      continue
    }
    occupancyByVehicle.set(participant.departureVehicleId, (occupancyByVehicle.get(participant.departureVehicleId) ?? 0) + 1)
  }
  const departureDriverNames = [...new Set(activeTrips.flatMap((trip) => trip.departureDriverStaffId ? [staffNameById.get(trip.departureDriverStaffId) ?? trip.departureDriverStaffId] : []))]
  const returnDriverDifferences = activeTrips.flatMap((trip) => {
    if (trip.returnDriverStaffId === trip.departureDriverStaffId) return []
    const vehicleName = vehicleById.get(trip.vehicleId)?.name ?? trip.vehicleId
    const returnName = trip.returnDriverStaffId ? staffNameById.get(trip.returnDriverStaffId) ?? trip.returnDriverStaffId : 'No driver'
    return [`${vehicleName}: ${returnName}`]
  })
  const totalDepartureCapacity = activeTrips.reduce((total, trip) => total + Math.max(0, vehicleById.get(trip.vehicleId)?.capacity ?? 0), 0)
  return {
    vehicleNames: activeTrips.map((trip) => vehicleById.get(trip.vehicleId)?.name ?? trip.vehicleId),
    departureDriverNames,
    returnDriverDifferences,
    activeVehicleCount: activeTrips.length,
    assignedDepartureOccupantCount: participants.length - unassignedDepartureCount,
    activeParticipantRelationshipCount: participants.length,
    totalDepartureCapacity,
    unassignedDepartureCount,
    hasOverCapacity: activeTrips.some((trip) => (occupancyByVehicle.get(trip.vehicleId) ?? 0) > Math.max(0, vehicleById.get(trip.vehicleId)?.capacity ?? 0)) || participants.length - unassignedDepartureCount > totalDepartureCapacity,
    hasPlan: activeTrips.length > 0,
    participantCountMismatch: participants.length !== event.participantCount,
  }
}
