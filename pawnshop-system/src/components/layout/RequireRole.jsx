import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/** Route guard: not logged in -> /login. Wrong role -> that role's home page. */
export default function RequireRole({ roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={user.home} replace />
  return <Outlet />
}
