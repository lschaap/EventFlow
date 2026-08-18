import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'
import { ensureDb } from '../lib/firestore'
import type { VehicleRecord } from '../types/models'

export type VehicleInput = Pick<VehicleRecord, 'name' | 'capacity' | 'active'>

function normalize(values: VehicleInput): VehicleInput {
  const name = values.name.trim()
  const capacity = Number(values.capacity)
  if (!name) throw new Error('Vehicle name is required.')
  if (!Number.isInteger(capacity) || capacity <= 0) throw new Error('Capacity must be a positive whole number.')
  return { name, capacity, active: values.active }
}

export async function listVehicles(): Promise<VehicleRecord[]> {
  const snapshot = await getDocs(query(collection(ensureDb(), 'vehicles'), orderBy('name', 'asc')))
  return snapshot.docs.map((item) => ({ vehicleId: item.id, ...(item.data() as Omit<VehicleRecord, 'vehicleId'>) }))
}

export async function createVehicle(values: VehicleInput): Promise<string> {
  const ref = doc(collection(ensureDb(), 'vehicles')); const now = serverTimestamp()
  await setDoc(ref, { vehicleId: ref.id, ...normalize(values), createdAt: now, updatedAt: now }); return ref.id
}

export async function updateVehicle(vehicleId: string, values: VehicleInput): Promise<void> {
  const ref = doc(ensureDb(), 'vehicles', vehicleId)
  if (!(await getDoc(ref)).exists()) throw new Error('Vehicle not found.')
  await updateDoc(ref, { ...normalize(values), updatedAt: serverTimestamp() })
}

export interface FutureVehicleAssignment { eventId: string; eventName: string }

export async function listFutureVehicleAssignments(vehicleId: string): Promise<FutureVehicleAssignment[]> {
  const db = ensureDb(); const snapshot = await getDocs(query(collection(db, 'eventDrivers'), where('vehicleId', '==', vehicleId)))
  const results = new Map<string, string>(); const now = new Date()
  for (const assignment of snapshot.docs.filter((item) => item.data().status === 'assigned')) {
    const eventId = String(assignment.data().eventId); const eventSnapshot = await getDoc(doc(db, 'events', eventId))
    if (eventSnapshot.exists() && eventSnapshot.data().departureDateTime.toDate() > now) results.set(eventId, String(eventSnapshot.data().name ?? eventId))
  }
  return [...results].map(([eventId, eventName]) => ({ eventId, eventName }))
}

export async function deactivateVehicleAndClearFutureAssignments(vehicleId: string): Promise<void> {
  const db = ensureDb(); const vehicleRef = doc(db, 'vehicles', vehicleId); const vehicle = await getDoc(vehicleRef)
  if (!vehicle.exists()) throw new Error('Vehicle not found.')
  const drivers = await getDocs(query(collection(db, 'eventDrivers'), where('vehicleId', '==', vehicleId))); const batch = writeBatch(db); const now = new Date()
  batch.update(vehicleRef, { active: false, updatedAt: serverTimestamp() })
  for (const assignment of drivers.docs.filter((item) => item.data().status === 'assigned')) {
    const eventSnapshot = await getDoc(doc(db, 'events', String(assignment.data().eventId)))
    if (eventSnapshot.exists() && eventSnapshot.data().departureDateTime.toDate() > now) batch.update(assignment.ref, { vehicleId: null })
  }
  await batch.commit()
}
