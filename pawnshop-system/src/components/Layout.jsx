
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navigation = {
  Administrator: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Auctions', path: '/auctions' },
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
          <h2>Pawnshop</h2>
          <p>Management System</p>
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
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user?.full_name || user?.username}</strong>
            <span>{user?.role}</span>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span>Welcome, {user?.full_name || user?.username}</span>
        </header>

        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  )
}
