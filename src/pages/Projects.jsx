import { useState } from 'react'
import { api } from '../lib/api'
import ProjectTable from '../components/ProjectTable'
import { useApi } from '../components/useApi'
import { Button, ErrorText, Field, inputClass } from '../components/ui'
import { LinksEditor, cleanLinks, linksValid } from '../components/Links'

const EMPTY = { client_id: '', title: '', description: '', budget: '' }

export default function Projects() {
  const projects = useApi('/projects')
  const people = useApi('/people')
  const [form, setForm] = useState(EMPTY)
  const [links, setLinks] = useState([])
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setFormError('')
    setNotice('')
    try {
      // Every project starts as a request; it exists only once the other side accepts.
      const target = people.data?.find((c) => c.id === form.client_id)
      await api('/proposals', {
        method: 'POST',
        body: { ...form, recipient_id: form.client_id, side: 'payee', links: cleanLinks(links) },
      })
      setNotice(`Request sent to ${target?.full_name ?? 'them'}. The project starts when they accept (see Requests).`)
      setForm(EMPTY)
      setLinks([])
      await projects.reload()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <section>
        <h2 className="mb-2 font-semibold">Projects</h2>
        {projects.loading && <p className="text-slate-500">Loading…</p>}
        <ErrorText>{projects.error}</ErrorText>
        {projects.data && <ProjectTable projects={projects.data} showClient />}
      </section>

      <form onSubmit={submit} className="space-y-3 self-start rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Request a new project</h2>
        <Field label="Send to (they pay you)">
          <select className={inputClass} required value={form.client_id} onChange={set('client_id')}>
            <option value="">Select a client…</option>
            {people.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}{c.role === 'owner' ? ' (owner)' : ''}</option>
            ))}
          </select>
        </Field>
        <Field label="Title">
          <input className={inputClass} required value={form.title} onChange={set('title')} />
        </Field>
        <Field label="Description">
          <textarea className={inputClass} rows={2} value={form.description} onChange={set('description')} />
        </Field>
        <Field label="Agreed budget (₹)">
          <input className={inputClass} type="number" min="1" step="0.01" required value={form.budget} onChange={set('budget')} />
        </Field>
        <LinksEditor links={links} onChange={setLinks} />
        <ErrorText>{formError}</ErrorText>
        {notice && <p className="text-sm text-emerald-700">{notice}</p>}
        <Button disabled={busy || !linksValid(links)}>{busy ? 'Sending…' : 'Send request'}</Button>
      </form>
    </div>
  )
}
