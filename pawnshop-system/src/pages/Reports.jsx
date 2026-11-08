
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function getToday() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getMonthStart() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}-01`
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(value) || 0)
}

function calculateTotal(rows, field) {
  return rows.reduce(
    (total, row) => total + Number(row[field] || 0),
    0
  )
}

function countStatus(rows, status) {
  return rows.filter(
    (row) => row.ticket_status === status
  ).length
}

export default function Reports() {
  const [startDate, setStartDate] = useState(getMonthStart())
  const [endDate, setEndDate] = useState(getToday())
  const [selectedPreset, setSelectedPreset] = useState('This Month')

  const [cashFlows, setCashFlows] = useState([])
  const [tickets, setTickets] = useState([])
  const [auctions, setAuctions] = useState([])
  const [items, setItems] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReports()
  }, [startDate, endDate])

  function applyPreset(preset) {
    const today = getToday()
    const now = new Date()

    setSelectedPreset(preset)

    if (preset === 'Today') {
      setStartDate(today)
      setEndDate(today)
    } else if (preset === 'This Month') {
      setStartDate(getMonthStart())
      setEndDate(today)
    } else if (preset === 'This Year') {
      setStartDate(`${now.getFullYear()}-01-01`)
      setEndDate(today)
    } else if (preset === 'All Time') {
      setStartDate('')
      setEndDate('')
    }
    // Custom Range keeps the dates selected by the user.
  }

  function handleStartDateChange(value) {
    setStartDate(value)
    setSelectedPreset('Custom Range')
  }

  function handleEndDateChange(value) {
    setEndDate(value)
    setSelectedPreset('Custom Range')
  }

  function handlePrint() {
    window.print()
  }

  async function loadReports() {
    if (startDate && endDate && startDate > endDate) {
      setError('The start date cannot be later than the end date.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    // Convert selected dates into local-day timestamp boundaries.
    const startISO = startDate
      ? new Date(`${startDate}T00:00:00`).toISOString()
      : null

    const endISO = endDate
      ? new Date(`${endDate}T23:59:59.999`).toISOString()
      : null

    // Apply date filters only when a date is selected.
    function applyDateFilter(query, column) {
      if (startISO) {
        query = query.gte(column, startISO)
      }

      if (endISO) {
        query = query.lte(column, endISO)
      }

      return query
    }

    const [
      cashFlowResult,
      ticketResult,
      auctionResult,
      itemResult,
    ] = await Promise.all([
      applyDateFilter(
        supabase
          .from('cash_flow_ledger')
          .select('ledger_id, flow_type, category, amount, transaction_date'),
        'transaction_date'
      ),

      applyDateFilter(
        supabase
          .from('pawn_tickets')
          .select('ticket_id, ticket_status, loan_amount, loan_date'),
        'loan_date'
      ),

      applyDateFilter(
        supabase
          .from('auctions')
          .select('auction_id, auction_outcome, sale_amount, auction_date'),
        'auction_date'
      ),

      applyDateFilter(
        supabase
          .from('pawned_items')
          .select('item_id, item_status, created_at'),
        'created_at'
      ),
    ])

    const results = [
      cashFlowResult,
      ticketResult,
      auctionResult,
      itemResult,
    ]

    const failedResult = results.find(
      (result) => result.error
    )

    if (failedResult) {
      setError(failedResult.error.message)
      setLoading(false)
      return
    }

    setCashFlows(cashFlowResult.data || [])
    setTickets(ticketResult.data || [])
    setAuctions(auctionResult.data || [])
    setItems(itemResult.data || [])

    setLoading(false)
  }

  const totalInflow = calculateTotal(
    cashFlows.filter((row) => row.flow_type === 'Inflow'),
    'amount'
  )

  const totalOutflow = calculateTotal(
    cashFlows.filter((row) => row.flow_type === 'Outflow'),
    'amount'
  )

  const netCashFlow = totalInflow - totalOutflow

  const auctionRevenue = calculateTotal(
    auctions.filter((row) => row.auction_outcome === 'Sold'),
    'sale_amount'
  )

  const ticketStatuses = [
    'Active',
    'Renewed',
    'Redeemed',
    'Expired',
    'Forfeited',
  ]

  const itemStatuses = [
    'Pledged',
    'Redeemed',
    'For Auction',
    'Sold',
    'Returned to Inventory',
  ]

  const soldAuctions = auctions.filter(
    (row) => row.auction_outcome === 'Sold'
  ).length

  const returnedAuctions = auctions.filter(
    (row) => row.auction_outcome === 'Returned to Inventory'
  ).length

  const reportPeriod = selectedPreset === 'All Time'
    ? 'All Time'
    : `${startDate || 'Beginning'} to ${endDate || 'Present'}`

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Reports</h1>
          <p>View financial summaries and pawnshop transaction reports.</p>
        </div>

        <div className="reports-header-actions">
          <button
            type="button"
            className="reports-print-button"
            onClick={handlePrint}
            disabled={loading}
          >
            Print Report
          </button>

          <button
            type="button"
            className="reports-refresh-button"
            onClick={loadReports}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <section className="reports-filter">
        <div className="reports-filter-heading">
          <h2>Date Range</h2>
          <p>Select the period you want to include in the reports.</p>
        </div>

        <div className="reports-presets">
          {[
            'Today',
            'This Month',
            'This Year',
            'All Time',
            'Custom Range',
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              className={
                selectedPreset === preset
                  ? 'reports-preset-button active'
                  : 'reports-preset-button'
              }
              onClick={() => applyPreset(preset)}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="reports-filter-fields">
          <div>
            <label htmlFor="report-start-date">Start Date</label>
            <input
              id="report-start-date"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="report-end-date">End Date</label>
            <input
              id="report-end-date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="reports-print-meta">
        <h2>Pawnshop Management System</h2>
        <p>Reports Period: {reportPeriod}</p>
        <p>Generated: {new Date().toLocaleString('en-PH')}</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <p className="reports-loading">Loading reports...</p>
      ) : (
        <>
          <section className="reports-section">
            <div className="reports-section-heading">
              <h2>Financial Summary</h2>
              <span>{cashFlows.length} transaction(s)</span>
            </div>

            <div className="reports-summary-grid">
              <div className="reports-summary-card">
                <span>Total Inflows</span>
                <strong className="reports-inflow">
                  {formatCurrency(totalInflow)}
                </strong>
              </div>

              <div className="reports-summary-card">
                <span>Total Outflows</span>
                <strong className="reports-outflow">
                  {formatCurrency(totalOutflow)}
                </strong>
              </div>

              <div className="reports-summary-card">
                <span>Net Cash Flow</span>
                <strong>{formatCurrency(netCashFlow)}</strong>
              </div>

              <div className="reports-summary-card">
                <span>Auction Revenue</span>
                <strong>{formatCurrency(auctionRevenue)}</strong>
              </div>
            </div>
          </section>

          <section className="reports-section">
            <div className="reports-section-heading">
              <h2>Pawn Ticket Report</h2>
              <span>{tickets.length} ticket(s)</span>
            </div>

            <div className="reports-status-grid">
              {ticketStatuses.map((status) => (
                <div className="reports-status-card" key={status}>
                  <span>{status}</span>
                  <strong>{countStatus(tickets, status)}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="reports-section">
            <div className="reports-section-heading">
              <h2>Auction Report</h2>
              <span>{auctions.length} auction(s)</span>
            </div>

            <div className="reports-status-grid">
              <div className="reports-status-card">
                <span>Items Sold</span>
                <strong>{soldAuctions}</strong>
              </div>

              <div className="reports-status-card">
                <span>Returned to Inventory</span>
                <strong>{returnedAuctions}</strong>
              </div>

              <div className="reports-status-card">
                <span>Auction Revenue</span>
                <strong>{formatCurrency(auctionRevenue)}</strong>
              </div>
            </div>
          </section>

          <section className="reports-section">
            <div className="reports-section-heading">
              <h2>Inventory Report</h2>
              <span>{items.length} item(s)</span>
            </div>

            <div className="reports-status-grid">
              {itemStatuses.map((status) => (
                <div className="reports-status-card" key={status}>
                  <span>{status}</span>
                  <strong>
                    {items.filter(
                      (item) => item.item_status === status
                    ).length}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
