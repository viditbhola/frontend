import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import Layout from './components/Layout'
import ChangePassword from './pages/ChangePassword'
import Clients from './pages/Clients'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ProjectDetail from './pages/ProjectDetail'
import Projects from './pages/Projects'

export default function App() {
  const { session, profile, loading, waking } = useAuth()

  if (loading) {
    return (
      <p className="p-8 text-center text-slate-500">
        {waking ? 'Waking up the server, this can take a minute…' : 'Loading…'}
      </p>
    )
  }
  if (!session || !profile) return <Login />
  if (profile.must_change_password) return <ChangePassword />

  const isOwner = profile.role === 'owner'
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        {isOwner && <Route path="projects" element={<Projects />} />}
        {isOwner && <Route path="clients" element={<Clients />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
