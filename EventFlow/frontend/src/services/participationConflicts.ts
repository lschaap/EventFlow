import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'

type ParticipationCollection = 'eventParticipants' | 'eventStaffParticipants'
type PersonField = 'studentId' | 'staffId'

export async function assertNoParticipationOverlap(
  eventId: string,
  personId: string,
  collectionName: ParticipationCollection,
  personField: PersonField,
): Promise<void> {
  const db = ensureDb()
  const target = await getDoc(doc(db, 'events', eventId))
  if (!target.exists()) throw new Error('Event does not exist.')

  const targetStart = target.data().departureDateTime.toDate()
  const targetEnd = target.data().returnDateTime.toDate()
  const assignments = await getDocs(
    query(collection(db, collectionName), where(personField, '==', personId)),
  )

  for (const assignment of assignments.docs) {
    const data = assignment.data()
    if (data.status !== 'active' || data.eventId === eventId) continue
    const other = await getDoc(doc(db, 'events', String(data.eventId)))
    if (!other.exists()) continue
    const overlaps =
      targetStart < other.data().returnDateTime.toDate() &&
      targetEnd > other.data().departureDateTime.toDate()
    if (overlaps) {
      throw new Error(
        `This person is already participating in ${String(other.data().name ?? data.eventId)} during this time.`,
      )
    }
  }
}
