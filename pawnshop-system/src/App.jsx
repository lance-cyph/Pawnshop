import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import RequireRole from './components/layout/RequireRole'
import Placeholder from './components/ui/Placeholder'
import Login from './pages/Login'
import Appraisals from './pages/appraiser/Appraisals'
import CashierDashboard from './pages/cashier/CashierDashboard'
import Customers from './pages/cashier/Customers'
import NewTicket from './pages/cashier/NewTicket'
import RedeemRenew from './pages/cashier/RedeemRenew'
import Receipt from './pages/cashier/Receipt'
import PawnTicketPrint from './pages/cashier/PawnTicketPrint'
import AdminDashboard from './pages/admin/AdminDashboard'
import Auctions from './pages/admin/Auctions'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Everything below needs a login; each group is limited to its role. */}
      <Route element={<RequireRole />}>
        <Route element={<AppShell />}>
          <Route element={<RequireRole roles={['Appraiser']} />}>
            <Route path="/appraiser/appraisals" element={<Appraisals />} />
          </Route>

          {/* The appraiser's "Generate Ticket" button leads here, so they can open these two pages too. */}
          <Route element={<RequireRole roles={['Cashier', 'Appraiser']} />}>
            <Route path="/cashier/new-ticket" element={<NewTicket />} />
            <Route path="/cashier/ticket/:ticketNo" element={<PawnTicketPrint />} />
          </Route>

          <Route element={<RequireRole roles={['Cashier']} />}>
            <Route path="/cashier" element={<CashierDashboard />} />
            <Route path="/cashier/customers" element={<Customers />} />
            <Route path="/cashier/redeem" element={<RedeemRenew />} />
            <Route path="/cashier/receipt/:receiptNo" element={<Receipt />} />
          </Route>

          <Route element={<RequireRole roles={['Administrator']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/auctions" element={<Auctions />} />
            <Route path="/admin/reports" element={<Placeholder title="Reports" subtitle="Export PDF and Excel reports" />} />
            <Route path="/admin/users" element={<Placeholder title="Users" subtitle="Manage staff accounts" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={user ? user.home : '/login'} replace />} />
    </Routes>
  )
}
