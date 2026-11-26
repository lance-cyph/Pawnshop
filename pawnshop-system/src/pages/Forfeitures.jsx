
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Forfeitures() {
  const [expiredTickets, setExpiredTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedTicket, setSelectedTicket] = useState(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadExpiredTickets()
  }, [])

  async function loadExpiredTickets() {
    setLoading(true)
    setError('')

    try {
      const { data, error: fetchError } = await supabase
        .from('pawn_tickets')
        .select(`
          ticket_id,
          transaction_number,
          loan_amount,
          loan_date,
          due_date,
          grace_period_end_date,
          ticket_status,
          forfeiture_notes,
          customers (
            first_name,
            last_name,
            contact_number
          ),
          pawned_items (
            item_id,
            description,
            appraised_value,
            item_status,
            item_image_url,
            item_categories (
              item_type
            )
          )
        `)
        .eq('ticket_status', 'Expired')
        .order('grace_period_end_date', { ascending: true })

      if (fetchError) throw fetchError

      setExpiredTickets(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load expired pawn tickets.')
    } finally {
      setLoading(false)
    }
  }

  function openApprovalForm(ticket) {
    setSelectedTicket(ticket)
    setNotes('')
    setError('')
    setSuccess('')
  }

  function closeApprovalForm() {
    if (saving) return

    setSelectedTicket(null)
    setNotes('')
  }

  async function handleApprove(event) {
    event.preventDefault()

    if (!selectedTicket) return

    if (!notes.trim()) {
      setError('Please provide forfeiture notes.')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to approve forfeiture of ${selectedTicket.transaction_number}?`
    )

    if (!confirmed) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data, error: functionError } = await supabase.rpc(
        'approve_pawn_forfeiture',
        {
          p_ticket_id: selectedTicket.ticket_id,
          p_notes: notes.trim()
        }
      )

      if (functionError) throw functionError

      if (data?.ticket_status !== 'Forfeited') {
        throw new Error('The forfeiture approval was not confirmed.')
      }

      setSuccess(
        `${selectedTicket.transaction_number} was successfully forfeited. The item is now available for auction.`
      )

      setSelectedTicket(null)
      setNotes('')

      await loadExpiredTickets()
    } catch (err) {
      setError(err.message || 'Failed to approve forfeiture.')
    } finally {
      setSaving(false)
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0)
  }

  function formatDate(date) {
    if (!date) return '—'

    return new Date(`${date}T00:00:00`).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="page-container">
        <h1>Forfeitures</h1>
        <p>Loading expired pawn tickets...</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Forfeitures</h1>
          <p>
            Review expired pawn tickets and approve item forfeitures.
          </p>
        </div>

        <button type="button" onClick={loadExpiredTickets}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <section className="content-section">
        <div className="section-header">
          <h2>Pending Forfeiture Approval</h2>
          <span>{expiredTickets.length} ticket(s)</span>
        </div>

        {expiredTickets.length === 0 ? (
          <p>No expired pawn tickets are waiting for approval.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket No.</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Item Description</th>
                  <th>Appraised Value</th>
                  <th>Loan Amount</th>
                  <th>Grace Period End</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {expiredTickets.map(ticket => (
                  <tr key={ticket.ticket_id}>
                    <td>{ticket.transaction_number}</td>

                    <td>
                      {ticket.customers
                        ? `${ticket.customers.first_name} ${ticket.customers.last_name}`
                        : '—'}
                    </td>

                    <td>
                      {ticket.customers?.contact_number || '—'}
                    </td>

                    <td>
                      {ticket.pawned_items?.description || '—'}
                    </td>

                    <td>
                      {formatCurrency(
                        ticket.pawned_items?.appraised_value
                      )}
                    </td>

                    <td>{formatCurrency(ticket.loan_amount)}</td>

                    <td>
                      {formatDate(ticket.grace_period_end_date)}
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => openApprovalForm(ticket)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Approve Forfeiture</h2>

            <p>
              <strong>Ticket Number:</strong>{' '}
              {selectedTicket.transaction_number}
            </p>

            <p>
              <strong>Customer:</strong>{' '}
              {selectedTicket.customers
                ? `${selectedTicket.customers.first_name} ${selectedTicket.customers.last_name}`
                : '—'}
            </p>

            <p>
              <strong>Item:</strong>{' '}
              {selectedTicket.pawned_items?.description || '—'}
            </p>

            <p>
              <strong>Category:</strong>{' '}
              {selectedTicket.pawned_items?.item_categories?.item_type || '—'}
            </p>

            <p>
              <strong>Loan Amount:</strong>{' '}
              {formatCurrency(selectedTicket.loan_amount)}
            </p>

            <p>
              <strong>Grace Period End:</strong>{' '}
              {formatDate(selectedTicket.grace_period_end_date)}
            </p>

            <p>
              <strong>Current Item Status:</strong>{' '}
              {selectedTicket.pawned_items?.item_status || '—'}
            </p>

            <form onSubmit={handleApprove}>
              <label>Forfeiture Notes</label>

              <textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder="Enter the reason or details for approving this forfeiture..."
                rows={4}
                disabled={saving}
                required
              />

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeApprovalForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" disabled={saving}>
                  {saving ? 'Approving...' : 'Approve Forfeiture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
