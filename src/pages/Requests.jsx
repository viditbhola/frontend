import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import { money } from '../lib/format'
import { useApi } from '../components/useApi'
import { LinkList, LinksEditor, cleanLinks, linksValid } from '../components/Links'
import { Button, ErrorText, Field, Modal, StatusBadge, inputClass } from '../components/ui'

const EMPTY = { recipient_id: '', side: '', title: '', description: '', budget: '' }

// What the sender can be in a request to this person. A payee must be an owner, and a
// payer must send to an owner, so clients can only ever be the payer.
function sidesFor(profile, recipient) {
  if (!recipient) return []
  if (profile.role === 'client') return ['payer']
  return recipient.role === 'owner' ? ['payee', 'payer'] : ['payee']
}

const SIDE_LABEL = {
  payee: 'I get paid (they pay me)',
  payer: 'I pay (they get paid)',
}

export default function Requests() {
  const { profile } = useAuth()
  const proposals = useApi('/proposals')
  const people = useApi('/people')
  const [form, setForm] = useState(EMPTY)
  const [links, setLinks] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [denying, setDenying] = useState(null)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const recipient = people.data?.find((p) => p.id === form.recipient_id)
  const sides = sidesFor(profile, recipient)
  const side = sides.includes(form.side) ? form.side : sides[0] ?? ''

  async function run(action) {
    setError('')
    try {
      await action()
      setDenying(null)
      await proposals.reload()
    } catch (err) {
      setError(err.message)
    }
  }

  async function send(e) {
    e.preventDefault()
    setBusy(true)
    await run(async () => {
      await api('/proposals', { method: 'POST', body: { ...form, side, links: cleanLinks(links) } })
      setForm(EMPTY)
      setLinks([])
    })
    setBusy(false)
  }

  const post = (path) => run(() => api(path, { method: 'POST' }))

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <ErrorText>{error || proposals.error}</ErrorText>
        {proposals.loading && <p className="text-slate-500">Loading…</p>}

        <section>
          <h2 className="mb-2 font-semibold">Sent to you</h2>
          {proposals.data?.incoming.length === 0 && <p className="text-sm text-slate-500">Nothing yet.</p>}
          <ul className="space-y-3">
            {proposals.data?.incoming.map((p) => (
              <ProposalCard key={p.id} proposal={p} incoming>
                {p.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="success" onClick={() => post(`/proposals/${p.id}/accept`)}>Accept</Button>
                    <Button variant="danger" onClick={() => setDenying(p)}>Deny</Button>
                  </div>
                )}
              </ProposalCard>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">Sent by you</h2>
          {proposals.data?.outgoing.length === 0 && <p className="text-sm text-slate-500">Nothing yet.</p>}
          <ul className="space-y-3">
            {proposals.data?.outgoing.map((p) => (
              <ProposalCard key={p.id} proposal={p}>
                {p.status === 'pending' && (
                  <Button variant="ghost" onClick={() => post(`/proposals/${p.id}/cancel`)}>Cancel request</Button>
                )}
                {p.status === 'accepted' && p.project_id && (
                  <Link to={`/projects/${p.project_id}`} className="text-sm text-indigo-600 underline">Open project</Link>
                )}
              </ProposalCard>
            ))}
          </ul>
        </section>
      </div>

      <form onSubmit={send} className="space-y-3 self-start rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">New project request</h2>
        <p className="text-xs text-slate-500">
          The project is created only after the other person accepts.
        </p>
        <Field label="Send to">
          <select className={inputClass} required value={form.recipient_id} onChange={set('recipient_id')}>
            <option value="">Select…</option>
            {people.data?.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
            ))}
          </select>
        </Field>
        {sides.length > 0 && (
          <Field label="Your side">
            <select className={inputClass} value={side} onChange={set('side')} disabled={sides.length === 1}>
              {sides.map((s) => (
                <option key={s} value={s}>{SIDE_LABEL[s]}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Title">
          <input className={inputClass} required value={form.title} onChange={set('title')} />
        </Field>
        <Field label="Description / bill details">
          <textarea className={inputClass} rows={3} value={form.description} onChange={set('description')} />
        </Field>
        <Field label="Budget (₹)">
          <input className={inputClass} type="number" min="1" step="0.01" required value={form.budget} onChange={set('budget')} />
        </Field>
        <LinksEditor links={links} onChange={setLinks} />
        <Button disabled={busy || !side || !linksValid(links)}>{busy ? 'Sending…' : 'Send request'}</Button>
      </form>

      {denying && (
        <DenyModal
          onClose={() => setDenying(null)}
          onSubmit={(reason) =>
            run(() => api(`/proposals/${denying.id}/reject`, { method: 'POST', body: { reason } }))
          }
        />
      )}
    </div>
  )
}

function ProposalCard({ proposal: p, incoming, children }) {
  const payee = p.proposer_side === 'payee' ? p.proposer_name : p.recipient_name
  const payer = p.proposer_side === 'payee' ? p.recipient_name : p.proposer_name
  return (
    <li className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{p.title}</span>
        <StatusBadge status={p.status} />
        <span className="ml-auto text-sm text-slate-600">{money(p.budget)}</span>
      </div>
      <p className="text-xs text-slate-500">
        {incoming ? `From ${p.proposer_name}` : `To ${p.recipient_name}`} · {payer} pays {payee}
      </p>
      {p.description && <p className="whitespace-pre-line text-sm text-slate-600">{p.description}</p>}
      <LinkList links={p.links} />
      {p.status === 'rejected' && <p className="text-sm text-red-700">Denied: {p.reject_reason}</p>}
      {children}
    </li>
  )
}

function DenyModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  return (
    <Modal title="Deny this request" onClose={onClose}>
      <Field label="Reason (the sender will see this)">
        <textarea className={inputClass} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" disabled={!reason.trim()} onClick={() => onSubmit(reason.trim())}>Deny request</Button>
      </div>
    </Modal>
  )
}
