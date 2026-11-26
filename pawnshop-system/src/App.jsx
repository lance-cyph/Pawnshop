import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Users from './pages/Users'
import Dashboard from './pages/Dashboard'
import CreateStaff from './pages/CreateStaff'
import AppraiserDashboard from './pages/AppraiserDashboard'
import NewAppraisal from './pages/NewAppraisal'
import Auctions from './pages/Auctions'
import Reports from './pages/Reports'
import Customers from './pages/Customers'
import NewTicket from './pages/NewTicket'
import RedeemRenew from './pages/RedeemRenew'
import Forfeitures from './pages/Forfeitures'

function HomeRedirect() {
  const { user } = useAuth()

  if (user?.role === 'Appraiser') {
    return <Navigate to="/appraisals" replace />
  }

  return <Navigate to="/dashboard" replace />
}

function RolePage({ roles, children }) {
  const { user } = useAuth()

  if (!roles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />

          <Route
            path="/dashboard"
            element={
              <RolePage roles={['Administrator', 'Cashier']}>
                <Dashboard />
              </RolePage>
            }
          />

          <Route
            path="/create-staff"
            element={
              <RolePage roles={['Administrator']}>
                <CreateStaff />
              </RolePage>
            }
          />

          <Route
            path="/users"
            element={
              <RolePage roles={['Administrator']}>
                <Users />
              </RolePage>
            }
          />

          <Route
            path="/auctions"
            element={
              <RolePage roles={['Administrator']}>
                <Auctions />
              </RolePage>
            }
          />
          
          <Route
            path="/forfeitures"
            element={
              <RolePage roles={['Administrator']}>
                <Forfeitures />
              </RolePage>
            }
          />

          <Route
            path="/reports"
            element={
              <RolePage roles={['Administrator']}>
                <Reports />
              </RolePage>
            }
          />

          <Route
            path="/customers"
            element={
              <RolePage roles={['Cashier']}>
                <Customers />
              </RolePage>
            }
          />

          <Route
            path="/new-ticket"
            element={
              <RolePage roles={['Cashier']}>
                <NewTicket />
              </RolePage>
            }
          />

          <Route
            path="/redeem-renew"
            element={
              <RolePage roles={['Cashier']}>
                <RedeemRenew />
              </RolePage>
            }
          />

          <Route
            path="/appraisals"
            element={
              <RolePage roles={['Appraiser']}>
                <AppraiserDashboard />
              </RolePage>
            }
          />

          <Route
            path="/new-appraisal"
            element={
              <RolePage roles={['Appraiser']}>
                <NewAppraisal />
              </RolePage>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}