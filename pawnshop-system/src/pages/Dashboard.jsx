import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

function peso(value) {
  return '₱' + Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

function StatIcon({ type }) {
  const props = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  if (type === 'clock') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  }

  if (type === 'alert') {
    return (
      <svg {...props}>
        <path d="M12 3L2.8 20h18.4L12 3z" />
        <path d="M12 9v5" />
        <path d="M12 17h.01" />
      </svg>
    )
  }

  if (type === 'items') {
    return (
      <svg {...props}>
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 7v10l9 4 9-4V7" />
        <path d="M12 11v10" />
      </svg>
    )
  }


  switch (type) {
    case 'customers':
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'loans':
      return (
        <svg {...props}>
          <rect x="2" y="6" width="20" height="12" rx="4" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      )
    case 'staff':
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    case 'auction':
    default:
      return (
        <svg {...props}>
          <path d="m14.5 12.5-8 8a2.11 2.11 0 1 1-3-3l8-8" />
          <path d="m16 16 6-6" />
          <path d="m8 8 6-6" />
          <path d="m9 7 8 8" />
          <path d="m21 11-8-8" />
        </svg>
      )
  }
}

function AdminDashboard({ user }) {
  const [stats, setStats] = useState({
    customers: 0,
    activeLoans: 0,
    activeLoanAmount: 0,
    activeStaff: 0,
    expiringLoans: 0,
    expiredLoans: 0,
    auctionItems: 0,
    cashIn: 0,
    cashOut: 0,
  })

  const [loanAlerts, setLoanAlerts] = useState({
    expiring: [],
    overdue: [],
    auction: [],
  })

  const [recentReceipts, setRecentReceipts] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { start, end } = getTodayRange()

      const [
        customerResult,
        ticketResult,
        staffResult,
        ledgerResult,
        auctionResult,
        receiptResult,
      ] = await Promise.all([
        supabase
          .from('customers')
          .select('customer_id', { count: 'exact', head: true }),

        supabase
          .from('pawn_tickets')
          .select(`
            ticket_id,
            transaction_number,
            loan_amount,
            due_date,
            grace_period_end_date,
            ticket_status,
            customers (
              first_name,
              last_name
            ),
            pawned_items (
              item_status,
              description
            )
          `),

        supabase
          .from('users')
          .select('user_id', { count: 'exact', head: true })
          .eq('is_active', true),

        supabase
          .from('cash_flow_ledger')
          .select('amount, flow_type')
          .gte('transaction_date', start)
          .lt('transaction_date', end),

        supabase
          .from('pawned_items')
          .select('item_id', { count: 'exact', head: true })
          .eq('item_status', 'For Auction'),

        supabase
          .from('receipts')
          .select(`
            receipt_id,
            receipt_number,
            transaction_type,
            amount_paid,
            issued_at,
            pawn_tickets (
              transaction_number,
              customers (
                first_name,
                last_name
              )
            )
          `)
          .order('issued_at', { ascending: false })
          .limit(5),
      ])

      const results = [
        customerResult,
        ticketResult,
        staffResult,
        ledgerResult,
        auctionResult,
        receiptResult,
      ]

      const failed = results.find((result) => result.error)

      if (failed) {
        throw new Error(failed.error.message)
      }

      const tickets = ticketResult.data || []
      const ledger = ledgerResult.data || []

      const activeTickets = tickets.filter((ticket) =>
        ['Active', 'Renewed'].includes(ticket.ticket_status)
      )

      const today = new Date()
      const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('-')

      const sevenDaysLater = new Date(today)
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

      const sevenDaysString = [
        sevenDaysLater.getFullYear(),
        String(sevenDaysLater.getMonth() + 1).padStart(2, '0'),
        String(sevenDaysLater.getDate()).padStart(2, '0'),
      ].join('-')

      const expiringTickets = activeTickets.filter((ticket) =>
        ticket.due_date >= todayString &&
        ticket.due_date <= sevenDaysString
      )

      const overdueTickets = activeTickets.filter((ticket) =>
        ticket.due_date < todayString &&
        ticket.grace_period_end_date >= todayString
      )

      const auctionTickets = tickets.filter((ticket) =>
        ticket.pawned_items?.item_status === 'For Auction'
      )

      setLoanAlerts({
        expiring: expiringTickets,
        overdue: overdueTickets,
        auction: auctionTickets,
      })

      const cashIn = ledger
        .filter((entry) => entry.flow_type === 'Inflow')
        .reduce((total, entry) => total + Number(entry.amount || 0), 0)

      const cashOut = ledger
        .filter((entry) => entry.flow_type === 'Outflow')
        .reduce((total, entry) => total + Number(entry.amount || 0), 0)

      setStats({
        customers: customerResult.count || 0,
        activeLoans: activeTickets.length,
        activeLoanAmount: activeTickets.reduce(
          (total, ticket) => total + Number(ticket.loan_amount || 0),
          0
        ),
        activeStaff: staffResult.count || 0,
        expiringLoans: expiringTickets.length,
        expiredLoans: overdueTickets.length,
        auctionItems: auctionResult.count || 0,
        cashIn,
        cashOut,
      })

      setRecentReceipts(receiptResult.data || [])
    } catch (err) {
      setError(err.message || 'Unable to load dashboard information.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const cards = [
    {
      title: 'Total Customers',
      value: stats.customers.toLocaleString(),
      iconType: 'customers',
      bg: '#ede9fe',
      fg: '#7c3aed',
    },
    {
      title: 'Active Loans',
      value: stats.activeLoans.toLocaleString(),
      subtitle: peso(stats.activeLoanAmount),
      iconType: 'loans',
      bg: '#e0e7ff',
      fg: '#4f46e5',
    },
    {
      title: 'Active Staff',
      value: stats.activeStaff.toLocaleString(),
      iconType: 'staff',
      bg: '#fce7f3',
      fg: '#db2777',
    },
    {
      title: 'For Auction',
      value: stats.auctionItems.toLocaleString(),
      iconType: 'auction',
      bg: '#ffedd5',
      fg: '#ea580c',
    },
  ]

  return (
    <div className="admin-dashboard">
      <div className="dashboard-heading">
        <div>
          <h1>Administrator Dashboard</h1>
          <p>
            Welcome back, {user?.full_name || user?.username}.
            Here's your pawnshop overview.
          </p>
        </div>

        <button
          className="dashboard-refresh"
          onClick={loadDashboard}
          disabled={loading}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          <span>{loading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      <div className="dashboard-grid">
        {cards.map((card) => (
          <div className="dashboard-card" key={card.title}>
           <div className="dashboard-card-icon">
              <StatIcon type={card.iconType} />
            </div>

            <div>
              <span>{card.title}</span>
              <strong>
                {loading ? '...' : card.value}
              </strong>

              {card.subtitle && (
                <small>{card.subtitle}</small>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Loan Alerts</h2>
            <span>Pawn tickets that need attention</span>
          </div>
        </div>

        
      <div className="dashboard-grid dashboard-alert-grid">

        {/* Expiring Within 7 Days */}
        <div className="dashboard-alert">
          <div className="loan-alert-icon">
            <StatIcon type="clock" />
          </div>
          <span>Expiring Within 7 Days</span>
          <strong>{loading ? '...' : loanAlerts.expiring.length}</strong>
        </div>

        {/* Overdue Loans */}
        <div className="dashboard-alert">
          <div className="loan-alert-icon">
            <StatIcon type="alert" />
          </div>
          <span>
            Overdue Loans
            <small className="overdue-badge">Overdue</small>
          </span>
          <strong>{loading ? '...' : loanAlerts.overdue.length}</strong>
        </div>

        {/* Items For Auction */}
        <div className="dashboard-alert">
          <div className="loan-alert-icon">
            <StatIcon type="items" />
          </div>
          <span>Items For Auction</span>
          <strong>{loading ? '...' : loanAlerts.auction.length}</strong>
        </div>

      </div>


        {loading ? (
          <p className="dashboard-message">Loading loan alerts...</p>
        ) : (
          <div className="loan-alert-details">
            <div className="loan-alert-group">
              <h3>Expiring Soon</h3>

              {loanAlerts.expiring.length === 0 ? (
                <p>No tickets expiring within 7 days.</p>
              ) : (
                loanAlerts.expiring.map((ticket) => {
                  const customer = ticket.customers

                  return (
                    <div className="loan-alert-item" key={ticket.ticket_id}>
                      <div>
                        <strong>{ticket.transaction_number}</strong>
                        <span>
                          {customer
                            ? `${customer.first_name} ${customer.last_name}`
                            : 'Unknown Customer'}
                        </span>
                      </div>

                      <div>
                        <strong>{peso(ticket.loan_amount)}</strong>
                        <span>Due: {ticket.due_date}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="loan-alert-group">
              <h3>Overdue Loans</h3>

              {loanAlerts.overdue.length === 0 ? (
                <p>No overdue active loans.</p>
              ) : (
                loanAlerts.overdue.map((ticket) => {
                  const customer = ticket.customers

                  return (
                    <div className="loan-alert-item" key={ticket.ticket_id}>
                      <div>
                        <strong>{ticket.transaction_number}</strong>
                        <span>
                          {customer
                            ? `${customer.first_name} ${customer.last_name}`
                            : 'Unknown Customer'}
                        </span>
                      </div>

                      <div>
                        <strong>{peso(ticket.loan_amount)}</strong>
                        <span>Due: {ticket.due_date}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="loan-alert-group">
              <h3>Items For Auction</h3>

              {loanAlerts.auction.length === 0 ? (
                <p>No items currently marked For Auction.</p>
              ) : (
                loanAlerts.auction.map((ticket) => {
                  const customer = ticket.customers

                  return (
                    <div className="loan-alert-item" key={ticket.ticket_id}>
                      <div>
                        <strong>{ticket.transaction_number}</strong>
                        <span>
                          {customer
                            ? `${customer.first_name} ${customer.last_name}`
                            : 'Unknown Customer'}
                        </span>
                      </div>

                      <div>
                        <strong>{peso(ticket.loan_amount)}</strong>
                        <span>
                          {ticket.pawned_items?.description || 'Pawned item'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Cash Flow Today</h2>
            <span>Based on today's ledger records</span>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-cash-card">
            <span>Cash In</span>
            <strong className="cash-in">
              {loading ? '...' : peso(stats.cashIn)}
            </strong>
          </div>

          <div className="dashboard-cash-card">
            <span>Cash Out</span>
            <strong className="cash-out">
              {loading ? '...' : peso(stats.cashOut)}
            </strong>
          </div>
        </div>
      </div>

      <div className="dashboard-section dashboard-table-card">
        <div className="dashboard-section-heading">
          <div>
            <h2>Recent Transactions</h2>
            <span>Latest receipts recorded in the system</span>
          </div>
          <Link to="/reports">View Reports</Link>
        </div>

        {loading ? (
          <p className="dashboard-message">Loading transactions...</p>
        ) : recentReceipts.length === 0 ? (
          <p className="dashboard-message">No transactions recorded yet.</p>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Receipt Number</th>
                  <th>Customer</th>
                  <th>Transaction</th>
                  <th>Amount Paid</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {recentReceipts.map((receipt) => {
                  const customer = receipt.pawn_tickets?.customers

                  return (
                    <tr key={receipt.receipt_id}>
                      <td>{receipt.receipt_number}</td>
                      <td>
                        {customer
                          ? `${customer.first_name} ${customer.last_name}`
                          : 'Unknown Customer'}
                      </td>
                      <td>{receipt.transaction_type}</td>
                      <td>{peso(receipt.amount_paid)}</td>
                      <td>
                        {new Date(receipt.issued_at).toLocaleString('en-PH')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-heading">
          <h2>Quick Shortcuts</h2>
        </div>

        <div className="dashboard-shortcuts">
          <Link to="/users">Manage Staff</Link>
          <Link to="/auctions">Manage Auctions</Link>
          <Link to="/reports">View Reports</Link>
          <Link to="/create-staff">Create Staff Account</Link>
        </div>
      </div>
    </div>
  )
}

function CashierDashboard({ user }) {
  const [customerCount, setCustomerCount] = useState(0)
  const [loanAlerts, setLoanAlerts] = useState({
    expiring: [],
    overdue: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCashierData() {
      setLoading(true)
      try {
        const { count: custCount, error: custErr } = await supabase
          .from('customers')
          .select('customer_id', { count: 'exact', head: true })

        if (custErr) throw custErr;
        setCustomerCount(custCount || 0)

        const { data: tickets, error: tickErr } = await supabase
          .from('pawn_tickets')
          .select(`
            ticket_id,
            transaction_number,
            loan_amount,
            due_date,
            grace_period_end_date,
            ticket_status,
            customers (
              first_name,
              last_name
            )
          `)
          .in('ticket_status', ['Active', 'Renewed'])

        if (tickErr) throw tickErr;

        const activeTickets = tickets || [];
        const today = new Date()
        const todayString = [
          today.getFullYear(),
          String(today.getMonth() + 1).padStart(2, '0'),
          String(today.getDate()).padStart(2, '0'),
        ].join('-')

        const sevenDaysLater = new Date(today)
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

        const sevenDaysString = [
          sevenDaysLater.getFullYear(),
          String(sevenDaysLater.getMonth() + 1).padStart(2, '0'),
          String(sevenDaysLater.getDate()).padStart(2, '0'),
        ].join('-')

        const expiringTickets = activeTickets.filter((ticket) =>
          ticket.due_date >= todayString &&
          ticket.due_date <= sevenDaysString
        )

        const overdueTickets = activeTickets.filter((ticket) =>
          ticket.due_date < todayString &&
          ticket.grace_period_end_date >= todayString
        )

        setLoanAlerts({
          expiring: expiringTickets,
          overdue: overdueTickets
        })
      } catch (err) {
        setError(err.message || 'Unable to load dashboard information.')
      } finally {
        setLoading(false)
      }
    }

    loadCashierData()
  }, [])

  return (
    <div className="admin-dashboard">
      <div className="dashboard-heading">
        <div>
          <h1>Welcome, {user?.full_name || user?.username}</h1>
          <p>Cashier Dashboard</p>
        </div>
      </div>

      {error && <p className="dashboard-error">{error}</p>}

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div
            className="dashboard-card-icon"
            style={{ background: '#ede9fe', color: '#7c3aed' }}
          >
            <StatIcon type="customers" />
          </div>
          <div>
            <span>Total Customers</span>
            <strong>{loading ? '...' : customerCount}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Loan Alerts</h2>
            <span>Pawn tickets that need attention today</span>
          </div>
        </div>

        <div className="dashboard-grid dashboard-alert-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="dashboard-alert warning">
            <span>Expiring Within 7 Days</span>
            <strong>{loading ? '...' : loanAlerts.expiring.length}</strong>
          </div>

          <div className="dashboard-alert danger">
            <span>Overdue Loans</span>
            <strong>{loading ? '...' : loanAlerts.overdue.length}</strong>
          </div>
        </div>

        {loading ? (
          <p className="dashboard-message">Loading loan alerts...</p>
        ) : (
          <div className="loan-alert-details" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="loan-alert-group">
              <h3>Expiring Soon</h3>

              {loanAlerts.expiring.length === 0 ? (
                <p>No tickets expiring within 7 days.</p>
              ) : (
                loanAlerts.expiring.map((ticket) => {
                  const customer = ticket.customers

                  return (
                    <div className="loan-alert-item" key={ticket.ticket_id}>
                      <div>
                        <strong>{ticket.transaction_number}</strong>
                        <span>
                          {customer
                            ? `${customer.first_name} ${customer.last_name}`
                            : 'Unknown Customer'}
                        </span>
                      </div>

                      <div>
                        <strong>{peso(ticket.loan_amount)}</strong>
                        <span>Due: {ticket.due_date}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="loan-alert-group">
              <h3>Overdue Loans</h3>

              {loanAlerts.overdue.length === 0 ? (
                <p>No overdue active loans.</p>
              ) : (
                loanAlerts.overdue.map((ticket) => {
                  const customer = ticket.customers

                  return (
                    <div className="loan-alert-item" key={ticket.ticket_id}>
                      <div>
                        <strong>{ticket.transaction_number}</strong>
                        <span>
                          {customer
                            ? `${customer.first_name} ${customer.last_name}`
                            : 'Unknown Customer'}
                        </span>
                      </div>

                      <div>
                        <strong>{peso(ticket.loan_amount)}</strong>
                        <span>Due: {ticket.due_date}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-heading">
          <h2>Quick Shortcuts</h2>
        </div>
        <div className="dashboard-shortcuts">
          <Link to="/customers">Register Customer</Link>
          <Link to="/new-ticket">New Ticket</Link>
          <Link to="/redeem-renew">Redeem / Renew</Link>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, loading } = useAuth()

  if (loading || !user) {
    return <p>Loading dashboard...</p>
  }

  if (user.role === 'Administrator') {
    return <AdminDashboard user={user} />
  }

  return <CashierDashboard user={user} />
}