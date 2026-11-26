import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function NavIcon({ name }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  switch (name) {
    case 'Forfeitures':
      return (
        <svg {...props}>
          <path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    case 'Dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="2.5" />
          <rect x="14" y="3" width="7" height="7" rx="2.5" />
          <rect x="14" y="14" width="7" height="7" rx="2.5" />
          <rect x="3" y="14" width="7" height="7" rx="2.5" />
        </svg>
      )
    case 'Auctions':
      return (
        <svg {...props}>
          <path d="m14.5 12.5-8 8a2.11 2.11 0 1 1-3-3l8-8" />
          <path d="m16 16 6-6" />
          <path d="m8 8 6-6" />
          <path d="m9 7 8 8" />
          <path d="m21 11-8-8" />
        </svg>
      )
    case 'Reports':
      return (
        <svg {...props}>
          <path d="M3 3v18h18" />
          <rect x="7" y="11" width="3" height="6" rx="1.5" />
          <rect x="12" y="7" width="3" height="10" rx="1.5" />
          <rect x="17" y="4" width="3" height="13" rx="1.5" />
        </svg>
      )
    case 'Users':
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'Create Staff Account':
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      )
    case 'Customers':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      )
    case 'New Ticket':
      return (
        <svg {...props}>
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M12 9v6" />
          <path d="M9 12h6" />
        </svg>
      )
    case 'Redeem / Renew':
      return (
        <svg {...props}>
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 16h5v5" />
        </svg>
      )
    case 'Appraisals':
    default:
      return (
        <svg {...props}>
          <path d="M6 3h12l4 6-10 13L2 9Z" />
          <path d="M11 3 8 9l4 13 4-13-3-6" />
          <path d="M2 9h20" />
        </svg>
      )
  }
}

const navigation = {
  Administrator: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Auctions', path: '/auctions' },
    { label: 'Forfeitures', path: '/forfeitures' },
    { label: 'Reports', path: '/reports' },
    { label: 'Users', path: '/users' },
    { label: 'Create Staff Account', path: '/create-staff' },
  ],

  Cashier: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Customers', path: '/customers' },
    { label: 'New Ticket', path: '/new-ticket' },
    { label: 'Redeem / Renew', path: '/redeem-renew' },
  ],

  Appraiser: [
    { label: 'Appraisals', path: '/appraisals' },
  ],
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const links = navigation[user?.role] || []
  const displayName = user?.full_name || user?.username || 'Staff'
  const initials = displayName.slice(0, 2).toUpperCase()

  async function handleLogout() {
    const result = await logout()

    if (!result.error) {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-badge">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3h12l4 6-10 13L2 9Z" />
              <path d="M2 9h20" />
            </svg>
          </div>
          <div>
            <h2>Pawnshop</h2>
            <p>Management System</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                isActive ? 'sidebar-link active' : 'sidebar-link'
              }
            >
              <span className="sidebar-link-icon">
                <NavIcon name={link.label} />
              </span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <strong>{displayName}</strong>
              <span>{user?.role}</span>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span>Welcome, {displayName}</span>
          <span className="topbar-pill">{user?.role} Portal</span>
        </header>

        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  )
}