import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Landmark, LogIn, Info } from 'lucide-react'
import { MOCK_USERS, useAuth } from '../context/AuthContext'

const ROLE_HELP = [
  { key: 'appraiser', label: 'Appraiser', text: 'Assess item condition, catalog valuations, and compute loan ceilings.' },
  { key: 'cashier', label: 'Cashier', text: 'Process ticket redemptions, loan renewals, disbursements, and payments.' },
  { key: 'admin', label: 'Administrator', text: 'Manage rates, vault inventory audits, reports, and staff accounts.' },
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) return <Navigate to={user.home} replace />

  const submit = (e) => {
    e.preventDefault()
    const found = login(username, password)
    if (!found) return setError('Invalid username or password.')
    navigate(found.home)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-6">
        <div className="mb-5 text-center">
          <Landmark className="mx-auto mb-2 text-brand-700" size={20} />
          <h1 className="text-lg font-semibold">Pawnshop Management System</h1>
          <p className="text-[11px] text-muted">Student Project • Staff Login</p>
        </div>

        <label className="label" htmlFor="username">Username <span className="text-red-600">*</span></label>
        <input id="username" className="input mb-3" placeholder="Enter username" value={username}
          onChange={(e) => setUsername(e.target.value)} autoFocus />

        <label className="label" htmlFor="password">Password <span className="text-red-600">*</span></label>
        <input id="password" type="password" className="input mb-4" placeholder="Enter password" value={password}
          onChange={(e) => setPassword(e.target.value)} />

        {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full py-2.5"><LogIn size={14} /> Log in</button>

        <div className="mt-5 rounded-md bg-brand-50 p-3">
          <p className="mb-2 flex items-center gap-1 text-[11px] font-semibold"><Info size={12} /> Testing Roles &amp; Credentials</p>
          <p className="mb-2 text-[10px] text-muted">Click a role to fill in the username, then type any password.</p>
          <ul className="space-y-1.5">
            {ROLE_HELP.map((r) => (
              <li key={r.key} className="flex gap-2 text-[10px] text-muted">
                <button type="button" onClick={() => setUsername(MOCK_USERS[r.key].username)}
                  className="h-fit shrink-0 rounded bg-white px-1.5 py-0.5 font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100">
                  {r.label}
                </button>
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-center text-[10px] text-muted">Academic Prototype Environment • Offline Mode</p>
      </form>
    </div>
  )
}
