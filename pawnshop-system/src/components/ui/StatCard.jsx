const TONES = {
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-brand-50 text-brand-700',
  slate: 'bg-slate-100 text-slate-500',
}

export default function StatCard({ eyebrow, label, value, sub, icon: Icon, tone = 'blue' }) {
  return (
    <div className="card flex items-center justify-between gap-3 p-4">
      <div>
        {eyebrow && <p className="section-label">{eyebrow}</p>}
        {label && <p className="text-[11px] text-muted">{label}</p>}
        <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
        {sub && <p className="text-[10px] text-muted">{sub}</p>}
      </div>
      {Icon && (
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${TONES[tone]}`}>
          <Icon size={16} />
        </span>
      )}
    </div>
  )
}
