import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'


function peso(value) {
  return '₱' + Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + Number(days || 30))
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function RedeemRenew() {
 

  const [tickets, setTickets] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeTicket, setActiveTicket] = useState(null)
  const [actionType, setActionType] = useState('Redemption')
  const [penaltyAmount, setPenaltyAmount] = useState('0')
  const [generatedReceipt, setGeneratedReceipt] = useState(null)

  useEffect(() => {
    loadActiveTickets()
  }, [])

  async function loadActiveTickets() {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('pawn_tickets')
      .select(`
        ticket_id,
        transaction_number,
        loan_amount,
        monthly_interest_rate,
        loan_date,
        due_date,
        grace_period_end_date,
        ticket_status,
        customers (
          first_name,
          last_name,
          contact_number
        ),
        pawned_items (
          item_id,
          description,
          item_status,
          item_categories (
            item_type,
            default_grace_period_days
          )
        )
      `)
      .in('ticket_status', ['Active', 'Renewed'])
      .order('due_date', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setTickets(data || [])
    }

    setLoading(false)
  }

  function openTransactionModal(ticket, type) {
    setActiveTicket(ticket)
    setActionType(type)
    setPenaltyAmount('0')
    setError('')
    setSuccess('')
  }

  const principal = Number(activeTicket?.loan_amount || 0)
  const rate = Number(activeTicket?.monthly_interest_rate || 0)
  const interestDue = Number(
    (principal * (rate / 100)).toFixed(2)
  )
  const penaltyDue = Number(penaltyAmount || 0)

  const totalDue =
    actionType === 'Redemption'
      ? principal + interestDue + penaltyDue
      : interestDue + penaltyDue

  const graceDays = Number(
    activeTicket?.pawned_items?.item_categories?.default_grace_period_days || 30
  )
  const extendedDueDate = activeTicket
    ? addDays(activeTicket.due_date, 30)
    : ''
  const extendedGraceDate = extendedDueDate
    ? addDays(extendedDueDate, graceDays)
    : ''

  
