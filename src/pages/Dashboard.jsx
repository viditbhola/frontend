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
