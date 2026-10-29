import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { newLoanBreakdown, MONTHLY_RATE, TERM_DAYS, GRACE_DAYS } from '../../lib/pawn'
import { addDays, formatDate, peso } from '../../lib/format'

export default function PawnTicketPrint() {
  const { ticketNo } = useParams()
  const { tickets, customers } = useData()
  const { user } = useAuth()
  const t = tickets.find((x) => x.ticket_no === ticketNo)

  if (!t) return <p className="card text-center text-xs text-muted">Ticket not found. <Link to="/cashier/new-ticket" className="text-brand-700">Back to New Ticket</Link></p>

  const c = customers.find((x) => x.customer_id === t.customer_id)
  const name = c ? `${c.first_name} ${c.last_name}` : 'Unknown'
  const calc = newLoanBreakdown(t.principal)

  return (
    <>
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between gap-2 rounded-lg border border-line bg-white p-2.5">
        <Link to="/cashier/new-ticket" className="btn-secondary"><ArrowLeft size={13} /> Back to New Ticket</Link>
        <button onClick={() => window.print()} className="btn-primary"><Printer size={13} /> Print Ticket</button>
      </div>

      <article className="paper mx-auto max-w-3xl rounded-lg border border-line bg-white p-8 text-[11px] shadow-sm">
        <header className="text-center">
          <p className="text-[9px] font-semibold tracking-wider text-muted uppercase">Registered Pawnshop • Academic Prototype</p>
          <h1 className="text-xl font-bold">PAWNSHOP MANAGEMENT SYSTEM</h1>
          <p className="text-xs font-semibold tracking-wide">OFFICIAL PAWN TICKET (PAPEL DE VENTA / AGRAVIO)</p>
          <p className="text-[9px] text-muted">Main Branch</p>
        </header>

        <div className="mt-5 flex justify-between bg-panel p-3">
          <div><p className="section-label">Pawn ticket number</p><p className="text-sm font-bold text-brand-700">{t.ticket_no}</p></div>
          <div className="text-right"><p className="section-label">Date issued</p><p className="text-sm font-semibold">{formatDate(t.loan_date, true)}</p></div>
        </div>

        <h2 className="section-label mt-4 mb-1">Customer &amp; pledgor profile</h2>
        <div className="flex justify-between">
          <div><p className="text-muted">Pledgor / Customer Full Name</p><p className="text-sm font-bold">{name}</p><p className="text-[10px] text-muted">ID: {t.customer_id}</p></div>
          <div className="text-right"><p className="text-muted">Contact &amp; Address</p><p className="font-semibold">{c?.contact_number}</p><p className="max-w-56 text-[10px] text-muted">{c?.address}</p></div>
        </div>

        <h2 className="section-label mt-4 mb-1">Pawned article description</h2>
        <div className="flex items-start justify-between border-y border-line py-2">
          <div><p className="text-sm font-bold">{t.item_name}</p>{t.notes && <p className="text-[10px] text-muted">{t.notes}</p>}</div>
          <div className="text-right"><p className="text-muted">Appraised value</p><p className="text-sm font-bold">{peso(t.appraised_value)}</p></div>
        </div>

        <h2 className="section-label mt-4 mb-1">Loan terms &amp; liquidation breakdown</h2>
        <div className="space-y-1.5 bg-brand-50 p-3">
          <div className="flex justify-between"><span className="text-brand-700">Loan Amount (Principal Extended)</span><b>{peso(t.principal)}</b></div>
          <div className="flex justify-between"><span className="text-brand-700">Monthly Interest Rate ({(MONTHLY_RATE * 100).toFixed(1)}%)</span><b>{peso(calc.interest)} / month</b></div>
          <div className="flex justify-between"><span className="text-brand-700">Advance Interest Deducted (1st Month)</span><b>- {peso(calc.interest)}</b></div>
          <div className="flex items-center justify-between border-t border-brand-200 pt-2"><span className="font-bold text-brand-700">NET CASH RECEIVED BY PLEDGOR</span><b className="text-base text-brand-700">{peso(calc.netProceeds)}</b></div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="p-2"><p className="section-label">Due date / maturity date</p><p className="text-sm font-bold">{formatDate(t.due_date, true)}</p><p className="text-[9px] text-muted">Standard {TERM_DAYS}-day maturity period</p></div>
          <div className="bg-red-50 p-2"><p className="text-[10px] font-semibold tracking-wider text-red-700 uppercase">Expiry of grace period (final auction date)</p><p className="text-sm font-bold text-red-700">{formatDate(addDays(t.due_date, GRACE_DAYS), true)}</p><p className="text-[9px] text-red-700/80">Unredeemed items will be slated for public auction.</p></div>
        </div>

        <p className="mt-4 bg-panel p-3 text-[9px] leading-relaxed text-muted">
          <b className="text-ink">AGREEMENT &amp; NOTICE:</b> The pledgor agrees that this pawn ticket must be presented upon renewal or redemption. Failure to redeem the pawned article within the grace period after maturity shall be considered foreclosed and may be sold in public auction. Loss of this ticket must be reported immediately.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-10 text-center">
          <div><p className="border-b border-ink pb-1 font-semibold italic">{name}</p><p className="mt-1 font-semibold">{name}</p><p className="text-[9px] text-muted">Signature of Pledgor / Customer</p></div>
          <div><p className="border-b border-ink pb-1 font-semibold italic">{user?.name}</p><p className="mt-1 font-semibold">{user?.name}</p><p className="text-[9px] text-muted">Authorized Cashier / Appraiser</p></div>
        </div>
        <p className="mt-6 flex justify-between text-[8px] text-muted"><span>SECURITY VERIFICATION HASH: {t.ticket_no.replace(/-/g, '')}</span><span>COPY 1: CUSTOMER ORIGINAL • DO NOT LOSE THIS TICKET</span></p>
      </article>
    </>
  )
}
