import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

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

function getToday() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function NewTicket() {
  const { user } = useAuth()

  const [customers, setCustomers] = useState([])
  const [availableItems, setAvailableItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [loanAmount, setLoanAmount] = useState('')
  const [loanDate, setLoanDate] = useState(getToday())

  const [generatedTicket, setGeneratedTicket] = useState(null)

  useEffect(() => {
    loadFormData()
  }, [])

  async function loadFormData() {
    setLoading(true)
    setError('')

    try {
      const [customerRes, itemRes, ticketRes] = await Promise.all([
        supabase
          .from('customers')
          .select('customer_id, first_name, last_name, contact_number, address')
          .eq('is_active', true)
          .order('last_name', { ascending: true }),

        supabase
          .from('pawned_items')
          .select(`
            item_id,
            description,
            appraised_value,
            item_status,
            item_categories (
              item_type,
              standard_monthly_rate,
              default_grace_period_days
            )
          `)
          .eq('item_status', 'Pledged')
          .order('created_at', { ascending: false }),

        supabase.from('pawn_tickets').select('item_id'),
      ])

      if (customerRes.error) throw new Error(customerRes.error.message)
      if (itemRes.error) throw new Error(itemRes.error.message)
      if (ticketRes.error) throw new Error(ticketRes.error.message)

      const usedItemIds = new Set(
        (ticketRes.data || []).map((ticket) => ticket.item_id)
      )
      const unlinkedItems = (itemRes.data || []).filter(
        (item) => !usedItemIds.has(item.item_id)
      )

      setCustomers(customerRes.data || [])
      setAvailableItems(unlinkedItems)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedItem = availableItems.find(
    (item) => item.item_id === selectedItemId
  )
  const selectedCustomer = customers.find(
    (c) => c.customer_id === selectedCustomerId
  )

  const monthlyRate = Number(
    selectedItem?.item_categories?.standard_monthly_rate || 0
  )
  const graceDays = Number(
    selectedItem?.item_categories?.default_grace_period_days || 30
  )

  const numericLoan = Number(loanAmount || 0)
  const monthlyInterest = numericLoan * (monthlyRate / 100)
  const totalRedemptionDue = numericLoan + monthlyInterest
  const dueDate = addDays(loanDate, 30)
  const gracePeriodEndDate = addDays(dueDate, graceDays)

  async function handleCreateTicket(e) {
    e.preventDefault()
    setError('')

    if (!selectedCustomerId || !selectedItemId) {
      setError('Please select both a registered customer and an appraised item.')
      return
    }

    if (numericLoan <= 0) {
      setError('Loan amount must be greater than zero.')
      return
    }

    if (selectedItem && numericLoan > Number(selectedItem.appraised_value)) {
      setError('Loan amount cannot exceed the appraised value of the item.')
      return
    }

    setSubmitting(true)

    try {
      const year = new Date().getFullYear()
      const randomDigits = String(Math.floor(1000 + Math.random() * 9000))
      const transactionNumber = `PT-${year}-${randomDigits}`

      const { data: ticketData, error: ticketError } = await supabase
        .from('pawn_tickets')
        .insert({
          transaction_number: transactionNumber,
          customer_id: selectedCustomerId,
          item_id: selectedItemId,
          cashier_id: user.user_id,
          loan_amount: numericLoan,
          monthly_interest_rate: monthlyRate,
          loan_date: loanDate,
          due_date: dueDate,
          grace_period_end_date: gracePeriodEndDate,
          ticket_status: 'Active',
        })
        .select()
        .single()

      if (ticketError) throw new Error(ticketError.message)

      // Record cash outflow for loan release
      await supabase.from('cash_flow_ledger').insert({
        recorded_by_user_id: user.user_id,
        ticket_id: ticketData.ticket_id,
        flow_type: 'Outflow',
        category: 'Loan Release',
        amount: numericLoan,
        description: `Loan release for ${transactionNumber}`,
      })

      setGeneratedTicket({
        ...ticketData,
        customer: selectedCustomer,
        item: selectedItem,
        monthlyInterest,
        totalRedemptionDue,
      })

      setSelectedCustomerId('')
      setSelectedItemId('')
      setLoanAmount('')
      await loadFormData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="users-page">
      <div className="page-heading">
        <div>
          <h1>New Pawn Ticket</h1>
          <p>
            Create a pawn transaction with automatic interest and due date
            computation.
          </p>
        </div>
      </div>

      {error && <div className="users-error">{error}</div>}

      {generatedTicket && (
        <div className="staff-form-card" style={{ marginBottom: 28 }}>
          <div className="dashboard-section-heading">
            <div>
              <h2>Pawn Ticket Generated</h2>
              <span>Official Transaction Record</span>
            </div>
            <button
              type="button"
              className="reports-print-button"
              onClick={() => window.print()}
            >
              Print Pawn Ticket
            </button>
          </div>

          <div className="staff-form-field">
            <p>
              <strong>Transaction Number:</strong>{' '}
              {generatedTicket.transaction_number}
            </p>
            <p>
              <strong>Customer:</strong>{' '}
              {generatedTicket.customer?.first_name}{' '}
              {generatedTicket.customer?.last_name}
            </p>
            <p>
              <strong>Pawned Item:</strong>{' '}
              {generatedTicket.item?.item_categories?.item_type} —{' '}
              {generatedTicket.item?.description}
            </p>
            <p>
              <strong>Principal Loan Amount:</strong>{' '}
              {peso(generatedTicket.loan_amount)}
            </p>
            <p>
              <strong>Monthly Interest ({generatedTicket.monthly_interest_rate}%):</strong>{' '}
              {peso(generatedTicket.monthlyInterest)}
            </p>
            <p>
              <strong>Total Redemption Due on Maturity:</strong>{' '}
              {peso(generatedTicket.totalRedemptionDue)}
            </p>
            <p>
              <strong>Loan Date:</strong> {generatedTicket.loan_date} |{' '}
              <strong>Maturity Due Date:</strong> {generatedTicket.due_date}
            </p>
            <p>
              <strong>Grace Period End Date:</strong>{' '}
              {generatedTicket.grace_period_end_date}
            </p>
          </div>
        </div>
      )}

      <div className="staff-form-card">
        {loading ? (
          <p>Loading customers and appraised items...</p>
        ) : (
          <form onSubmit={handleCreateTicket}>
            <div className="staff-form-field">
              <label>Customer</label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">-- Select Active Customer --</option>
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.last_name}, {c.first_name} ({c.contact_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="staff-form-field">
              <label>Appraised Item</label>
              <select
                required
                value={selectedItemId}
                onChange={(e) => {
                  const id = e.target.value
                  setSelectedItemId(id)
                  const found = availableItems.find((i) => i.item_id === id)
                  if (found) {
                    setLoanAmount(String(found.appraised_value))
                  }
                }}
              >
                <option value="">-- Select Appraised Item --</option>
                {availableItems.map((item) => (
                  <option key={item.item_id} value={item.item_id}>
                    [{item.item_categories?.item_type}] {item.description} —
                    Appraised: {peso(item.appraised_value)}
                  </option>
                ))}
              </select>
              {availableItems.length === 0 && (
                <small>
                  No unlinked appraised items available. Ask an Appraiser to
                  record an appraisal first.
                </small>
              )}
            </div>

            <div className="staff-form-field">
              <label>Loan Amount (PHP)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                max={selectedItem ? selectedItem.appraised_value : undefined}
                required
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
              />
              {selectedItem && (
                <small>
                  Maximum loanable amount:{' '}
                  {peso(selectedItem.appraised_value)} | Standard Monthly Rate:{' '}
                  {monthlyRate}%
                </small>
              )}
            </div>

            <div className="staff-form-field">
              <label>Loan Date</label>
              <input
                type="date"
                required
                value={loanDate}
                onChange={(e) => setLoanDate(e.target.value)}
              />
            </div>

            {selectedItem && numericLoan > 0 && (
              <div
                className="reports-summary-card"
                style={{ marginTop: 16, marginBottom: 8 }}
              >
                <span>Automatic Computation Summary</span>
                <p style={{ margin: '4px 0', fontSize: 13 }}>
                  <strong>Monthly Interest ({monthlyRate}%):</strong>{' '}
                  {peso(monthlyInterest)}
                </p>
                <p style={{ margin: '4px 0', fontSize: 13 }}>
                  <strong>Total Due on Due Date ({dueDate}):</strong>{' '}
                  {peso(totalRedemptionDue)}
                </p>
                <p style={{ margin: '4px 0', fontSize: 13 }}>
                  <strong>Grace Period Ends:</strong> {gracePeriodEndDate} (
                  {graceDays} days)
                </p>
              </div>
            )}

            <div className="staff-form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Generating Ticket...' : 'Generate Pawn Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}