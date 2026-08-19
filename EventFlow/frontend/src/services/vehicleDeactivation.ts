import type { EventRecord, EventVehicleTripRecord } from '../types/models'

export function isEligibleFutureTripForDeactivation(event: Pick<EventRecord, 'status' | 'departureDateTime' | 'startedAt'>, trip: Pick<EventVehicleTripRecord, 'assignmentStatus' | 'stage'>, now = new Date()) {
  return (event.status === 'draft' || event.status === 'confirmed') && event.startedAt == null && event.departureDateTime > now && trip.assignmentStatus === 'active' && trip.stage === 'planned'
}

export function clearedVehicleAssignmentFields(data: { departureVehicleId?: string | null; returnVehicleId?: string | null }, vehicleId: string) {
  const changes: { departureVehicleId?: null; returnVehicleId?: null } = {}
  if (data.departureVehicleId === vehicleId) changes.departureVehicleId = null
  if (data.returnVehicleId === vehicleId) changes.returnVehicleId = null
  return changes
}
