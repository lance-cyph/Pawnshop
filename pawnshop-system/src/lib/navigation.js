import {
  LayoutDashboard, Users, FilePlus2, RefreshCw, Gavel, FileText,
  UserCog, ClipboardList,
} from 'lucide-react'

/**
 * Sidebar per role, copied from the Stitch design.
 * `also` = extra URL prefixes that should keep this link highlighted
 * (e.g. the printed ticket page highlights "New ticket").
 * `end`  = highlight only on an exact URL match (dashboards).
 */
export const NAV = {
  Appraiser: {
    section: 'Appraisal Desk',
    chip: 'Appraisal Bench',
    items: [{ to: '/appraiser/appraisals', label: 'Appraisals', icon: ClipboardList }],
  },
  Cashier: {
    section: 'Cashier Operations',
    chip: 'Cashier Counter',
    items: [
      { to: '/cashier', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/cashier/customers', label: 'Customers', icon: Users },
      { to: '/cashier/new-ticket', label: 'New ticket', icon: FilePlus2, also: ['/cashier/ticket'] },
      { to: '/cashier/redeem', label: 'Redeem / renew', icon: RefreshCw, also: ['/cashier/receipt'] },
    ],
  },
  Administrator: {
    section: 'Main Navigation',
    chip: 'Administrative Console',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/auctions', label: 'Auctions', icon: Gavel },
      { to: '/admin/reports', label: 'Reports', icon: FileText },
      { to: '/admin/users', label: 'Users', icon: UserCog },
    ],
  },
}

export function isActive(item, pathname) {
  if (item.end) return pathname === item.to
  return [item.to, ...(item.also || [])].some((p) => pathname === p || pathname.startsWith(p + '/'))
}
