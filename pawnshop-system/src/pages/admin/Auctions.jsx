import { useState } from 'react'
import { Gavel, Save, ClipboardCheck } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import { useData } from '../../context/DataContext'
import { pesoWhole } from '../../lib/format'

export default function Auctions() {
  const { auctions, recordAuction } = useData()
  const [selected, setSelected] = useState(auctions.find((a) => a.status === 'ready')?.ticket_no || '')
  const [bidder, setBidder] = useState('')
  const [amount, setAmount] = useState('')
  const [result, setResult] = useState('sold')
  const [error, setError] = useState('')

  const target = auctions.find((a) => a.ticket_no === selected)

  const save = (e) => {
    e.preventDefault()
    if (!target) return setError('Select a lot first.')
    if (result === 'sold' && (!bidder.trim() || !(Number(amount) > 0))) return setError('Enter the winning bidder and sale amount.')
    recordAuction(target.ticket_no, { bidder: bidder.trim(), amount, result })
    setError(''); setBidder(''); setAmount('')
  }

  return (
    <>
      <PageHeader title="Auctions" subtitle="Unredeemed items past 30-day grace period for public liquidation"
        action={<span className="rounded bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-700">Batch Liquidation: Active</span>} />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="card p-0">
          <h2 className="flex items-center justify-between px-4 py-3 text-xs font-semibold">
            <span className="flex items-center gap-2"><ClipboardCheck size={13} className="text-brand-700" /> Unredeemed Pledge Lots</span>
            <span className="text-[10px] font-normal text-muted">{auctions.length} ITEMS LISTED</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-panel"><tr><th className="th">Item</th><th className="th">Description</th><th className="th text-right">Original loan</th><th className="th text-right">Appraised value</th><th className="th">Status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {auctions.map((a) => (
                  <tr key={a.ticket_no} onClick={() => a.status === 'ready' && setSelected(a.ticket_no)}
                    className={`${a.status === 'ready' ? 'cursor-pointer hover:bg-panel' : 'opacity-70'} ${selected === a.ticket_no ? 'bg-brand-50' : ''}`}>
                    <td className="px-3 py-3 font-medium text-brand-700">{a.ticket_no}</td>
                    <td className="px-3 py-3">{a.item_name}<br /><span className="text-muted">{a.description}</span></td>
                    <td className="px-3 py-3 text-right font-semibold">{pesoWhole(a.original_loan)}</td>
                    <td className="px-3 py-3 text-right font-semibold">{pesoWhole(a.appraised_value)}</td>
                    <td className="px-3 py-3">
                      {a.status === 'ready' ? <Badge status="ready_auction" />
                        : <Badge status={a.status} label={a.status === 'sold' ? `Sold (${pesoWhole(a.sale_amount)})` : undefined} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={save} className="card self-start" noValidate>
          <h2 className="mb-3 flex items-center justify-between text-xs font-semibold">Record Auction Sale Result <Gavel size={13} className="text-brand-700" /></h2>
          <div className="rounded-md bg-panel p-3">
            <p className="section-label">Target item</p>
            {target ? <><p className="text-sm font-semibold text-brand-700">{target.ticket_no}</p><p className="text-[10px] text-muted">{target.item_name} {target.description}</p></>
              : <p className="text-xs text-muted">No lots waiting. Select a lot from the table.</p>}
          </div>
          <label className="label mt-3" htmlFor="bidder">Winning bidder</label>
          <input id="bidder" className="input" placeholder="e.g. Eduardo Cruz" value={bidder} onChange={(e) => setBidder(e.target.value)} disabled={result === 'unsold'} />
          <label className="label mt-3" htmlFor="amount">Sale amount</label>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted">₱</span>
            <input id="amount" type="number" min="0" className="input pl-7" placeholder="14,200" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={result === 'unsold'} />
          </div>
          <label className="label mt-3" htmlFor="result">Result</label>
          <select id="result" className="input" value={result} onChange={(e) => setResult(e.target.value)}>
            <option value="sold">Sold</option><option value="unsold">Unsold</option>
          </select>
          {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
          <button type="submit" className="btn-primary mt-4 w-full py-2.5" disabled={!target}><Save size={13} /> Save</button>
        </form>
      </div>
    </>
  )
}
