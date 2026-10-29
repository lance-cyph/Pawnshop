import { createContext, useContext, useEffect, useState } from 'react'
import {
  seedCustomers,
  seedAppraisals,
  seedTickets,
  seedAuctions,
  seedReceipts,
} from '../lib/mockData'
import {
  MONTHLY_RATE,
  TERM_DAYS,
  nextNumber,
  settlementBreakdown,
} from '../lib/pawn'
import { addDays, toISO } from '../lib/format'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

// Keeps the sample data in the browser so a page refresh doesn't wipe your
// demo. Goes away once the real data comes from Supabase. To reset the demo,
// clear this site's localStorage in the browser dev tools.
function usePersisted(key, seed) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : seed
    } catch {
      return seed
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage blocked: data just won't survive a refresh */
    }
  }, [key, value])
  return [value, setValue]
}

/**
 * In-memory data store used by every screen.
 * Each function here is a spot where a Supabase call goes later, e.g.
 *   saveCustomer  -> supabase.from('customers').upsert(...)
 *   createTicket  -> supabase.from('pawn_tickets').insert(...)
 * Screens only call these functions, so swapping to Supabase won't touch the UI.
 */
export function DataProvider({ children }) {
  const { user } = useAuth()
  const [customers, setCustomers] = usePersisted('pawn:customers:v1', seedCustomers)
  const [appraisals, setAppraisals] = usePersisted('pawn:appraisals:v1', seedAppraisals)
  const [tickets, setTickets] = usePersisted('pawn:tickets:v1', seedTickets)
  const [auctions, setAuctions] = usePersisted('pawn:auctions:v1', seedAuctions)
  const [receipts, setReceipts] = usePersisted('pawn:receipts:v1', seedReceipts)

  const customerName = (id) => {
    const c = customers.find((x) => x.customer_id === id)
    return c ? `${c.first_name} ${c.last_name}` : 'Unknown'
  }

  const saveCustomer = (data) => {
    if (data.customer_id) {
      setCustomers((prev) => prev.map((c) => (c.customer_id === data.customer_id ? { ...c, ...data } : c)))
      return data
    }
    const seq = customers.length + 1
    const created = { ...data, customer_id: `CUST-${String(seq).padStart(3, '0')}`, status: 'Active' }
    setCustomers((prev) => [...prev, created])
    return created
  }

  const addAppraisal = (data) => {
    const seq = appraisals.length + 1
    const created = {
      ...data,
      appraisal_id: `APR-${String(seq).padStart(3, '0')}`,
      status: 'ready',
    }
    setAppraisals((prev) => [created, ...prev])
    return created
  }

  const createTicket = ({ customer_id, appraisal_id, principal, notes }) => {
    const item = appraisals.find((a) => a.appraisal_id === appraisal_id)
    const loan_date = toISO()
    const ticket = {
      ticket_no: nextNumber('PT', tickets.map((t) => t.ticket_no)),
      customer_id,
      appraisal_id,
      item_name: item.item_name,
      appraised_value: item.appraised_value,
      principal: Number(principal),
      interest_rate: MONTHLY_RATE,
      loan_date,
      due_date: addDays(loan_date, TERM_DAYS),
      status: 'active',
      notes,
    }
    setTickets((prev) => [ticket, ...prev])
    setAppraisals((prev) => prev.map((a) => (a.appraisal_id === appraisal_id ? { ...a, status: 'pledged' } : a)))
    return ticket
  }

  /** type: 'redeem' | 'renew'. Returns the receipt. */
  const settleTicket = (ticket_no, type) => {
    const t = tickets.find((x) => x.ticket_no === ticket_no)
    const b = settlementBreakdown(t)
    const today = toISO()
    const base = t.due_date > today ? t.due_date : today
    const receipt = {
      receipt_no: nextNumber('OR', receipts.map((r) => r.receipt_no)),
      ticket_no,
      customer_name: customerName(t.customer_id),
      item_name: t.item_name,
      type: type === 'redeem' ? 'Full Redemption' : 'Renewal',
      date: today,
      principal: t.principal,
      interest: b.interest,
      penalty: b.penalty,
      amount_paid: type === 'redeem' ? b.redeemTotal : b.renewTotal,
      new_due_date: type === 'redeem' ? null : addDays(base, TERM_DAYS),
      cashier: user?.name || 'Cashier',
    }
    setReceipts((prev) => [receipt, ...prev])
    setTickets((prev) =>
      prev.map((x) =>
        x.ticket_no !== ticket_no
          ? x
          : type === 'redeem'
            ? { ...x, status: 'redeemed' }
            : { ...x, status: 'active', due_date: receipt.new_due_date },
      ),
    )
    return receipt
  }

  const recordAuction = (ticket_no, { bidder, amount, result }) => {
    setAuctions((prev) =>
      prev.map((a) =>
        a.ticket_no === ticket_no
          ? { ...a, status: result, bidder, sale_amount: result === 'sold' ? Number(amount) : null }
          : a,
      ),
    )
  }

  return (
    <DataContext.Provider
      value={{
        customers, appraisals, tickets, auctions, receipts,
        customerName, saveCustomer, addAppraisal, createTicket, settleTicket, recordAuction,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}
