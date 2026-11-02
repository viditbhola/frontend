import { useState } from 'react'
import { api } from '../lib/api'
import { useApi } from '../components/useApi'
import { Button, ErrorText, Field, inputClass } from '../components/ui'
import { dateLabel } from '../lib/format'

export default function Clients() {
  const { data: clients, loading, error, reload } = useApi('/clients')
  const [form, setForm] = useState({ full_name: '', email: '', temp_password: '' })
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      await api('/clients', { method: 'POST', body: form })
      setForm({ full_name: '', email: '', temp_password: '' })
      await reload()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section>
        <h2 className="mb-2 font-semibold">Clients</h2>
        {loading && <p className="text-slate-500">Loading…</p>}
        <ErrorText>{error}</ErrorText>
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {clients?.map((c) => (
            <li key={c.id} className="p-3 text-sm">
              <p className="font-medium">{c.full_name}</p>
              <p className="text-slate-500">
                {c.email} · added {dateLabel(c.created_at)}
                {c.must_change_password && ' · has not logged in yet'}
              </p>
            </li>
          ))}
          {clients?.length === 0 && <li className="p-3 text-sm text-slate-500">No clients yet.</li>}
        </ul>
      </section>

      <form onSubmit={submit} className="space-y-3 self-start rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Add a client</h2>
        <Field label="Full name">
          <input className={inputClass} required value={form.full_name} onChange={set('full_name')} />
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" required value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Temporary password (min 8 characters)">
          <input className={inputClass} type="text" minLength={8} required value={form.temp_password} onChange={set('temp_password')} />
        </Field>
        <p className="text-xs text-slate-500">Share these details with the client; they will be asked to choose their own password on first login.</p>
        <ErrorText>{formError}</ErrorText>
        <Button disabled={busy}>{busy ? 'Creating…' : 'Create client'}</Button>
      </form>
    </div>
  )
}
