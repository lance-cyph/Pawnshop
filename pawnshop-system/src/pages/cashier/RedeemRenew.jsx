import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, Calculator, FileSearch, RefreshCw, ShieldCheck, Ticket, PackageCheck } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import { useData } from '../../context/DataContext'
import { settlementBreakdown, MONTHLY_RATE, GRACE_DAYS } from '../../lib/pawn'
import { addDays, formatDate, peso, toISO } from '../../lib/format'

export default function RedeemRenew() {
  const { tickets, customerName, settleTicket } = useData()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [input, setInput] = useState(params.get('ticket') || '')
  const [searched, setSearched] = useState(params.get('ticket') || '')

  const ticket = tickets.find((t) => t.ticket_no.toLowerCase() === searched.trim().toLowerCase())
  const closed = ticket && (ticket.status === 'redeemed' || ticket.status === 'auctioned')
  const b = ticket ? settlementBreakdown(ticket) : null

  const search = (e) => { e.preventDefault(); setSearched(input) }
  const act = (type) => {
    const r = settleTicket(ticket.ticket_no, type)
    navigate(`/cashier/receipt/${r.receipt_no}`)
  }

  return (
    <>
      <PageHeader
        eyebrow="Transaction processing"
        title="Redeem / Renew Pawn Ticket"
        action={
          <span className="inline-flex items-center gap-1.5 rounded border border-line bg-white px-3 py-1.5 text-[11px] text-muted">
            <CalendarDays size={12} className="text-brand-700" /> Terminal Date: <b className="text-ink">{formatDate(toISO(), true)}</b>
          </span>
        }
      />

      <form onSubmit={search} className="card flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label className="label" htmlFor="ticket_no">Search Transaction Number:</label>
          <input id="ticket_no" className="input bg-white" placeholder="e.g. PT-2024-00142" value={input}
            onChange={(e) => setInput(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary"><FileSearch size={13} /> Search Ticket</button>
      </form>

      {searched && !ticket && (
        <p className="card mt-4 text-center text-xs text-red-600">No pawn ticket found for &ldquo;{searched}&rdquo;. Check the number and try again.</p>
      )}

      {ticket && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="card">
            <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
              <h2 className="flex items-center gap-2 text-xs font-semibold"><Ticket size={13} className="text-brand-700" /> Ticket Details</h2>
              <span className="text-xs font-semibold text-brand-700">{ticket.ticket_no}</span>
            </div>
            <div className="space-y-2">
              <div className="rounded-md bg-panel p-3">
                <p className="section-label">Customer</p>
                <div className="flex justify-between text-xs"><b className="text-sm">{customerName(ticket.customer_id)}</b><span className="text-muted">{ticket.customer_id}</span></div>
              </div>
              <div className="rounded-md bg-panel p-3">
                <p className="section-label">Pawned item</p>
                <p className="text-xs font-semibold">{ticket.item_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-panel p-3"><p className="section-label">Loan amount</p><p className="text-sm font-semibold text-brand-700">{peso(ticket.principal)}</p></div>
                <div className="rounded-md bg-panel p-3"><p className="section-label">Status</p><div className="mt-1"><Badge status={ticket.status} /></div></div>
                <div className="rounded-md bg-panel p-3"><p className="section-label">Date granted</p><p className="text-xs font-semibold">{formatDate(ticket.loan_date, true)}</p></div>
                <div className="rounded-md bg-panel p-3"><p className="section-label">Due date</p><p className="text-xs font-semibold">{formatDate(ticket.due_date, true)}</p></div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 flex items-center gap-2 border-b border-line pb-2 text-xs font-semibold">
              <Calculator size={13} className="text-brand-700" /> Amount Due Calculation
            </h2>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between"><dt className="text-muted">Principal</dt><dd className="font-semibold">{peso(ticket.principal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Interest (1 Month @ {(MONTHLY_RATE * 100).toFixed(1)}%)</dt><dd className="font-semibold">{peso(b.interest)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Penalty / Late Fee</dt><dd className="font-semibold">{peso(b.penalty)}</dd></div>
            </dl>
            <div className="mt-3 rounded-md bg-brand-50 p-3">
              <p className="section-label">Option 1: Full payment</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px]">Total Amount Due for Redemption:</span>
                <b className="text-lg text-brand-700">{peso(b.redeemTotal)}</b>
              </div>
            </div>
            <div className="mt-2 rounded-md bg-brand-50 p-3">
              <p className="section-label">Option 2: Extend loan</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px]">Total Amount Due for Renewal (interest only):</span>
                <b className="text-base text-brand-700">{peso(b.renewTotal)}</b>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-muted italic">
              * Grace period remains valid until {formatDate(addDays(ticket.due_date, GRACE_DAYS), true)} before foreclosure procedures begin.
            </p>
          </div>

          <div className="card flex flex-wrap items-center justify-between gap-3 lg:col-span-2">
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              <ShieldCheck size={13} /> Verify customer identification and collect cash/POS before clicking any action.
            </p>
            <div className="flex gap-2">
              <button className="btn-primary px-6" disabled={closed} onClick={() => act('renew')}><RefreshCw size={13} /> Renew</button>
              <button className="btn-primary px-6" disabled={closed} onClick={() => act('redeem')}><PackageCheck size={13} /> Redeem</button>
            </div>
          </div>
          {closed && <p className="text-center text-xs text-muted lg:col-span-2">This ticket is already {ticket.status}; no further action is possible.</p>}
        </div>
      )}
    </>
  )
}
