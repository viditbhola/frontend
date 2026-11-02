import { Link } from 'react-router-dom'
import { money } from '../lib/format'
import { ProgressBar, StatusBadge } from './ui'

export default function ProjectTable({ projects, showClient }) {
  if (!projects.length) return <p className="text-sm text-slate-500">No projects yet.</p>
  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {projects.map((p) => (
        <li key={p.id}>
          <Link to={`/projects/${p.id}`} className="block space-y-2 p-4 hover:bg-slate-50">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{p.title}</span>
              <StatusBadge status={p.status} />
              {p.pending_changes > 0 && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">
                  payment change open
                </span>
              )}
              {p.pending_count > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  {p.pending_count} awaiting confirmation
                </span>
              )}
              {p.has_open_delete_request && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                  deletion requested
                </span>
              )}
              {p.has_open_budget_request && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">
                  budget request open
                </span>
              )}
              <span className="ml-auto text-sm text-slate-600">
                {money(p.confirmed)} / {money(p.budget)}
              </span>
            </div>
            {showClient && (
              <p className="text-xs text-slate-500">
                {p.my_side === 'payer' ? `You pay: ${p.owner_name}` : `Client: ${p.client_name}`}
              </p>
            )}
            <ProgressBar confirmed={p.confirmed} pending={p.pending} budget={p.budget} />
          </Link>
        </li>
      ))}
    </ul>
  )
}
