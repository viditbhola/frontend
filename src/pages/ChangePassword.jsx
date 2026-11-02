import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { Button, ErrorText, Field, inputClass } from '../components/ui'

export default function ChangePassword() {
  const { refreshProfile, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      await api('/me/password-changed', { method: 'POST' })
      await refreshProfile()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <p className="text-sm text-slate-600">Your owner gave you a temporary password. Choose your own to continue.</p>
        <Field label="New password (min 8 characters)">
          <input className={inputClass} type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button className="w-full" disabled={busy}>Save password</Button>
        <Button type="button" variant="ghost" className="w-full" onClick={signOut}>Sign out</Button>
      </form>
    </div>
  )
}
