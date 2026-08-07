export type EventStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled'

export interface EventRecord {
  id: string
  name: string
  activity: string
  eventType: string
  status: EventStatus
  startDateTime: Date
  departureDateTime?: Date | null
  returnDateTime?: Date | null
  location: string
  purpose: string
  leadStaffId?: string | null
  mealsMissed: string[]
  equipmentNeeded: string[]
  notes?: string | null
  calendarEventId?: string | null
}
