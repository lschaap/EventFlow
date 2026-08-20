import type { EventParticipantRecord, EventStaffParticipantRecord, EventVehicleTripRecord, VehicleRecord } from '../types/models'

export type TransportationParticipantKey = { kind: 'student' | 'staff'; personId: string }
export type TransportationLeg = 'departure' | 'return'
export type AffectedDriverRole = { tripId: string; vehicleId: string; staffId: string; leg: TransportationLeg }
export type TransportationOccupant = TransportationParticipantKey & { relationshipId: string; displayName: string; departureVehicleId: string | null; returnVehicleId: string | null }
export type TransportationGroup = { vehicleId: string | null; occupants: TransportationOccupant[]; occupancy: number; capacity: number | null; overCapacityBy: number; availableSeats: number | null }

export function groupTransportationOccupants(occupants: TransportationOccupant[], trips: EventVehicleTripRecord[], vehicles: VehicleRecord[], leg: 'departure' | 'return'): TransportationGroup[] {
  const field = leg === 'departure' ? 'departureVehicleId' : 'returnVehicleId'
  const groups = trips.map((trip) => {
    const capacity = vehicles.find((item) => item.vehicleId === trip.vehicleId)?.capacity ?? 0
    const members = occupants.filter((item) => item[field] === trip.vehicleId)
    return { vehicleId: trip.vehicleId, occupants: members, occupancy: members.length, capacity, overCapacityBy: Math.max(0, members.length - capacity), availableSeats: Math.max(0, capacity - members.length) }
  })
  const planned = new Set(trips.map((trip) => trip.vehicleId))
  const unassigned = occupants.filter((item) => !item[field] || !planned.has(item[field]!))
  return [...groups, { vehicleId: null, occupants: unassigned, occupancy: unassigned.length, capacity: null, overCapacityBy: 0, availableSeats: null }]
}

export function projectedOccupancy(current: number, selectedAlreadyAtDestination: number, selectedCount: number) { return current - selectedAlreadyAtDestination + selectedCount }

export function mirroredReturnVehicle(kind: 'student' | 'staff', personId: string, departureVehicleId: string | null, independentReturnVehicles: Map<string, string>) {
  return kind === 'staff' ? independentReturnVehicles.get(personId) ?? departureVehicleId : departureVehicleId
}

export function driverOccupantFields(leg: 'departure' | 'return', vehicleId: string, returnMirrorsDeparture: boolean) {
  if (leg === 'return') return { returnVehicleId: vehicleId }
  return returnMirrorsDeparture ? { departureVehicleId: vehicleId, returnVehicleId: vehicleId } : { departureVehicleId: vehicleId }
}

export function returnDriverIsVisible(returnDriverMirrorsDeparture: boolean) {
  return !returnDriverMirrorsDeparture
}

export function affectedDriverRolesForMove(trips: EventVehicleTripRecord[], staffId: string, leg: TransportationLeg, destinationVehicleId: string | null): AffectedDriverRole[] {
  const affected: AffectedDriverRole[] = []
  for (const trip of trips.filter((item) => item.assignmentStatus === 'active')) {
    if (leg === 'departure' && trip.departureDriverStaffId === staffId && destinationVehicleId !== trip.vehicleId) {
      affected.push({ tripId: trip.eventVehicleTripId, vehicleId: trip.vehicleId, staffId, leg: 'departure' })
      if (trip.returnDriverMirrorsDeparture && trip.returnDriverStaffId === staffId) affected.push({ tripId: trip.eventVehicleTripId, vehicleId: trip.vehicleId, staffId, leg: 'return' })
    }
    if (leg === 'return' && trip.returnDriverStaffId === staffId && destinationVehicleId !== trip.vehicleId) {
      affected.push({ tripId: trip.eventVehicleTripId, vehicleId: trip.vehicleId, staffId, leg: 'return' })
    }
  }
  return affected
}

export function clearedDriverFieldsForMove(trip: EventVehicleTripRecord, staffId: string, leg: TransportationLeg, destinationVehicleId: string | null) {
  const changes: { departureDriverStaffId?: null; returnDriverStaffId?: null; returnDriverMirrorsDeparture?: boolean } = {}
  if (leg === 'departure' && trip.departureDriverStaffId === staffId && destinationVehicleId !== trip.vehicleId) {
    changes.departureDriverStaffId = null
    if (trip.returnDriverMirrorsDeparture && trip.returnDriverStaffId === staffId) {
      changes.returnDriverStaffId = null
      changes.returnDriverMirrorsDeparture = true
    }
  }
  if (leg === 'return' && trip.returnDriverStaffId === staffId && destinationVehicleId !== trip.vehicleId) {
    changes.returnDriverStaffId = null
    if (trip.returnDriverMirrorsDeparture) changes.returnDriverMirrorsDeparture = false
  }
  return changes
}

export function removedStaffDriverFields(trip: Pick<EventVehicleTripRecord, 'departureDriverStaffId' | 'returnDriverStaffId'>, staffId: string) {
  const changes: { departureDriverStaffId?: null; returnDriverStaffId?: null; returnDriverMirrorsDeparture?: boolean } = {}
  if (trip.departureDriverStaffId === staffId) changes.departureDriverStaffId = null
  if (trip.returnDriverStaffId === staffId) {
    changes.returnDriverStaffId = null
    changes.returnDriverMirrorsDeparture = trip.departureDriverStaffId === staffId
  }
  return changes
}

export function combineTransportationOccupants(students: EventParticipantRecord[], staff: EventStaffParticipantRecord[], studentNames: Map<string, string>, staffNames: Map<string, string>): TransportationOccupant[] {
  return [
    ...students.filter((item) => item.status === 'active').map((item) => ({ kind: 'student' as const, personId: item.studentId, relationshipId: item.eventParticipantId, displayName: studentNames.get(item.studentId) ?? item.studentId, departureVehicleId: item.departureVehicleId ?? null, returnVehicleId: item.returnVehicleId ?? null })),
    ...staff.filter((item) => item.status === 'active').map((item) => ({ kind: 'staff' as const, personId: item.staffId, relationshipId: item.eventStaffParticipantId, displayName: staffNames.get(item.staffId) ?? item.staffId, departureVehicleId: item.departureVehicleId ?? null, returnVehicleId: item.returnVehicleId ?? null })),
  ].sort((a, b) => a.displayName.localeCompare(b.displayName))
}
