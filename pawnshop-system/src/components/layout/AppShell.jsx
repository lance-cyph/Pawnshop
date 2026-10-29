import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Landmark, LogOut, Menu, User, X } from 'lucide-react'
import { NAV, isActive } from '../../lib/navigation'
import { useAuth } from '../../context/AuthContext'

export default function AppShell() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const nav = NAV[user.role]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="no-print flex h-12 shrink-0 items-center justify-between border-b border-line bg-white px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="-ml-1 rounded p-1 text-muted hover:bg-panel lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <Landmark size={16} className="text-brand-700" />
          <span className="text-sm font-semibold">Pawnshop Management System</span>
          <span className="hidden rounded bg-brand-50 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-brand-700 uppercase sm:inline">
            {nav.chip}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded border border-line bg-panel px-2 py-1 text-[10px] text-muted sm:inline">
            Logged in as: <b className="font-semibold text-ink">{user.role}</b>
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-white">
            <User size={14} />
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {open && (
          <div className="no-print fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`no-print fixed inset-y-0 left-0 z-40 flex w-52 shrink-0 flex-col border-r border-line bg-white p-3
            transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="mb-2 flex items-center justify-between px-2 pt-1">
            <p className="section-label">{nav.section}</p>
            <button onClick={() => setOpen(false)} className="rounded p-1 text-muted hover:bg-panel lg:hidden" aria-label="Close menu">
              <X size={16} />
            </button>
          </div>
          <nav className="flex-1 space-y-1">
            {nav.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item, pathname)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    active ? 'bg-brand-700 text-white' : 'text-ink hover:bg-panel'
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 border-t border-line px-3 pt-3 text-xs font-medium text-red-600 hover:text-red-700"
          >
            <LogOut size={14} /> Log out
          </button>
        </aside>

        <main className="app-main min-w-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
