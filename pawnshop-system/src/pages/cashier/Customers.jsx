import { useMemo, useState } from 'react'
import { CheckCircle2, MinusCircle, Search, UserPlus, Users, Pencil, Save, Ban, Camera, Contact } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import { useData } from '../../context/DataContext'

const BLANK = { customer_id: '', first_name: '', last_name: '', contact_number: '', email: '', address: '', status: 'Active' }
// Philippine mobile number, e.g. 0917-123-4567 or 09171234567
const PH_MOBILE = /^09\d{2}-?\d{3}-?\d{4}$/

export default function Customers() {
  const { customers, saveCustomer } = useData()
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  const active = customers.filter((c) => c.status === 'Active').length
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) =>
      `${c.first_name} ${c.last_name} ${c.customer_id}`.toLowerCase().includes(q))
  }, [customers, query])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const select = (c) => { setForm(c); setErrors({}); setMessage('') }
  const startNew = () => { setForm(BLANK); setErrors({}); setMessage('') }

  const validate = () => {
    const e = {}
    if (!form.first_name.trim()) e.first_name = 'Required'
    if (!form.last_name.trim()) e.last_name = 'Required'
    if (!PH_MOBILE.test(form.contact_number.trim())) e.contact_number = 'Use a PH mobile number, e.g. 0917-123-4567'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.address.trim()) e.address = 'Required'
    return e
  }

  const save = (ev) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    const saved = saveCustomer({ ...form, first_name: form.first_name.trim(), last_name: form.last_name.trim() })
    setForm(saved)
    setMessage(`${saved.first_name} ${saved.last_name} saved (${saved.customer_id}).`)
  }

  const toggleActive = () => {
    const next = { ...form, status: form.status === 'Active' ? 'Inactive' : 'Active' }
    saveCustomer(next)
    setForm(next)
    setMessage(`Account ${next.status === 'Active' ? 'reactivated' : 'deactivated'}.`)
  }

  const isNew = !form.customer_id
  const err = (f) => errors[f] && <p className="mt-1 text-[11px] text-red-600">{errors[f]}</p>

  return (
    <>
      <PageHeader
        eyebrow="Counter records / Directory"
        title="Customers"
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted" />
              <input className="input w-56 bg-white pl-8" placeholder="Search by name or ID..."
                value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <button onClick={startNew} className="btn-primary"><UserPlus size={13} /> Add Customer</button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard eyebrow="Total registered" value={customers.length} icon={Users} tone="blue" />
        <StatCard eyebrow="Active borrowers" value={active} icon={CheckCircle2} tone="blue" />
        <StatCard eyebrow="Inactive accounts" value={customers.length - active} icon={MinusCircle} tone="slate" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* Directory */}
        <div className="card p-0">
          <div className="flex items-center justify-between bg-panel px-4 py-2.5">
            <h2 className="flex items-center gap-2 text-xs font-semibold"><Contact size={13} className="text-brand-700" /> Customer Directory Table</h2>
            <span className="text-[10px] text-muted">{filtered.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-xs">
              <thead>
                <tr><th className="th">Customer ID</th><th className="th">Name</th><th className="th">Contact number</th><th className="th">Status</th><th className="th text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((c) => (
                  <tr key={c.customer_id} onClick={() => select(c)}
                    className={`cursor-pointer hover:bg-panel ${form.customer_id === c.customer_id ? 'bg-brand-50' : ''}`}>
                    <td className="px-3 py-3 text-muted">{c.customer_id}</td>
                    <td className="px-3 py-3 font-medium">{c.first_name} {c.last_name}</td>
                    <td className="px-3 py-3 text-muted">{c.contact_number}</td>
                    <td className="px-3 py-3"><Badge status={c.status.toLowerCase()} /></td>
                    <td className="px-3 py-3 text-right font-medium text-brand-700">Edit</td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted">No customers match your search.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-2.5 text-[10px] text-muted">Click any row to populate the editing panel.</p>
        </div>

        {/* Add / Edit form */}
        <form onSubmit={save} className="card" noValidate>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xs font-semibold"><Pencil size={13} className="text-brand-700" /> Add / Edit Customer</h2>
            <span className="text-[10px] font-semibold tracking-wider text-brand-700 uppercase">{isNew ? 'New entry' : form.customer_id}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="first_name">First name <span className="text-red-600">*</span></label>
              <input id="first_name" className="input" value={form.first_name} onChange={set('first_name')} />{err('first_name')}
            </div>
            <div>
              <label className="label" htmlFor="last_name">Last name <span className="text-red-600">*</span></label>
              <input id="last_name" className="input" value={form.last_name} onChange={set('last_name')} />{err('last_name')}
            </div>
          </div>
          <div className="mt-3">
            <label className="label" htmlFor="contact_number">Contact number <span className="text-red-600">*</span></label>
            <input id="contact_number" className="input" placeholder="0917-123-4567" value={form.contact_number} onChange={set('contact_number')} />{err('contact_number')}
          </div>
          <div className="mt-3">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={form.email} onChange={set('email')} />{err('email')}
          </div>
          <div className="mt-3">
            <label className="label" htmlFor="address">Address <span className="text-red-600">*</span></label>
            <textarea id="address" rows={2} className="input resize-none" value={form.address} onChange={set('address')} />{err('address')}
          </div>
          <div className="mt-3">
            <label className="label">ID photo</label>
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-md border border-dashed border-slate-300 bg-panel px-3 py-4 text-center text-[10px] text-muted hover:bg-brand-50">
              <Camera size={16} />
              Upload valid government ID (SSS, PRC, Driver&apos;s License)
              <span className="font-semibold text-brand-700">Choose ID photo file</span>
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>

          {message && <p className="mt-3 text-[11px] text-green-700">{message}</p>}

          <div className="mt-4 flex items-center justify-between">
            {!isNew ? (
              <button type="button" onClick={toggleActive} className="btn-soft-danger">
                <Ban size={13} /> {form.status === 'Active' ? 'Deactivate' : 'Reactivate'}
              </button>
            ) : <span />}
            <button type="submit" className="btn-primary px-6"><Save size={13} /> Save</button>
          </div>
        </form>
      </div>
    </>
  )
}
