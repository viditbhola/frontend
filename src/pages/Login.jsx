import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Button, ErrorText, Field, inputClass } from '../components/ui'

export default function Login() {
  const { signIn, waking } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <Field label="Email">
          <input className={inputClass} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <input className={inputClass} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        {waking && <p className="text-sm text-slate-500">Waking up the server, this can take a minute…</p>}
        <Button className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        <p className="text-xs text-slate-500">Accounts are created by your project owner.</p>
      </form>
    </div>
  )
}
