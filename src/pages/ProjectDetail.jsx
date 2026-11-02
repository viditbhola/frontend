import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import { dateLabel, money } from '../lib/format'
import { useApi } from '../components/useApi'
import { Button, Card, ErrorText, Field, Modal, ProgressBar, StatusBadge, inputClass } from '../components/ui'

const today = () => new Date().toISOString().slice(0, 10)

export default function ProjectDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const { data, error, loading, reload } = useApi(`/projects/${id}`)
  const [actionError, setActionError] = useState('')
  const [modal, setModal] = useState(null) // { type: 'reject', payment } | { type: 'budget' }

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (error) return <ErrorText>{error}</ErrorText>

  const { project, payments, budget_requests: requests, payment_changes: changes } = data
  const isOwner = profile.role === 'owner'
  const completed = project.status === 'completed'
  const openRequest = requests.find((r) => r.status === 'pending')
  const openChangeFor = (paymentId) =>
    changes.find((c) => c.payment_id === paymentId && c.status === 'pending')
  const otherParty = isOwner ? 'the client' : 'the owner'
  const post = (path) => run(() => api(path, { method: 'POST' }))

  async function run(action) {
    setActionError('')
    try {
      await action()
      setModal(null)
      await reload()
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function viewProof(paymentId) {
    try {
      const { url } = await api(`/payments/${paymentId}/proof`)
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      setActionError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <Link to={isOwner ? '/projects' : '/'} className="text-sm text-indigo-600">← Back</Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{project.title}</h1>
          <StatusBadge status={project.status} />
        </div>
        <p className="text-sm text-slate-600">
          {isOwner ? `Client: ${project.client_name}` : 'Your project'}
          {project.description && ` · ${project.description}`}
        </p>
        <ProgressBar confirmed={project.confirmed} pending={project.pending} budget={project.budget} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card title="Budget" value={money(project.budget)} />
        <Card title="Confirmed paid" value={money(project.confirmed)} tone="text-emerald-700" />
        <Card title="Awaiting confirmation" value={money(project.pending)} tone="text-amber-700" />
        <Card title="Left to pay" value={money(project.remaining_to_pay)} />
      </div>

      <ErrorText>{actionError}</ErrorText>

      {completed && (
        <div className="rounded-xl bg-emerald-50 p-4 text-emerald-800">
          Fully paid and completed on {dateLabel(project.completed_at)}. No further changes can be made.
        </div>
      )}

      {openRequest && (
        <div className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="font-medium">
            Budget increase requested: {money(openRequest.old_budget)} → {money(openRequest.new_budget)}
          </p>
          {openRequest.note && <p className="text-sm text-slate-600">{openRequest.note}</p>}
          {isOwner ? (
            <p className="text-sm text-slate-600">Waiting for the client to accept or deny.</p>
          ) : (
            <div className="flex gap-2">
              <Button variant="success" onClick={() => run(() => api(`/budget-requests/${openRequest.id}/accept`, { method: 'POST' }))}>
                Accept
              </Button>
              <Button variant="danger" onClick={() => run(() => api(`/budget-requests/${openRequest.id}/reject`, { method: 'POST' }))}>
                Deny
              </Button>
            </div>
          )}
        </div>
      )}

      {!completed && isOwner && !openRequest && (
        <Button variant="ghost" onClick={() => setModal({ type: 'budget' })}>Request budget increase</Button>
      )}

      {!completed && !isOwner && <LogPaymentForm project={project} onDone={reload} />}

      <section>
        <h2 className="mb-2 font-semibold">Payments</h2>
        {payments.length === 0 && <p className="text-sm text-slate-500">No payments logged yet.</p>}
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {payments.map((p) => {
            const change = openChangeFor(p.id)
            return (
            <li key={p.id} className="space-y-1 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-medium ${p.status === 'deleted' ? 'text-slate-400 line-through' : ''}`}>
                  {money(p.amount)}
                </span>
                <StatusBadge status={p.status} />
                <span className="text-sm text-slate-500">
                  paid {dateLabel(p.paid_on)}{p.method && ` via ${p.method}`}{p.reference && ` · ref ${p.reference}`}
                </span>
                {p.proof_path && (
                  <button className="text-sm text-indigo-600 underline" onClick={() => viewProof(p.id)}>View proof</button>
                )}
              </div>
              {p.note && <p className="text-sm text-slate-600">{p.note}</p>}
              {p.status === 'rejected' && <p className="text-sm text-red-700">Denied: {p.reject_reason}</p>}
              {isOwner && p.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <Button variant="success" onClick={() => run(() => api(`/payments/${p.id}/confirm`, { method: 'POST' }))}>
                    Confirm received
                  </Button>
                  <Button variant="danger" onClick={() => setModal({ type: 'reject', payment: p })}>Deny</Button>
                </div>
              )}

              {!isOwner && p.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" onClick={() => setModal({ type: 'edit-pending', payment: p })}>Edit</Button>
                  <Button
                    variant="ghost"
                    onClick={() => window.confirm('Delete this pending payment?') && run(() => api(`/payments/${p.id}`, { method: 'DELETE' }))}
                  >
                    Delete
                  </Button>
                </div>
              )}

              {p.status === 'confirmed' && !change && (
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" onClick={() => setModal({ type: 'change-edit', payment: p })}>Request edit</Button>
                  <Button variant="ghost" onClick={() => setModal({ type: 'change-delete', payment: p })}>Request delete</Button>
                </div>
              )}

              {change && (
                <ChangeBanner
                  change={change}
                  mine={change.requested_by === profile.id}
                  otherParty={otherParty}
                  onApprove={() => post(`/payment-changes/${change.id}/approve`)}
                  onReject={() => post(`/payment-changes/${change.id}/reject`)}
                  onCancel={() => post(`/payment-changes/${change.id}/cancel`)}
                />
              )}
            </li>
            )
          })}
        </ul>
      </section>

      {changes.some((c) => c.status !== 'pending') && (
        <section>
          <h2 className="mb-2 font-semibold">Payment change history</h2>
          <ul className="space-y-1 text-sm text-slate-600">
            {changes.filter((c) => c.status !== 'pending').map((c) => (
              <li key={c.id}>
                {c.kind === 'delete'
                  ? `Delete ${money(c.previous.amount)}`
                  : `Edit ${money(c.previous.amount)} → ${money(c.proposed.amount)}`}{' '}
                <StatusBadge status={c.status} /> <span className="text-slate-500">“{c.reason}”</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {requests.some((r) => r.status !== 'pending') && (
        <section>
          <h2 className="mb-2 font-semibold">Budget history</h2>
          <ul className="space-y-1 text-sm text-slate-600">
            {requests.filter((r) => r.status !== 'pending').map((r) => (
              <li key={r.id}>
                {money(r.old_budget)} → {money(r.new_budget)} <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {modal?.type === 'reject' && (
        <RejectModal onClose={() => setModal(null)} onSubmit={(reason) => run(() => api(`/payments/${modal.payment.id}/reject`, { method: 'POST', body: { reason } }))} />
      )}
      {modal?.type === 'edit-pending' && (
        <PaymentFormModal
          title="Edit payment"
          payment={modal.payment}
          max={Number(project.loggable) + Number(modal.payment.amount)}
          submitLabel="Save"
          onClose={() => setModal(null)}
          onSubmit={(form) => run(() => api(`/payments/${modal.payment.id}`, { method: 'PATCH', body: form }))}
        />
      )}
      {modal?.type === 'change-edit' && (
        <PaymentFormModal
          title="Request an edit"
          note={`This changes a confirmed payment, so ${otherParty} must approve it.`}
          payment={modal.payment}
          max={Number(project.budget) - Number(project.confirmed) - Number(project.pending) + Number(modal.payment.amount)}
          withReason
          submitLabel="Send request"
          onClose={() => setModal(null)}
          onSubmit={({ reason, ...fields }) =>
            run(() => api(`/payments/${modal.payment.id}/changes`, { method: 'POST', body: { kind: 'edit', reason, ...fields } }))
          }
        />
      )}
      {modal?.type === 'change-delete' && (
        <ReasonModal
          title={`Request to delete ${money(modal.payment.amount)}`}
          note={`This removes a confirmed payment, so ${otherParty} must approve it.`}
          submitLabel="Send request"
          onClose={() => setModal(null)}
          onSubmit={(reason) =>
            run(() => api(`/payments/${modal.payment.id}/changes`, { method: 'POST', body: { kind: 'delete', reason } }))
          }
        />
      )}
      {modal?.type === 'budget' && (
        <BudgetModal
          current={project.budget}
          onClose={() => setModal(null)}
          onSubmit={(body) => run(() => api(`/projects/${project.id}/budget-requests`, { method: 'POST', body }))}
        />
      )}
    </div>
  )
}

function LogPaymentForm({ project, onDone }) {
  const empty = { amount: '', paid_on: today(), method: '', reference: '', note: '' }
  const [form, setForm] = useState(empty)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  if (Number(project.loggable) <= 0) {
    return (
      <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
        Payments are not open: everything is already logged. If the owner increases the budget and you accept, you can log more.
      </p>
    )
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payment = await api(`/projects/${project.id}/payments`, { method: 'POST', body: form })
      if (file) {
        const upload = new FormData()
        upload.append('file', file)
        await api(`/payments/${payment.id}/proof`, { method: 'POST', form: upload })
      }
      setForm(empty)
      setFile(null)
      e.target.reset()
      await onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">Log a payment</h2>
      <p className="text-xs text-slate-500">You can log up to {money(project.loggable)}. It counts only after the owner confirms it.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Amount (₹)">
          <input className={inputClass} type="number" min="1" step="0.01" max={project.loggable} required value={form.amount} onChange={set('amount')} />
        </Field>
        <Field label="Date paid">
          <input className={inputClass} type="date" required max={today()} value={form.paid_on} onChange={set('paid_on')} />
        </Field>
        <Field label="Method (UPI, bank…)">
          <input className={inputClass} value={form.method} onChange={set('method')} />
        </Field>
        <Field label="Reference / UTR">
          <input className={inputClass} value={form.reference} onChange={set('reference')} />
        </Field>
      </div>
      <Field label="Note">
        <input className={inputClass} value={form.note} onChange={set('note')} />
      </Field>
      <Field label="Proof (optional, image or PDF up to 5 MB)">
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files[0] ?? null)} />
      </Field>
      <ErrorText>{error}</ErrorText>
      <Button disabled={busy}>{busy ? 'Logging…' : 'Log payment'}</Button>
    </form>
  )
}

function RejectModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  return (
    <Modal title="Deny this payment" onClose={onClose}>
      <Field label="Reason (the client will see this)">
        <textarea className={inputClass} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" disabled={!reason.trim()} onClick={() => onSubmit(reason.trim())}>Deny payment</Button>
      </div>
    </Modal>
  )
}

function BudgetModal({ current, onClose, onSubmit }) {
  const [newBudget, setNewBudget] = useState('')
  const [note, setNote] = useState('')
  const invalid = !(Number(newBudget) > Number(current))
  return (
    <Modal title="Request budget increase" onClose={onClose}>
      <div className="space-y-3">
        <Field label={`New budget (current ${money(current)})`}>
          <input className={inputClass} type="number" step="0.01" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} />
        </Field>
        <Field label="Note for the client">
          <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button disabled={invalid} onClick={() => onSubmit({ new_budget: newBudget, note })}>Send request</Button>
      </div>
    </Modal>
  )
}

function ChangeBanner({ change, mine, otherParty, onApprove, onReject, onCancel }) {
  const prev = change.previous
  const next = change.proposed
  return (
    <div className="mt-2 space-y-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm">
      <p className="font-medium">
        {mine ? 'You requested' : `${otherParty === 'the client' ? 'The client' : 'The owner'} requested`}{' '}
        {change.kind === 'delete'
          ? 'to delete this payment'
          : `to change it: ${money(prev.amount)} → ${money(next.amount)}, paid ${dateLabel(next.paid_on)}`}
      </p>
      <p className="text-slate-600">Reason: {change.reason}</p>
      {mine ? (
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Waiting for {otherParty} to approve.</span>
          <Button variant="ghost" onClick={onCancel}>Cancel request</Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="success" onClick={onApprove}>Approve</Button>
          <Button variant="danger" onClick={onReject}>Reject</Button>
        </div>
      )}
    </div>
  )
}

function PaymentFormModal({ title, note, payment, max, withReason, submitLabel, onClose, onSubmit }) {
  const [form, setForm] = useState({
    amount: payment.amount,
    paid_on: payment.paid_on,
    method: payment.method,
    reference: payment.reference,
    note: payment.note,
    reason: '',
  })
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const { reason, ...fields } = form
  const invalid = !(Number(form.amount) > 0) || !form.paid_on || (withReason && !reason.trim())
  return (
    <Modal title={title} onClose={onClose}>
      {note && <p className="mb-3 text-sm text-slate-600">{note}</p>}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹)">
            <input className={inputClass} type="number" min="1" step="0.01" max={max} value={form.amount} onChange={set('amount')} />
          </Field>
          <Field label="Date paid">
            <input className={inputClass} type="date" max={today()} value={form.paid_on} onChange={set('paid_on')} />
          </Field>
          <Field label="Method">
            <input className={inputClass} value={form.method} onChange={set('method')} />
          </Field>
          <Field label="Reference">
            <input className={inputClass} value={form.reference} onChange={set('reference')} />
          </Field>
        </div>
        <Field label="Note">
          <input className={inputClass} value={form.note} onChange={set('note')} />
        </Field>
        {withReason && (
          <Field label="Reason for the change">
            <input className={inputClass} value={form.reason} onChange={set('reason')} />
          </Field>
        )}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button disabled={invalid} onClick={() => onSubmit(withReason ? { ...fields, reason: reason.trim() } : fields)}>
          {submitLabel}
        </Button>
      </div>
    </Modal>
  )
}

function ReasonModal({ title, note, submitLabel, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  return (
    <Modal title={title} onClose={onClose}>
      {note && <p className="mb-3 text-sm text-slate-600">{note}</p>}
      <Field label="Reason">
        <textarea className={inputClass} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" disabled={!reason.trim()} onClick={() => onSubmit(reason.trim())}>{submitLabel}</Button>
      </div>
    </Modal>
  )
}
