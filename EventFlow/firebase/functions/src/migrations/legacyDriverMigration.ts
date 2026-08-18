export type LegacyDriver = {
  eventDriverId: string
  eventId: string
  staffId: string
  vehicleId: string | null
  status: string
  role?: string | null
}

export type MigrationEvent = { eventId: string; status: string }
export type MigrationStaff = { staffId: string; active: boolean; canDrive: boolean }
export type MigrationVehicle = { vehicleId: string; active: boolean }

export type MigrationCandidate = {
  tripId: string
  eventId: string
  vehicleId: string
  driverStaffId: string
  returnDriverMirrorsDeparture: true
  legacyDriverIds: string[]
}

export type MigrationReport = {
  legacyRecordsExamined: number
  candidateEventVehicleGroups: number
  tripsToCreate: MigrationCandidate[]
  tripsAlreadyMigrated: string[]
  driversWithoutVehicles: string[]
  ineligibleDrivers: string[]
  missingEvents: string[]
  missingStaff: string[]
  missingVehicles: string[]
  multipleDriverConflicts: Array<{ tripId: string; staffIds: string[] }>
  primarySecondaryRoleConflicts: Array<{ tripId: string; roles: string[]; legacyDriverIds: string[] }>
  skippedCompletedCancelledEvents: string[]
  errors: string[]
}

export const getTripId = (eventId: string, vehicleId: string) => `${eventId}__${vehicleId}`

const uniqueSorted = (values: string[]) => [...new Set(values)].sort()

export function planLegacyDriverMigration(input: {
  drivers: LegacyDriver[]
  events: MigrationEvent[]
  staff: MigrationStaff[]
  vehicles: MigrationVehicle[]
  existingTripIds: string[]
}): MigrationReport {
  const report: MigrationReport = {
    legacyRecordsExamined: input.drivers.length,
    candidateEventVehicleGroups: 0,
    tripsToCreate: [],
    tripsAlreadyMigrated: [],
    driversWithoutVehicles: [],
    ineligibleDrivers: [],
    missingEvents: [],
    missingStaff: [],
    missingVehicles: [],
    multipleDriverConflicts: [],
    primarySecondaryRoleConflicts: [],
    skippedCompletedCancelledEvents: [],
    errors: [],
  }
  const events = new Map(input.events.map((item) => [item.eventId, item]))
  const staff = new Map(input.staff.map((item) => [item.staffId, item]))
  const vehicles = new Map(input.vehicles.map((item) => [item.vehicleId, item]))
  const existing = new Set(input.existingTripIds)
  const groups = new Map<string, LegacyDriver[]>()

  for (const driver of input.drivers) {
    if (driver.status !== 'assigned') continue
    const event = events.get(driver.eventId)
    if (!event) { report.missingEvents.push(driver.eventDriverId); continue }
    if (event.status === 'completed' || event.status === 'cancelled') { report.skippedCompletedCancelledEvents.push(driver.eventDriverId); continue }
    if (!driver.vehicleId) { report.driversWithoutVehicles.push(driver.eventDriverId); continue }
    const person = staff.get(driver.staffId)
    if (!person) { report.missingStaff.push(driver.eventDriverId); continue }
    if (!person.active || !person.canDrive) { report.ineligibleDrivers.push(driver.eventDriverId); continue }
    const vehicle = vehicles.get(driver.vehicleId)
    if (!vehicle) { report.missingVehicles.push(driver.eventDriverId); continue }
    if (!vehicle.active) { report.ineligibleDrivers.push(driver.eventDriverId); continue }
    const tripId = getTripId(driver.eventId, driver.vehicleId)
    groups.set(tripId, [...(groups.get(tripId) ?? []), driver])
  }

  report.candidateEventVehicleGroups = groups.size
  for (const [tripId, drivers] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (existing.has(tripId)) { report.tripsAlreadyMigrated.push(tripId); continue }
    const roles = uniqueSorted(drivers.map((item) => item.role?.trim()).filter((role): role is string => Boolean(role)))
    if (roles.length || drivers.length > 1) report.primarySecondaryRoleConflicts.push({ tripId, roles, legacyDriverIds: drivers.map((item) => item.eventDriverId).sort() })
    const staffIds = uniqueSorted(drivers.map((item) => item.staffId))
    if (staffIds.length !== 1 || drivers.length !== 1) {
      report.multipleDriverConflicts.push({ tripId, staffIds })
      continue
    }
    const driver = drivers[0]
    report.tripsToCreate.push({ tripId, eventId: driver.eventId, vehicleId: driver.vehicleId!, driverStaffId: driver.staffId, returnDriverMirrorsDeparture: true, legacyDriverIds: [driver.eventDriverId] })
  }

  report.tripsAlreadyMigrated = uniqueSorted(report.tripsAlreadyMigrated)
  report.driversWithoutVehicles = uniqueSorted(report.driversWithoutVehicles)
  report.ineligibleDrivers = uniqueSorted(report.ineligibleDrivers)
  report.missingEvents = uniqueSorted(report.missingEvents)
  report.missingStaff = uniqueSorted(report.missingStaff)
  report.missingVehicles = uniqueSorted(report.missingVehicles)
  report.skippedCompletedCancelledEvents = uniqueSorted(report.skippedCompletedCancelledEvents)
  return report
}
