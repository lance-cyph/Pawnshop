import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, ClipboardList, Gem, Package, Save, Smartphone, Watch, Camera } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import { useData } from '../../context/DataContext'
import { ITEM_TYPES } from '../../lib/mockData'
import { pesoWhole } from '../../lib/format'

const TYPE_ICON = {
  'Gold Jewelry': Gem,
  'Silver Jewelry': Gem,
  'Watch / Timepiece': Watch,
  'Electronics / Gadget': Smartphone,
}

const EMPTY = { item_type: '', appraised_value: '', description: '', photo: null }

export default function Appraisals() {
  const { appraisals, addAppraisal } = useData()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [fileKey, setFileKey] = useState(0) // changing this resets the file input
  const [saved, setSaved] = useState('')

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const validate = () => {
    const e = {}
    if (!form.item_type) e.item_type = 'Select an item type.'
    if (!(Number(form.appraised_value) > 0)) e.appraised_value = 'Enter a value greater than 0.'
    if (!form.description.trim()) e.description = 'Describe the item and its condition.'
    return e
  }

  const save = (ev) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    // First line of the description becomes the item name in the list.
    const item_name = form.description.trim().split('\n')[0].slice(0, 60)
    addAppraisal({
      item_name,
      item_type: form.item_type,
      appraised_value: Number(form.appraised_value),
      description: form.description.trim(),
      photo_name: form.photo?.name || null,
    })
    setSaved(item_name)
    clear()
  }

  const clear = () => {
    setForm(EMPTY)
    setErrors({})
    setFileKey((k) => k + 1)
  }

  return (
    <>
      <PageHeader
        title="Appraisals"
        subtitle="Enter collateral appraisal details below to record item value and generate tickets."
        action={
          <span className="inline-flex items-center gap-1.5 rounded border border-line bg-white px-3 py-1.5 text-[11px] text-muted">
            <ClipboardCheck size={12} className="text-brand-700" /> Active Batch: <b className="text-ink">#AP-2024-048</b>
          </span>
        }
      />

      {/* Entry form */}
      <form onSubmit={save} className="card" noValidate>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <ClipboardList size={14} className="text-brand-700" /> New Collateral Appraisal Entry
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="item_type">Item Type <span className="text-red-600">*</span></label>
            <select id="item_type" className="input" value={form.item_type} onChange={set('item_type')}>
              <option value="">-- Select Item Classification --</option>
              {ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            {errors.item_type ? <p className="mt-1 text-[11px] text-red-600">{errors.item_type}</p>
              : <p className="hint">Category determines benchmark valuation matrices and purity tests.</p>}
          </div>
          <div>
            <label className="label" htmlFor="appraised_value">Appraised Value (PHP) <span className="text-red-600">*</span></label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted">₱</span>
              <input id="appraised_value" type="number" min="0" step="0.01" className="input pl-7" placeholder="20,000"
                value={form.appraised_value} onChange={set('appraised_value')} />
            </div>
            {errors.appraised_value ? <p className="mt-1 text-[11px] text-red-600">{errors.appraised_value}</p>
              : <p className="hint">Current maximum loan ceiling will be derived from this amount.</p>}
          </div>
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="description">Description &amp; Condition Notes <span className="text-red-600">*</span></label>
          <textarea id="description" rows={3} className="input resize-y"
            placeholder="e.g. 18K Gold Necklace, 8.5 grams, tested 18k, lobster clasp, minimal scratches"
            value={form.description} onChange={set('description')} />
          {errors.description ? <p className="mt-1 text-[11px] text-red-600">{errors.description}</p>
            : <p className="hint">State gram weight, purity hallmarks, model codes, serial identifiers, or physical flaws.</p>}
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="photo">Item Photo (Verification Upload)</label>
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-panel p-2.5">
            <input key={fileKey} id="photo" type="file" accept="image/*"
              onChange={(e) => setForm({ ...form, photo: e.target.files[0] || null })}
              className="text-xs file:mr-3 file:rounded file:border file:border-slate-300 file:bg-white file:px-2.5 file:py-1 file:text-xs file:font-medium" />
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <Camera size={12} /> Attach high-res photo showing serial stamp or acid test spot.
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          {saved && <span className="mr-auto text-[11px] text-green-700">Saved: {saved}</span>}
          <button type="button" onClick={clear} className="btn-secondary">Clear Entry</button>
          <button type="submit" className="btn-primary"><Save size={13} /> Save Appraisal</button>
        </div>
      </form>

      {/* Appraised items */}
      <div className="card mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ClipboardList size={14} className="text-brand-700" /> Appraised Items
          </h2>
          <span className="rounded bg-panel px-2.5 py-1 text-[11px] text-muted">
            Total Recorded: <b className="text-brand-700">{appraisals.length}</b>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-panel">
              <tr>
                <th className="th">Item</th><th className="th">Type</th>
                <th className="th text-right">Value</th><th className="th text-center">Status</th>
                <th className="th text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {appraisals.map((a) => {
                const Icon = TYPE_ICON[a.item_type] || Package
                return (
                  <tr key={a.appraisal_id}>
                    <td className="px-3 py-3 font-medium">
                      <span className="flex items-center gap-2"><Icon size={13} className="text-brand-700" />{a.item_name}</span>
                    </td>
                    <td className="px-3 py-3 text-muted">{a.item_type}</td>
                    <td className="px-3 py-3 text-right font-semibold text-brand-700">{pesoWhole(a.appraised_value)}</td>
                    <td className="px-3 py-3 text-center"><Badge status={a.status} /></td>
                    <td className="px-3 py-3 text-right">
                      {a.status === 'ready' ? (
                        <button className="btn-secondary px-2.5 py-1.5 text-[11px] text-brand-700"
                          onClick={() => navigate(`/cashier/new-ticket?appraisal=${a.appraisal_id}`)}>
                          Generate Ticket
                        </button>
                      ) : (
                        <span className="rounded bg-panel px-2.5 py-1.5 text-[11px] text-muted">
                          {a.status === 'pending' ? 'Awaiting Mgr' : 'Ticketed'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex justify-between text-[10px] text-muted">
          <span>Standard appraisal validity: 7 business days</span>
          <span>Currency format: Philippine Peso (PHP ₱)</span>
        </div>
      </div>
    </>
  )
}
