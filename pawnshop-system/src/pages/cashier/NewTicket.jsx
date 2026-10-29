import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, Printer, Wand2, Info, RotateCcw, Calculator } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { useData } from '../../context/DataContext'
import { MONTHLY_RATE, TERM_DAYS, newLoanBreakdown, nextNumber } from '../../lib/pawn'
import { addDays, formatDate, formatDateTime, peso, pesoWhole, toISO } from '../../lib/format'

export default function NewTicket() {
  const { customers, appraisals, tickets, customerName, createTicket } = useData()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const ready = appraisals.filter((a) => a.status === 'ready')
  const activeCustomers = customers.filter((c) => c.status === 'Active')
  const initial = ready.find((a) => a.appraisal_id === params.get('appraisal'))

  const [customer_id, setCustomer] = useState('')
  const [appraisal_id, setAppraisal] = useState(initial?.appraisal_id || '')
  const [principal, setPrincipal] = useState(initial ? String(initial.appraised_value) : '')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})

  const item = ready.find((a) => a.appraisal_id === appraisal_id)
  const max = item?.appraised_value || 0
  const loanDate = toISO()
  const dueDate = addDays(loanDate, TERM_DAYS)
  const calc = newLoanBreakdown(principal)
  const ticketNo = nextNumber('PT', tickets.map((t) => t.ticket_no))

  // Clear a field's error message as soon as the cashier edits it.
  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: undefined }))

  const pickItem = (id) => {
    clearError('appraisal_id')
    clearError('principal')
    setAppraisal(id)
    const a = ready.find((x) => x.appraisal_id === id)
    setPrincipal(a ? String(a.appraised_value) : '')
  }

  const reset = () => {
    setCustomer(''); setAppraisal(''); setPrincipal(''); setNotes(''); setErrors({})
  }

  const submit = (e) => {
    e.preventDefault()
    const err = {}
    if (!customer_id) err.customer_id = 'Select a customer.'
    if (!appraisal_id) err.appraisal_id = 'Select an appraised item.'
    if (!(Number(principal) > 0)) err.principal = 'Enter the loan amount.'
    else if (Number(principal) > max) err.principal = `Cannot exceed the appraised value (${pesoWhole(max)}).`
    setErrors(err)
    if (Object.keys(err).length) return
    const t = createTicket({ customer_id, appraisal_id, principal, notes })
    navigate(`/cashier/ticket/${t.ticket_no}`)
  }

  const E = ({ f }) => errors[f] && <p className="mt-1 text-[11px] text-red-600">{errors[f]}</p>

  return (
    <>
      <PageHeader
        title="New Pawn Ticket"
        subtitle="Issue a new pawn loan voucher, calculate advance deductions, and print ticket slip."
        action={
          <span className="inline-flex items-center gap-1.5 rounded border border-line bg-white px-3 py-1.5 text-[11px] text-muted">
            <Clock size={12} className="text-brand-700" /> {formatDateTime()}
          </span>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <form onSubmit={submit} className="card" noValidate>
          <div className="mb-4 flex items-center justify-between rounded-md bg-panel px-4 py-3">
            <div>
              <p className="section-label">Reference serial</p>
              <p className="text-sm font-semibold text-brand-700">Transaction Number: {ticketNo}</p>
            </div>
            <span className="flex items-center gap-1 rounded border border-line bg-white px-2 py-1 text-[10px] text-muted">
              <Wand2 size={11} /> AUTO-GENERATED
            </span>
          </div>

          <label className="label" htmlFor="customer">Customer Name &amp; ID <span className="text-red-600">*</span></label>
          <select id="customer" className="input" value={customer_id} onChange={(e) => { clearError('customer_id'); setCustomer(e.target.value) }}>
            <option value="">-- Select registered customer --</option>
            {activeCustomers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.first_name} {c.last_name} ({c.customer_id}) - {c.contact_number}
              </option>
            ))}
          </select>
          <E f="customer_id" />

          <label className="label mt-4" htmlFor="item">Pledged Collateral Item <span className="text-red-600">*</span></label>
          <select id="item" className="input" value={appraisal_id} onChange={(e) => pickItem(e.target.value)}>
            <option value="">-- Select appraised item --</option>
            {ready.map((a) => (
              <option key={a.appraisal_id} value={a.appraisal_id}>
                {a.item_name} - Appraised {pesoWhole(a.appraised_value)}
              </option>
            ))}
          </select>
          <E f="appraisal_id" />
          {!ready.length && <p className="hint">No items are ready for a ticket. Ask the appraiser to record one first.</p>}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="principal">
                Principal Loan Amount (₱) <span className="text-red-600">*</span>
                {max > 0 && <span className="float-right font-normal text-muted">Max: {pesoWhole(max)}</span>}
              </label>
              <input id="principal" type="number" min="0" step="0.01" className="input" value={principal}
                onChange={(e) => { clearError('principal'); setPrincipal(e.target.value) }} />
              <E f="principal" />
            </div>
            <div>
              <label className="label" htmlFor="rate">Monthly Interest Rate</label>
              <input id="rate" className="input" disabled value={`${(MONTHLY_RATE * 100).toFixed(1)}% per month (Standard)`} />
            </div>
            <div>
              <label className="label" htmlFor="loan_date">Loan Grant Date</label>
              <input id="loan_date" className="input" disabled value={formatDate(loanDate, true)} />
            </div>
            <div>
              <label className="label" htmlFor="due_date">Maturity / Due Date ({TERM_DAYS} Days)</label>
              <input id="due_date" className="input" disabled value={formatDate(dueDate, true)} />
            </div>
          </div>

          <label className="label mt-4" htmlFor="notes">Condition Notes &amp; Appraisal Remarks</label>
          <textarea id="notes" rows={2} className="input resize-none" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Minor wear on clasp, hallmark stamp 750 verified; tested intact." />

          <div className="mt-5 flex gap-2">
            <button type="submit" className="btn-primary flex-1 py-2.5"><Printer size={13} /> Save and print ticket</button>
            <button type="button" onClick={reset} className="btn-secondary"><RotateCcw size={13} /> Reset form</button>
          </div>
        </form>

        {/* Live calculation */}
        <aside className="space-y-4">
          <div className="card">
            <h2 className="mb-3 flex items-center justify-between text-xs font-semibold">
              Loan Calculation <Calculator size={13} className="text-brand-700" />
            </h2>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between"><dt className="text-muted">Principal Amount</dt><dd className="font-semibold">{peso(calc.principal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Applied Interest Rate (Monthly)</dt><dd className="font-semibold">{(MONTHLY_RATE * 100).toFixed(1)}% / mo</dd></div>
            </dl>
            <div className="mt-3 rounded-md bg-panel p-3">
              <p className="section-label">Monthly interest amount</p>
              <div className="flex items-end justify-between">
                <p className="text-[10px] text-muted">Advance for 1st month</p>
                <p className="text-base font-semibold text-brand-700">{peso(calc.interest)}</p>
              </div>
            </div>
            <div className="mt-2 rounded-md bg-brand-50 p-3">
              <p className="section-label">Net cash proceeds</p>
              <div className="flex items-end justify-between">
                <p className="text-[10px] text-muted">Principal minus advance</p>
                <p className="text-xl font-bold text-brand-700">{peso(calc.netProceeds)}</p>
              </div>
            </div>
            <p className="mt-3 flex gap-1.5 rounded-md bg-panel p-2 text-[10px] text-muted">
              <Info size={11} className="mt-0.5 shrink-0" />
              First month interest is deducted at source in accordance with standard pawn regulation policies.
            </p>
          </div>

          <div className="card">
            <h2 className="mb-3 text-xs font-semibold">Ticket Print Layout</h2>
            <div className="rounded border border-line p-3 text-[10px] leading-relaxed">
              <p className="text-center font-semibold">PAWNSHOP MANAGEMENT SYSTEM</p>
              <p className="mb-2 text-center text-muted">Main Branch Counter #1</p>
              <div className="flex justify-between"><span>TICKET: <b>{ticketNo}</b></span><span>{formatDate(loanDate)}</span></div>
              <p>Pawnor: <b>{customer_id ? customerName(customer_id) : '—'}</b></p>
              <p>Article: <b>{item?.item_name || '—'}</b></p>
              <p>Maturity: <b>{formatDate(dueDate)}</b></p>
              <p>Cash Given: <b className="text-brand-700">{peso(calc.netProceeds)}</b></p>
              <p className="mt-1 text-center text-muted">*** OFFICIAL PAWN RECEIPT ***</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
