import { Link, useNavigate } from 'react-router-dom'
import { CalendarX2, CalendarClock, CheckCircle2, AlertTriangle, Users, FilePlus2, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../lib/format'

export default function CashierDashboard() {
  const { tickets, customerName } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()

  const open = tickets.filter((t) => t.status !== 'redeemed' && t.status !== 'auctioned')
  const count = (s) => open.filter((t) => t.status === s).length
  const rows = [...open].sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5)

  return (
    <>
      <PageHeader title="Cashier Dashboard" subtitle={`Welcome, ${user.name} (Role: ${user.role})`} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard eyebrow="Action required" value={`${count('expired')} Expired`} icon={CalendarX2} tone="red" />
        <StatCard eyebrow="Urgent attention" value={`${count('due_soon')} Due Soon`} icon={CalendarClock} tone="amber" />
        <StatCard eyebrow="In good standing" value={`${count('active')} Active`} icon={CheckCircle2} tone="blue" />
      </div>

      <div className="card mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle size={14} className="text-brand-700" /> Loans about to expire or expired
          </h2>
          <span className="text-[10px] text-muted">{open.length} total records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-panel">
              <tr><th className="th">Transaction number</th><th className="th">Customer</th><th className="th">Due date</th><th className="th">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((t) => (
                <tr key={t.ticket_no}>
                  <td className="px-3 py-3 font-semibold text-brand-700">
                    <Link to={`/cashier/redeem?ticket=${t.ticket_no}`} className="hover:underline">{t.ticket_no}</Link>
                  </td>
                  <td className="px-3 py-3 font-medium">{customerName(t.customer_id)}</td>
                  <td className="px-3 py-3 text-muted">{formatDate(t.due_date)}</td>
                  <td className="px-3 py-3"><Badge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button className="btn-primary py-3" onClick={() => navigate('/cashier/customers')}><Users size={14} /> Go to Customers</button>
        <button className="btn-primary py-3" onClick={() => navigate('/cashier/new-ticket')}><FilePlus2 size={14} /> Create New Pawn Ticket</button>
        <button className="btn-primary py-3" onClick={() => navigate('/cashier/redeem')}><RefreshCw size={14} /> Redeem or Renew Ticket</button>
      </div>
    </>
  )
}
