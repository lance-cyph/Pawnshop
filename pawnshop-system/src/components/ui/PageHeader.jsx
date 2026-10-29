export default function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="no-print mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow && <p className="section-label mb-1">{eyebrow}</p>}
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
