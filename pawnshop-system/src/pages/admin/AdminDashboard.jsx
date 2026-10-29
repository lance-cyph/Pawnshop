import { Link } from 'react-router-dom'
import { AlertTriangle, Archive, Bell, FileText, Gavel, UserCog } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../lib/format'

export default function AdminDashboard() {
  const { tickets, auctions, customerName } = useData()
  const { user } = useAuth()

  const open = tickets.filter((t) => t.status !== 'redeemed' && t.status !== 'auctioned')
  const needsAction = open.filter((t) => t.status === 'expired' || t.status === 'due_soon')
  const rows = [...open].sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5)

  return (
    <>
      <PageHeader eyebrow="Branch 01 / Operational overview" title="Administrator Dashboard"
        subtitle={`Welcome, ${user.name} (Role: ${user.role})`} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Requires Action (Matured/Due)" value={needsAction.length} sub="High Priority" icon={AlertTriangle} tone="red" />
        <StatCard label="Active Loan Accounts" value={open.length} sub="Total Vaulted" icon={Archive} tone="blue" />
        <StatCard label="Unclaimed Foreclosures" value={auctions.filter((a) => a.status === 'ready').length} sub="Ready for Auction" icon={Gavel} tone="red" />
      </div>

      <div className="card mt-5 bg-panel">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><Bell size={14} className="text-brand-700" /> Loans about to expire or expired</h2>
          <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-brand-700 uppercase">{needsAction.length} records pending review</span>
        </div>
        <div className="overflow-x-auto rounded bg-white">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead><tr><th className="th">Transaction number</th><th className="th">Customer</th><th className="th">Due date</th><th className="th text-right">Status</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((t) => (
                <tr key={t.ticket_no}>
                  <td className="px-3 py-3 font-semibold">{t.ticket_no}</td>
                  <td className="px-3 py-3">{customerName(t.customer_id)}</td>
                  <td className="px-3 py-3 text-muted">{formatDate(t.due_date)}</td>
                  <td className="px-3 py-3 text-right"><Badge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 flex justify-between text-[10px] text-muted"><span>Showing {rows.length} recent critical items</span><span>Default grace period: 30 days after due date</span></p>
      </div>

      <div className="card mt-5">
        <p className="section-label mb-2">Administrative shortcuts</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/auctions" className="btn-primary"><Gavel size={13} /> View Auctions</Link>
          <Link to="/admin/reports" className="btn-primary"><FileText size={13} /> View Reports</Link>
          <Link to="/admin/users" className="btn-primary"><UserCog size={13} /> Manage Users</Link>
        </div>
      </div>
    </>
  )
}
