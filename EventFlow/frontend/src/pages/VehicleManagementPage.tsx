import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_RETURN_DESTINATION, getTransportationSettings, saveTransportationSettings } from '../services/transportationSettings'
import { createVehicle, deactivateVehicleAndClearFutureAssignments, listFutureVehicleAssignments, listVehicles, updateVehicle, type VehicleInput } from '../services/vehicles'
import type { VehicleRecord } from '../types/models'

const empty: VehicleInput = { name: '', capacity: 1, active: true }

export default function VehicleManagementPage() {
  const { firebaseUser } = useAuth()
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
  const [form, setForm] = useState<VehicleInput>(empty)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [defaultReturnDestination, setDefaultReturnDestination] = useState(DEFAULT_RETURN_DESTINATION)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)

  const refresh = async () => setVehicles(await listVehicles())

  useEffect(() => {
    Promise.all([
      refresh(),
      getTransportationSettings().then((settings) => setDefaultReturnDestination(settings.defaultReturnDestination)),
    ]).catch(() => setMessage('Unable to load vehicle configuration.')).finally(() => setLoading(false))
  }, [])

  const reset = () => { setShowCreate(false); setEditingId(null); setForm(empty) }
  const save = async () => {
    setSaving(true); setMessage(null)
    try {
      editingId ? await updateVehicle(editingId, form) : await createVehicle(form)
      setMessage(editingId ? 'Vehicle updated.' : 'Vehicle created.')
      reset(); await refresh()
    } catch (error) {
      setMessage(error instanceof Error && ['Vehicle name is required.', 'Capacity must be a positive whole number.'].includes(error.message) ? error.message : 'Unable to save vehicle.')
    } finally { setSaving(false) }
  }
  const toggle = async (item: VehicleRecord) => {
    setSaving(true); setMessage(null)
    try {
      if (item.active) {
        const affected = await listFutureVehicleAssignments(item.vehicleId)
        if (affected.length && !window.confirm(`Deactivating ${item.name} will unassign it from:\n\n${affected.map((event) => `• ${event.eventName}`).join('\n')}\n\nContinue?`)) return
        await deactivateVehicleAndClearFutureAssignments(item.vehicleId)
        setMessage('Vehicle deactivated and cleared from future events.')
      } else {
        await updateVehicle(item.vehicleId, { name: item.name, capacity: item.capacity, active: true })
        setMessage('Vehicle reactivated.')
      }
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? `Unable to update vehicle: ${error.message}` : 'Unable to update vehicle.')
    } finally { setSaving(false) }
  }
  const saveSettings = async () => {
    setSettingsSaving(true); setSettingsMessage(null)
    try {
      await saveTransportationSettings(defaultReturnDestination, firebaseUser?.uid ?? '')
      setDefaultReturnDestination(defaultReturnDestination.trim())
      setSettingsMessage('Transportation settings saved.')
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : 'Unable to save transportation settings.')
    } finally { setSettingsSaving(false) }
  }

  const fields = <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-sm font-medium">Vehicle name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3" /></label>
    <label className="text-sm font-medium">Capacity (total seats including driver)<input type="number" min="1" step="1" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} className="mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3" /></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />Active</label>
  </div>

  return <div className="space-y-6">
    <section className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Transportation settings</h2>
      <p className="mt-1 text-sm text-slate-600">Used as the default return destination for transportation operations.</p>
      <label className="mt-4 block text-sm font-medium">Default return destination<input value={defaultReturnDestination} maxLength={200} onChange={(event) => setDefaultReturnDestination(event.target.value)} className="mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3" /></label>
      <button onClick={() => void saveSettings()} disabled={settingsSaving || !defaultReturnDestination.trim()} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{settingsSaving ? 'Saving…' : 'Save settings'}</button>
      {settingsMessage ? <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm">{settingsMessage}</p> : null}
    </section>

    <section className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between"><div><h2 className="text-xl font-semibold">Vehicles</h2><p className="text-sm text-slate-600">Manage vehicles available for events.</p></div><button onClick={() => { setEditingId(null); setForm(empty); setShowCreate(true) }} disabled={saving || showCreate} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Add Vehicle</button></div>
      {message ? <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm">{message}</p> : null}
      {showCreate ? <div className="mt-5 rounded-2xl border p-4">{fields}<div className="mt-4 flex gap-2"><button onClick={() => void save()} disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2 text-white">Save</button><button onClick={reset} className="rounded-xl border px-4 py-2">Cancel</button></div></div> : null}
    </section>

    <section className="rounded-3xl border bg-white p-6 shadow-sm"><h3 className="font-semibold">Vehicle records</h3><div className="mt-4 space-y-3">{loading ? <p>Loading vehicles…</p> : vehicles.length === 0 ? <p>No vehicles yet.</p> : vehicles.map((item) => <article key={item.vehicleId} className="rounded-2xl border p-4">{editingId === item.vehicleId ? <>{fields}<div className="mt-4 flex gap-2"><button onClick={() => void save()} className="rounded-xl bg-slate-900 px-4 py-2 text-white">Save</button><button onClick={reset} className="rounded-xl border px-4 py-2">Cancel</button></div></> : <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{item.name}</p><p className="text-sm text-slate-600">Capacity {item.capacity} · {item.active ? 'Active' : 'Inactive'}</p></div><div className="flex gap-2"><button onClick={() => { setShowCreate(false); setEditingId(item.vehicleId); setForm({ name: item.name, capacity: item.capacity, active: item.active }) }} className="rounded-xl border px-4 py-2">Edit</button><button disabled={saving} onClick={() => void toggle(item)} className="rounded-xl bg-slate-900 px-4 py-2 text-white">{item.active ? 'Deactivate' : 'Reactivate'}</button></div></div>}</article>)}</div></section>
  </div>
}
