import { doc, getDoc } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { AppUser } from '../types/models'

export async function getAppUser(userId: string): Promise<AppUser | null> {
  const db = ensureDb()
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    return null
  }

  return {
    userId: userSnap.id,
    ...userSnap.data(),
  } as AppUser
}
