import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Landmark, Printer } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { formatDate, peso } from '../../lib/format'

// Fake barcode: deterministic bar widths made from the receipt number.
function Barcode({ value }) {
  const bars = []
  let seed = 7
  for (const ch of value) seed = (seed * 31 + ch.charCodeAt(0)) % 9973
  for (let i = 0; i < 70; i++) {
    seed = (seed * 48271) % 2147483647
    bars.push(1 + (seed % 3))
  }
  return (
    <div className="flex h-12 items-stretch justify-center gap-[2px]">
      {bars.map((w, i) => <span key={i} className={i % 2 ? 'bg-transparent' : 'bg-ink'} style={{ width: w * 1.5 }} />)}
    </div>
  )
}

export default function Receipt() {
  const { receiptNo } = useParams()
  const { receipts } = useData()
  const r = receipts.find((x) => x.receipt_no === receiptNo)

  if (!r) return <p className="card text-center text-xs text-muted">Receipt not found. <Link to="/cashier/redeem" className="text-brand-700">Back to Redeem / Renew</Link></p>

  const redeem = r.type === 'Full Redemption'

  return (
    <>
      <div className="no-print mx-auto mb-4 flex max-w-2xl flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-white p-2.5">
        <Link to="/cashier/redeem" className="btn-secondary"><ArrowLeft size={13} /> Back to Redeem / Renew</Link>
        <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700 uppercase">
          <CheckCircle2 size={11} /> Transaction finalized &amp; logged
        </span>
        <button onClick={() => window.print()} className="btn-primary"><Printer size={13} /> Print Receipt</button>
      </div>

      <article className="paper mx-auto max-w-2xl rounded-lg border border-line bg-white p-8 shadow-sm">
        <header className="text-center">
          <h1 className="flex items-center justify-center gap-2 text-lg font-bold"><Landmark size={18} /> PAWNSHOP MANAGEMENT SYSTEM</h1>
          <p className="text-[10px] font-semibold tracking-wider text-muted uppercase">Official Transaction Settlement Slip</p>
          <p className="text-[10px] text-muted">Branch Counter 04 • Academic Licensing Simulation</p>
        </header>

        <p className="mt-4 bg-brand-50 py-1.5 text-center text-xs font-bold tracking-wider text-brand-700">OFFICIAL RECEIPT: {r.receipt_no}</p>

        <div className="mt-3 grid grid-cols-3 gap-3 rounded bg-panel p-3 text-[11px]">
          <div><p className="section-label">Issue date</p><p className="font-semibold">{formatDate(r.date, true)}</p></div>
          <div><p className="section-label">Loan reference</p><p className="font-semibold">{r.ticket_no}</p></div>
          <div><p className="section-label">Fulfillment state</p><p className="font-semibold text-brand-700">● {r.type.toUpperCase()}</p></div>
        </div>

        <h2 className="section-label mt-4 mb-2">Customer &amp; loan ledger</h2>
        <div className="grid grid-cols-2 gap-6 text-[11px]">
          <dl className="space-y-1.5">
            <div className="flex justify-between"><dt className="text-muted">Customer Name:</dt><dd className="font-semibold">{r.customer_name}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Transaction Type:</dt><dd className="font-semibold">{r.type}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{redeem ? 'New Due Date:' : 'New Due Date:'}</dt><dd className="font-semibold">{redeem ? 'N/A (Fully Settled & Released)' : formatDate(r.new_due_date)}</dd></div>
          </dl>
          <dl className="space-y-1.5">
            <div className="flex justify-between"><dt className="text-muted">Principal Amount:</dt><dd className="font-semibold">{peso(r.principal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Accrued Interest &amp; Fees:</dt><dd className="font-semibold">{peso(r.interest + r.penalty)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Payment Method:</dt><dd className="font-semibold">Cash (Tendered {peso(r.amount_paid)})</dd></div>
          </dl>
        </div>

        <div className="mt-4 rounded bg-panel p-3 text-[11px]">
          <p className="section-label mb-1">Collateral breakdown</p>
          <div className="flex justify-between"><b>{r.item_name}</b><span className="font-semibold text-brand-700">{redeem ? 'ITEM RELEASED' : 'ITEM KEPT IN VAULT'}</span></div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded bg-brand-700 p-4 text-white">
          <div>
            <p className="text-[10px] font-semibold tracking-wider uppercase">Total settled amount</p>
            <p className="text-[10px] opacity-80">{redeem ? 'All balances cleared in full. No remaining obligations.' : 'Interest paid. Loan extended for another term.'}</p>
          </div>
          <p className="text-2xl font-bold">{peso(r.amount_paid)}</p>
        </div>

        <div className="mt-4 rounded bg-panel p-3"><Barcode value={r.receipt_no} /><p className="mt-1 text-center text-[9px] tracking-widest text-muted">{r.receipt_no.replace(/-/g, '')}-{r.ticket_no.replace(/-/g, '')}-SECURE</p></div>

        <div className="mt-10 grid grid-cols-2 gap-10 text-center text-[11px]">
          <div><p className="border-b border-ink pb-1 font-semibold italic">{r.customer_name}</p><p className="mt-1 font-semibold">Customer Acknowledgment</p><p className="text-[9px] text-muted">Received item in good condition</p></div>
          <div><p className="border-b border-ink pb-1 font-semibold italic">{r.cashier}</p><p className="mt-1 font-semibold">Authorized Cashier</p><p className="text-[9px] text-muted">Cashier in Charge</p></div>
        </div>
        <p className="mt-6 text-center text-[9px] text-muted">This document serves as proof of settlement and total discharge of pawned chattel under applicable pawnshop regulations. Retain this slip for personal audit.</p>
      </article>
    </>
  )
}
