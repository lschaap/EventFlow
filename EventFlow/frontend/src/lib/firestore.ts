import { db } from './firebase'
import { type Firestore } from 'firebase/firestore'

export function ensureDb(): Firestore {
  if (!db) {
    throw new Error('Firestore is not configured. Set VITE_FIREBASE_* values in .env')
  }

  return db
}
