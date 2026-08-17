import { useEffect, useState } from 'react'
import { createStaff, listStaff, updateStaff, type StaffInput } from '../services/staff'
import type { StaffRecord } from '../types/models'

const emptyForm: StaffInput = { firstName: '', lastName: '', email: '', roleTitle: '', dietaryRestrictions: [], active: true, canDrive: false }

function StaffFields({ form, onChange }: { form: StaffInput; onChange: <K extends keyof StaffInput>(key: K, value: StaffInput[K]) => void }) {
  return <>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">First name<input value={form.firstName} onChange={(e) => onChange('firstName', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal" /></label>
      <label className="text-sm font-medium">Last name<input value={form.lastName} onChange={(e) => onChange('lastName', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal" /></label>
      <label className="text-sm font-medium">Email<input type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal" /></label>
      <label className="text-sm font-medium">Role title<input value={form.roleTitle} onChange={(e) => onChange('roleTitle', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal" /></label>
    </div>
    <label className="mt-3 block text-sm font-medium">Dietary restrictions<input value={form.dietaryRestrictions.join(', ')} onChange={(e) => onChange('dietaryRestrictions', e.target.value.split(','))} placeholder="Comma-separated dietary restrictions" className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal" /></label>
    <div className="mt-3 flex flex-wrap gap-6"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => onChange('active', e.target.checked)} className="h-5 w-5" />Active</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.canDrive} onChange={(e) => onChange('canDrive', e.target.checked)} className="h-5 w-5" />Can drive</label></div>
  </>
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [form, setForm] = useState<StaffInput>(emptyForm)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refresh() { setStaff(await listStaff()) }
  useEffect(() => { refresh().catch(() => setError('Unable to load staff records.')).finally(() => setLoading(false)) }, [])
  function updateField<K extends keyof StaffInput>(key: K, value: StaffInput[K]) { setForm((current) => ({ ...current, [key]: value })) }
  function resetForm() { setEditingId(null); setShowCreate(false); setForm(emptyForm) }
  function startEdit(record: StaffRecord) {
    setShowCreate(false); setEditingId(record.staffId); setError(null); setMessage(null)
    setForm({ firstName: record.firstName, lastName: record.lastName, email: record.email, roleTitle: record.roleTitle, dietaryRestrictions: record.dietaryRestrictions ?? [], active: record.active, canDrive: record.canDrive })
  }
  async function save() {
    setSaving(true); setError(null); setMessage(null)
    try {
      editingId ? await updateStaff(editingId, form) : await createStaff(form)
      setMessage(editingId ? 'Staff member updated.' : 'Staff member created.')
      resetForm(); await refresh()
    } catch (reason) {
      const safe = ['First name, last name, email, and role title are required.', 'Enter a valid email address.', 'Staff member not found.']
      setError(reason instanceof Error && safe.includes(reason.message) ? reason.message : 'Unable to save the staff member. Please try again.')
    } finally { setSaving(false) }
  }
  async function toggleActive(record: StaffRecord) {
    setSaving(true); setError(null); setMessage(null)
    try {
      await updateStaff(record.staffId, { firstName: record.firstName, lastName: record.lastName, email: record.email, roleTitle: record.roleTitle, dietaryRestrictions: record.dietaryRestrictions ?? [], active: !record.active, canDrive: record.canDrive })
      await refresh(); setMessage(record.active ? 'Staff member deactivated.' : 'Staff member reactivated.')
    } catch { setError('Unable to update the staff member. Please try again.') } finally { setSaving(false) }
  }

  return <div className="space-y-6">
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">Staff</h2><p className="mt-2 text-sm text-slate-600">Manage staff master data.</p></div><button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setShowCreate(true) }} disabled={saving || showCreate} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Add Staff</button></div>
      {message ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}{error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {showCreate ? <div className="mt-5 rounded-2xl border border-slate-200 p-4"><h3 className="mb-4 font-semibold">New staff member</h3><StaffFields form={form} onChange={updateField} /><p className="mt-3 text-xs text-slate-500">Can drive records eligibility only; it does not create an event or driver assignment.</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => void save()} disabled={saving} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button><button type="button" onClick={resetForm} disabled={saving} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold">Cancel</button></div></div> : null}
    </section>
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-semibold">Staff records</h3><div className="mt-4 space-y-3">
      {loading ? <p className="text-sm text-slate-600">Loading staff…</p> : staff.length === 0 ? <p className="text-sm text-slate-600">No staff records yet.</p> : staff.map((record) => <article key={record.staffId} className="rounded-2xl border border-slate-200 p-4">
        {editingId === record.staffId ? <><StaffFields form={form} onChange={updateField} /><div className="mt-4 flex gap-2"><button type="button" onClick={() => void save()} disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button><button type="button" onClick={resetForm} disabled={saving} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button></div></> : <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{record.displayName}</p><p className="text-sm text-slate-600">{record.roleTitle} · {record.email}</p><p className="mt-1 text-xs text-slate-500">{record.active ? 'Active' : 'Inactive'} · {record.canDrive ? 'Can drive' : 'Cannot drive'}</p>{record.dietaryRestrictions?.length ? <p className="mt-1 text-xs text-amber-700">Dietary: {record.dietaryRestrictions.join(', ')}</p> : null}</div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => startEdit(record)} disabled={saving} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Edit</button><button type="button" onClick={() => void toggleActive(record)} disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{record.active ? 'Deactivate' : 'Reactivate'}</button></div></div>}
      </article>)}
    </div></section>
  </div>
}
