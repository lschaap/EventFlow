import type { Timestamp } from 'firebase/firestore'

export type EventStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type EventVehicleTripAssignmentStatus = 'active' | 'removed'
export type EventVehicleTripStage = 'planned' | 'departed' | 'arrived_at_event' | 'return_started' | 'returned'
export type CalendarSyncStatus = 'not_synced' | 'pending' | 'synced' | 'failed'
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export interface AppUser {
  userId: string
  email: string
  staffId?: string | null
  role: 'admin' | 'staff'
  active: boolean
  createdAt?: Timestamp
  lastLoginAt?: Timestamp
}

export interface ActivityRecord {
  activityId: string
  name: string
  active: boolean
  sortOrder: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface EventTypeRecord {
  eventTypeId: string
  name: string
  active: boolean
  sortOrder: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface EventRecord {
  eventId: string
  name: string
  activityId: string
  eventTypeId: string
  status: EventStatus
  departureDateTime: Date
  returnDateTime: Date
  location: string
  purpose?: string | null
  mealsMissed: MealType[]
  equipmentNeeded: string[]
  notes?: string | null
  studentParticipantCount: number
  staffParticipantCount: number
  participantCount: number
  hasDietaryRestrictions: boolean
  createdByUserId: string
  createdByUserName: string
  createdAt: Date
  updatedAt: Date
  startedAt?: Date | null
  startedByUserId?: string | null
  startedByVehicleTripId?: string | null
  completedAt?: Date | null
  cancelledAt?: Date | null
  calendarEventId?: string | null
  calendarSyncStatus: CalendarSyncStatus
  calendarSyncError?: string | null
  lastCalendarSyncAt?: Date | null
}

export interface EventFormValues {
  name: string
  activityId: string
  eventTypeId: string
  departureDateTime: string
  returnDateTime: string
  location: string
  purpose: string
  mealsMissed: MealType[]
  equipmentNeeded: string
  notes: string
}

export interface StudentRecord {
  studentId: string
  firstName: string
  lastName: string
  displayName: string
  grade: number
  active: boolean
  dietaryRestrictions: string[]
  notes?: string | null
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface StaffRecord {
  staffId: string
  firstName: string
  lastName: string
  displayName: string
  email: string
  roleTitle: string
  dietaryRestrictions: string[]
  active: boolean
  canDrive: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface VehicleRecord {
  vehicleId: string
  name: string
  capacity: number
  active: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface DepartureSnapshot {
  vehicleId: string
  vehicleName: string
  driverStaffId: string
  driverName: string
  studentOccupantIds: string[]
  studentOccupantNames: string[]
  staffOccupantIds: string[]
  staffOccupantNames: string[]
  studentCount: number
  staffCount: number
  totalOccupants: number
  vehicleCapacity: number
  overCapacity: boolean
}

export interface ReturnSnapshot extends DepartureSnapshot {
  destination: string
  startedByUserId: string
  startedAt: Timestamp
}

export interface EventVehicleTripRecord {
  eventVehicleTripId: string
  eventId: string
  vehicleId: string
  assignmentStatus: EventVehicleTripAssignmentStatus
  stage: EventVehicleTripStage
  departureDriverStaffId: string | null
  returnDriverStaffId: string | null
  returnDriverMirrorsDeparture: boolean
  departedAt: Timestamp | null
  departedByUserId: string | null
  departureSnapshot: DepartureSnapshot | null
  arrivedAtEventAt: Timestamp | null
  arrivedAtEventByUserId: string | null
  returnStartedAt: Timestamp | null
  returnStartedByUserId: string | null
  originalReturnSnapshot: ReturnSnapshot | null
  returnedAt: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
  correctedAt: Timestamp | null
  correctedByUserId: string | null
  correctionReason: string | null
}

export interface ResolvedEventVehicleTrip extends EventVehicleTripRecord {
  vehicleName: string
  departureDriverName: string | null
  returnDriverName: string | null
}

export interface TransportationSettingsRecord {
  defaultReturnDestination: string
  updatedAt?: Timestamp
  updatedByUserId?: string
}

export interface EventParticipantRecord {
  eventParticipantId: string
  eventId: string
  studentId: string
  status: 'active' | 'removed'
  addedByUserId: string
  addedAt: Timestamp | any
  removedByUserId?: string | null
  removedAt?: Timestamp | any | null
  notes?: string | null
  departureVehicleId: string | null
  returnVehicleId: string | null
}

export interface EventStaffParticipantRecord {
  eventStaffParticipantId: string
  eventId: string
  staffId: string
  status: 'active' | 'removed'
  addedByUserId: string
  addedAt: Timestamp | any
  removedByUserId?: string | null
  removedAt?: Timestamp | any | null
  notes?: string | null
  departureVehicleId: string | null
  returnVehicleId: string | null
}
