import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { TransportationSettingsRecord } from '../types/models'

export const DEFAULT_RETURN_DESTINATION = 'Mill Village'

export async function getTransportationSettings(): Promise<TransportationSettingsRecord> {
  const snapshot = await getDoc(doc(ensureDb(), 'settings', 'transportation'))
  if (!snapshot.exists()) return { defaultReturnDestination: DEFAULT_RETURN_DESTINATION }
  const value = String(snapshot.data().defaultReturnDestination ?? '').trim()
  return {
    defaultReturnDestination: value || DEFAULT_RETURN_DESTINATION,
    updatedAt: snapshot.data().updatedAt,
    updatedByUserId: snapshot.data().updatedByUserId,
  }
}

export async function saveTransportationSettings(defaultReturnDestination: string, userId: string): Promise<void> {
  const normalized = defaultReturnDestination.trim()
  if (!normalized) throw new Error('Default return destination is required.')
  if (normalized.length > 200) throw new Error('Default return destination must be 200 characters or fewer.')
  if (!userId) throw new Error('An approved Admin is required to update transportation settings.')
  await setDoc(doc(ensureDb(), 'settings', 'transportation'), {
    defaultReturnDestination: normalized,
    updatedAt: serverTimestamp(),
    updatedByUserId: userId,
  })
}
