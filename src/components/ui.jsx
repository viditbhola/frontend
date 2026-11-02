import { useEffect } from 'react'

const BADGE_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-200 text-slate-700',
  approved: 'bg-emerald-100 text-emerald-800',
  deleted: 'bg-slate-200 text-slate-700',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
}

export const StatusBadge = ({ status }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${BADGE_STYLES[status] ?? ''}`}>
    {status}
  </span>
)

export function ProgressBar({ confirmed, pending = 0, budget }) {
  const pct = (value) => Math.min(100, (Number(value) / Number(budget)) * 100)
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar">
      <div className="flex h-full">
        <div className="bg-emerald-500" style={{ width: `${pct(confirmed)}%` }} />
        <div className="bg-amber-400" style={{ width: `${pct(pending)}%` }} />
      </div>
    </div>
  )
}

export const Card = ({ title, value, hint, tone = 'text-slate-900' }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-sm text-slate-500">{title}</p>
    <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
)

export const Button = ({ variant = 'primary', className = '', ...props }) => {
  const styles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  }
  return (
    <button
      className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export const Field = ({ label, children }) => (
  <label className="block text-sm">
    <span className="mb-1 block font-medium text-slate-700">{label}</span>
    {children}
  </label>
)

export const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export const ErrorText = ({ children }) =>
  children ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{children}</p> : null
