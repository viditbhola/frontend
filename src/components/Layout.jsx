import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from './ui'

const link = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`

export default function Layout() {
  const { profile, signOut } = useAuth()
  const isOwner = profile.role === 'owner'
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <span className="mr-4 font-semibold">Payment Tracker</span>
          <nav className="flex gap-1">
            <NavLink to="/" end className={link}>
              {isOwner ? 'Dashboard' : 'My projects'}
            </NavLink>
            {isOwner && (
              <>
                <NavLink to="/projects" className={link}>Projects</NavLink>
                <NavLink to="/clients" className={link}>Clients</NavLink>
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm text-slate-600">
            <span>{profile.full_name} · {profile.role}</span>
            <Button variant="ghost" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
