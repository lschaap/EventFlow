import type { Timestamp } from 'firebase/firestore'

export type EventStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled'
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

export interface EventDriverRecord {
  eventDriverId: string
  eventId: string
  staffId: string
  vehicleId: string | null
  status: 'assigned' | 'removed'
  assignedByUserId: string
  assignedAt: Timestamp | any
  removedByUserId?: string | null
  removedAt?: Timestamp | any | null
  notes?: string | null
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
}
