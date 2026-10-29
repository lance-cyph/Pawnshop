// Status pills used in tables. Add a new status by adding one line here.
const STYLES = {
  active: ['Active', 'bg-brand-50 text-brand-700 ring-brand-200'],
  due_soon: ['Due soon', 'bg-amber-50 text-amber-700 ring-amber-200'],
  expired: ['Expired', 'bg-red-50 text-red-700 ring-red-200'],
  redeemed: ['Redeemed', 'bg-green-50 text-green-700 ring-green-200'],
  auctioned: ['Auctioned', 'bg-slate-100 text-slate-600 ring-slate-200'],
  ready: ['Ready for ticket', 'bg-green-50 text-green-700 ring-green-200'],
  pledged: ['Ticketed', 'bg-slate-100 text-slate-600 ring-slate-200'],
  pending: ['Pending approval', 'bg-brand-50 text-brand-700 ring-brand-200'],
  ready_auction: ['Ready for auction', 'bg-brand-50 text-brand-700 ring-brand-200'],
  sold: ['Sold', 'bg-slate-100 text-slate-600 ring-slate-200'],
  unsold: ['Unsold', 'bg-amber-50 text-amber-700 ring-amber-200'],
  inactive: ['Inactive', 'bg-slate-100 text-slate-500 ring-slate-200'],
}

export default function Badge({ status, label }) {
  const [text, style] = STYLES[status] || [status, STYLES.pledged[1]]
  return <span className={`badge ${style}`}>{label || text}</span>
}
