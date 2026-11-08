
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auctions() {
  const [availableItems, setAvailableItems] = useState([])
  const [auctionHistory, setAuctionHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedItem, setSelectedItem] = useState(null)
  const [outcome, setOutcome] = useState('Sold')
  const [bidderName, setBidderName] = useState('')
  const [bidderContact, setBidderContact] = useState('')
  const [saleAmount, setSaleAmount] = useState('')

  useEffect(() => {
    loadAuctions()
  }, [])

  async function loadAuctions() {
    setLoading(true)
    setError('')

    try {
      // Get forfeited tickets
      const { data: tickets, error: ticketError } = await supabase
        .from('pawn_tickets')
        .select(`
          ticket_id,
          transaction_number,
          ticket_status,
          item_id
        `)
        .eq('ticket_status', 'Forfeited')

      if (ticketError) throw ticketError

      const forfeitedItemIds = (tickets || []).map(ticket => ticket.item_id)

      let items = []

      if (forfeitedItemIds.length > 0) {
        const { data, error: itemError } = await supabase
          .from('pawned_items')
          .select(`
            item_id,
            description,
            appraised_value,
            item_status,
            item_image_url,
            item_categories (
              item_type
            )
          `)
          .in('item_id', forfeitedItemIds)
          .eq('item_status', 'For Auction')

        if (itemError) throw itemError

        items = (data || []).map(item => {
          const ticket = tickets.find(
            t => t.item_id === item.item_id
          )

          return {
            ...item,
            transaction_number: ticket?.transaction_number
          }
        })
      }

      // Get auction history
      const { data: history, error: historyError } = await supabase
        .from('auctions')
        .select(`
          auction_id,
          item_id,
          winning_bidder_name,
          winning_bidder_contact,
          sale_amount,
          auction_outcome,
          auction_date,
          pawned_items (
            description,
            appraised_value,
            item_categories (
              item_type
            )
          )
        `)
        .order('auction_date', { ascending: false })

      if (historyError) throw historyError

      setAvailableItems(items)
      setAuctionHistory(history || [])
    } catch (err) {
      setError(err.message || 'Failed to load auction records.')
    } finally {
      setLoading(false)
    }
  }

  function openAuctionForm(item) {
    setSelectedItem(item)
    setOutcome('Sold')
    setBidderName('')
    setBidderContact('')
    setSaleAmount('')
    setError('')
    setSuccess('')
  }

  function closeAuctionForm() {
    if (saving) return

    setSelectedItem(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!selectedItem) return

    if (outcome === 'Sold') {
      if (!bidderName.trim()) {
        setError('Please enter the winning bidder name.')
        return
      }

      if (!saleAmount || Number(saleAmount) <= 0) {
        setError('Please enter a valid sale amount.')
        return
      }
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data, error: functionError } = await supabase.rpc(
        'record_auction_result',
        {
          p_item_id: selectedItem.item_id,
          p_outcome: outcome,
          p_winning_bidder_name:
            outcome === 'Sold' ? bidderName.trim() : null,
          p_winning_bidder_contact:
            outcome === 'Sold' ? bidderContact.trim() || null : null,
          p_sale_amount:
            outcome === 'Sold' ? Number(saleAmount) : null
        }
      )

      if (functionError) throw functionError

      setSuccess(
        outcome === 'Sold'
          ? 'Auction sale recorded successfully. Cash flow has been updated.'
          : 'Auction recorded. Item returned to inventory.'
      )

      setSelectedItem(null)

      await loadAuctions()
    } catch (err) {
      setError(err.message || 'Failed to record auction result.')
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

    return new Date(date).toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  if (loading) {
    return (
      <div className="page-container">
        <h1>Auctions</h1>
        <p>Loading auction records...</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Auctions</h1>
          <p>Manage forfeited pawned items and auction results.</p>
        </div>

        <button type="button" onClick={loadAuctions}>
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
          <h2>Available for Auction</h2>
          <span>{availableItems.length} item(s)</span>
        </div>

        {availableItems.length === 0 ? (
          <p>No items are currently available for auction.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket No.</th>
                  <th>Category</th>
                  <th>Item Description</th>
                  <th>Appraised Value</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {availableItems.map(item => (
                  <tr key={item.item_id}>
                    <td>{item.transaction_number}</td>
                    <td>{item.item_categories?.item_type || '—'}</td>
                    <td>{item.description}</td>
                    <td>{formatCurrency(item.appraised_value)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => openAuctionForm(item)}
                      >
                        Record Result
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="content-section">
        <div className="section-header">
          <h2>Auction History</h2>
          <span>{auctionHistory.length} record(s)</span>
        </div>

        {auctionHistory.length === 0 ? (
          <p>No auction history found.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Item Description</th>
                  <th>Winning Bidder</th>
                  <th>Sale Amount</th>
                  <th>Outcome</th>
                </tr>
              </thead>

              <tbody>
                {auctionHistory.map(auction => (
                  <tr key={auction.auction_id}>
                    <td>{formatDate(auction.auction_date)}</td>
                    <td>
                      {auction.pawned_items?.item_categories?.item_type || '—'}
                    </td>
                    <td>
                      {auction.pawned_items?.description || '—'}
                    </td>
                    <td>{auction.winning_bidder_name || '—'}</td>
                    <td>
                      {auction.sale_amount
                        ? formatCurrency(auction.sale_amount)
                        : '—'}
                    </td>
                    <td>{auction.auction_outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Record Auction Result</h2>

            <p>
              <strong>Item:</strong> {selectedItem.description}
            </p>

            <p>
              <strong>Appraised Value:</strong>{' '}
              {formatCurrency(selectedItem.appraised_value)}
            </p>

            <form onSubmit={handleSubmit}>
              <label>Auction Outcome</label>

              <select
                value={outcome}
                onChange={event => setOutcome(event.target.value)}
                disabled={saving}
              >
                <option value="Sold">Sold</option>
                <option value="Returned to Inventory">
                  Returned to Inventory
                </option>
              </select>

              {outcome === 'Sold' && (
                <>
                  <label>Winning Bidder Name</label>
                  <input
                    type="text"
                    value={bidderName}
                    onChange={event => setBidderName(event.target.value)}
                    placeholder="Enter bidder name"
                    disabled={saving}
                    required
                  />

                  <label>Winning Bidder Contact</label>
                  <input
                    type="text"
                    value={bidderContact}
                    onChange={event => setBidderContact(event.target.value)}
                    placeholder="Enter contact number"
                    disabled={saving}
                  />

                  <label>Sale Amount (PHP)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={saleAmount}
                    onChange={event => setSaleAmount(event.target.value)}
                    placeholder="Enter final sale amount"
                    disabled={saving}
                    required
                  />
                </>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeAuctionForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Auction Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
