import PageHeader from './PageHeader'

// Used for screens that aren't in this lead's scope (Reports, Users).
export default function Placeholder({ title, subtitle }) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="card flex h-56 items-center justify-center border-dashed text-xs text-muted">
        Coming soon
      </div>
    </>
  )
}
