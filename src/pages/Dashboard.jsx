import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import ProjectTable from '../components/ProjectTable'
import { useApi } from '../components/useApi'
import { Card, ErrorText } from '../components/ui'
import { money } from '../lib/format'

export default function Dashboard() {
  const { profile } = useAuth()
  const { data, error, loading } = useApi('/dashboard')
  const isOwner = profile.role === 'owner'

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (error) return <ErrorText>{error}</ErrorText>

  const needsAction = data.projects.filter((p) => p.pending_count > 0 || p.pending_changes > 0)
  // Active projects that still owe money, biggest balance first (owners only; `projects` is the payee side).
  const owed = isOwner
    ? data.projects
        .filter((p) => p.status === 'active')
        .map((p) => ({ ...p, due: Number(p.budget) - Number(p.confirmed) }))
        .filter((p) => p.due > 0)
        .sort((a, b) => b.due - a.due)
    : []
  const totalDue = owed.reduce((sum, p) => sum + p.due, 0)
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          title={isOwner ? 'Total earned' : 'Total paid (confirmed)'}
          value={money(data.total_received)}
          tone="text-emerald-700"
        />
        <Card
          title={isOwner ? 'Pending from clients' : 'Still to pay'}
          value={money(data.total_pending_to_receive)}
          tone="text-amber-700"
          hint={`of ${money(data.total_budget)} total budget`}
        />
        <Card
          title="Awaiting confirmation"
          value={money(data.awaiting_confirmation_amount)}
          hint={`${data.awaiting_confirmation_count} payment(s) · ${data.active_projects} active, ${data.completed_projects} completed projects`}
        />
      </div>

      {isOwner && needsAction.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Needs your action</h2>
          <ProjectTable projects={needsAction} showClient />
        </section>
      )}

      {isOwner && (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-semibold">Need to be paid</h2>
            <span className="text-sm font-semibold text-amber-700">{money(totalDue)} due</span>
          </div>
          {owed.length === 0 ? (
            <p className="text-sm text-slate-500">Nobody owes you anything right now.</p>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {owed.map((p) => (
                <li key={p.id}>
                  <Link to={`/projects/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 hover:bg-slate-50">
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-slate-500">
                        Client: {p.client_name} · {money(p.confirmed)} of {money(p.budget)} received
                      </p>
                    </div>
                    <span className="ml-auto font-semibold text-amber-700">{money(p.due)}</span>
                    <span className="text-sm text-indigo-600">Record payment →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {isOwner && data.clients.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">By client</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3">Client</th>
                  <th className="p-3">Budget</th>
                  <th className="p-3">Received</th>
                  <th className="p-3">Pending</th>
                </tr>
              </thead>
              <tbody>
                {data.clients.map((c) => (
                  <tr key={c.client_id} className="border-t border-slate-100">
                    <td className="p-3">{c.client_name}</td>
                    <td className="p-3">{money(c.budget)}</td>
                    <td className="p-3 text-emerald-700">{money(c.received)}</td>
                    <td className="p-3 text-amber-700">{money(c.pending_to_receive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold">{isOwner ? 'Projects you are paid for' : 'Your projects'}</h2>
        <ProjectTable projects={data.projects} showClient={isOwner} />
      </section>

      {data.paying.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Projects you pay for</h2>
          <ProjectTable projects={data.paying} showClient />
        </section>
      )}
    </div>
  )
}
