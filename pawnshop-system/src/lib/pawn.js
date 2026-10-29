// ---------------------------------------------------------------------
// PLACEHOLDER BUSINESS RULES
// The exact interest / due date / penalty logic belongs to the Business
// Logic lead (#3). These constants and functions only exist so the UI has
// numbers to show. When their real functions are ready, replace the
// bodies in this ONE file and every screen updates.
// ---------------------------------------------------------------------

export const MONTHLY_RATE = 0.035 // 3.5% per month (from the design)
export const TERM_DAYS = 30 // loan term
export const GRACE_DAYS = 30 // days after due date before auction
export const PENALTY_RATE = 0 // TODO: real penalty rule

const round2 = (n) => Math.round(n * 100) / 100

export function monthlyInterest(principal) {
  return round2(Number(principal || 0) * MONTHLY_RATE)
}

/** Numbers shown while creating a NEW ticket (interest is deducted in advance). */
export function newLoanBreakdown(principal) {
  const p = Number(principal || 0)
  const interest = monthlyInterest(p)
  return { principal: p, interest, netProceeds: round2(p - interest) }
}

/** Numbers shown on the Redeem / Renew screen. */
export function settlementBreakdown(ticket) {
  const interest = monthlyInterest(ticket.principal)
  const penalty = round2(ticket.principal * PENALTY_RATE)
  return {
    interest,
    penalty,
    redeemTotal: round2(ticket.principal + interest + penalty), // pay everything, get item back
    renewTotal: round2(interest + penalty), // pay interest only, extend the loan
  }
}

/** Next number like PT-2026-00143 (prefix-year-sequence). */
export function nextNumber(prefix, existing) {
  const year = new Date().getFullYear()
  const max = existing.reduce((m, no) => Math.max(m, Number(String(no).split('-').pop()) || 0), 0)
  return `${prefix}-${year}-${String(max + 1).padStart(5, '0')}`
}
