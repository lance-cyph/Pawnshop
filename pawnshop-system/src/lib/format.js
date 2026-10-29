// Small formatting + date helpers. Dates are stored as 'YYYY-MM-DD' strings
// (the same format a Supabase `date` column returns).

export const peso = (n) =>
  '₱' +
  Number(n || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export const pesoWhole = (n) =>
  '₱' + Number(n || 0).toLocaleString('en-PH', { maximumFractionDigits: 0 })

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function toISO(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  return toISO(new Date(y, m - 1, d + days))
}

/** 'Oct 24, 2024'  or, with long=true, 'October 24, 2024' */
export function formatDate(iso, long = false) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return `${(long ? LONG : SHORT)[m - 1]} ${d}, ${y}`
}

export function formatDateTime(date = new Date()) {
  return (
    formatDate(toISO(date)) +
    ' • ' +
    date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  )
}