async function handleConfirmTransaction(e) {
    e.preventDefault()
    if (!activeTicket) return

    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      const randomDigits = String(
        Math.floor(1000 + Math.random() * 9000)
      )

      const receiptNumber = `OR-${new Date().getFullYear()}-${randomDigits}`

      const { data: receiptData, error: transactionError } =
        await supabase.rpc('process_pawn_transaction', {
          p_receipt_number: receiptNumber,
          p_ticket_id: activeTicket.ticket_id,
          p_transaction_type: actionType,
          p_penalty_paid: Number(penaltyAmount),
        })

      if (transactionError) {
        throw new Error(transactionError.message)
      }

      setGeneratedReceipt({
        ...receiptData,
        ticket: activeTicket,
      })

      setSuccess(
        `${actionType} completed. Official Receipt ${receiptNumber} generated.`
      )

      setActiveTicket(null)
      await loadActiveTickets()

    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }


  const filteredTickets = tickets.filter((t) => {
    const q = search.toLowerCase()
    const customerName =
      `${t.customers?.first_name || ''} ${t.customers?.last_name || ''}`.toLowerCase()
    return (
      (t.transaction_number || '').toLowerCase().includes(q) ||
      customerName.includes(q) ||
      (t.pawned_items?.description || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="users-page">
      <div className="users-heading">
        <div>
          <h1>Redeem / Renew</h1>
          <p>
            Process loan redemptions and pawn renewals with automatic interest
            recalculation.
          </p>
        </div>

        <button
          type="button"
          className="users-refresh"
          onClick={loadActiveTickets}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="users-error">{error}</div>}
      {success && <div className="users-success">{success}</div>}

      {generatedReceipt && (
        <div className="staff-form-card" style={{ marginBottom: 28 }}>
          <div className="dashboard-section-heading">
            <div>
              <h2>Official Receipt — {generatedReceipt.receipt_number}</h2>
              <span>{generatedReceipt.transaction_type} Receipt</span>
            </div>
            <button
              type="button"
              className="reports-print-button"
              onClick={() => window.print()}
            >
              Print Receipt
            </button>
          </div>

          <div className="staff-form-field">
            <p>
              <strong>Pawn Ticket:</strong>{' '}
              {generatedReceipt.ticket?.transaction_number}
            </p>
            <p>
              <strong>Customer:</strong>{' '}
              {generatedReceipt.ticket?.customers?.first_name}{' '}
              {generatedReceipt.ticket?.customers?.last_name}
            </p>
            <p>
              <strong>Principal Paid:</strong>{' '}
              {peso(generatedReceipt.principal_paid)}
            </p>
            <p>
              <strong>Interest Paid:</strong>{' '}
              {peso(generatedReceipt.interest_paid)}
            </p>
            <p>
              <strong>Penalty Paid:</strong>{' '}
              {peso(generatedReceipt.penalty_paid)}
            </p>
            <p>
              <strong>Total Amount Paid:</strong>{' '}
              {peso(generatedReceipt.amount_paid)}
            </p>
            {generatedReceipt.new_due_date && (
              <p>
                <strong>New Extended Due Date:</strong>{' '}
                {generatedReceipt.new_due_date}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="users-table-card">
        <div className="users-table-heading">
          <h2>Active Pawn Tickets</h2>
          <input
            type="text"
            placeholder="Search ticket no. or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="users-message">Loading active pawn tickets...</p>
        ) : filteredTickets.length === 0 ? (
          <p className="users-message">No active pawn tickets found.</p>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Ticket No.</th>
                  <th>Customer</th>
                  <th>Pawned Item</th>
                  <th>Principal</th>
                  <th>Monthly Rate</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.ticket_id}>
                    <td>
                      <strong>{ticket.transaction_number}</strong>
                    </td>
                    <td>
                      {ticket.customers?.first_name}{' '}
                      {ticket.customers?.last_name}
                    </td>
                    <td>{ticket.pawned_items?.description}</td>
                    <td>{peso(ticket.loan_amount)}</td>
                    <td>{ticket.monthly_interest_rate}%</td>
                    <td>{ticket.due_date}</td>
                    <td>
                      <span className="users-status active">
                        {ticket.ticket_status}
                      </span>
                    </td>
                    <td>
                      <div className="users-actions">
                        <button
                          type="button"
                          className="users-save-button"
                          onClick={() =>
                            openTransactionModal(ticket, 'Redemption')
                          }
                        >
                          Redeem
                        </button>
                        <button
                          type="button"
                          className="users-edit-button"
                          onClick={() =>
                            openTransactionModal(ticket, 'Renewal')
                          }
                        >
                          Renew
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeTicket && (
        <div className="users-modal-overlay">
          <div className="users-modal">
            <h2>Process {actionType}</h2>
            <p>
              Ticket: <strong>{activeTicket.transaction_number}</strong> —{' '}
              {activeTicket.customers?.first_name}{' '}
              {activeTicket.customers?.last_name}
            </p>

            <form onSubmit={handleConfirmTransaction}>
              <label>Principal Loan Amount</label>
              <input type="text" disabled value={peso(principal)} />

              <label>Monthly Interest ({rate}%)</label>
              <input type="text" disabled value={peso(interestDue)} />

              <label>Penalty Amount (if overdue)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
              />

              <label>Total Amount Due</label>
              <input type="text" disabled value={peso(totalDue)} />

              {actionType === 'Renewal' && (
                <p style={{ marginTop: 12, fontSize: 13 }}>
                  <strong>New Extended Due Date:</strong> {extendedDueDate}
                </p>
              )}

              <div className="users-modal-actions">
                <button
                  type="button"
                  className="users-cancel-button"
                  onClick={() => setActiveTicket(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="users-save-button"
                  disabled={processing}
                >
                  {processing ? 'Processing...' : `Confirm ${actionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}