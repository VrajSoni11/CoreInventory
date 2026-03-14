import { useState, useEffect, useCallback } from 'react'
import { History, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, AlertTriangle } from 'lucide-react'
import api from '../../services/api'
import AppLayout from '../../components/layout/AppLayout'

const TYPE_ICON = { receipt: ArrowDownToLine, delivery: ArrowUpFromLine, transfer: ArrowLeftRight, adjustment: AlertTriangle }
const TYPE_COLOR = { receipt: 'text-emerald-400 bg-emerald-500/10', delivery: 'text-amber-400 bg-amber-500/10', transfer: 'text-blue-400 bg-blue-500/10', adjustment: 'text-purple-400 bg-purple-500/10' }
const STATUS_BADGE = { done: 'badge-green', draft: 'badge-gray', waiting: 'badge-amber', ready: 'badge-blue', cancelled: 'badge-red' }

export default function MoveHistory() {
  const [moves, setMoves] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: '', status: '' })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchMoves = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 25 }
      if (filters.type) params.type = filters.type
      if (filters.status) params.status = filters.status
      const { data } = await api.get('/operations', { params })
      setMoves(data.data)
      setTotal(data.total)
    } catch { } finally { setLoading(false) }
  }, [filters, page])

  useEffect(() => { fetchMoves() }, [fetchMoves])

  const f = (k, v) => { setFilters(prev => ({ ...prev, [k]: v })); setPage(1) }

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <History size={20} className="text-brand-500" />
        <div>
          <h1 className="text-xl font-bold text-white">Move History</h1>
          <p className="text-white/40 text-sm">{total} total records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select className="input-field w-auto" value={filters.type} onChange={e => f('type', e.target.value)}>
          <option value="">All types</option>
          <option value="receipt">Receipt</option>
          <option value="delivery">Delivery</option>
          <option value="transfer">Transfer</option>
          <option value="adjustment">Adjustment</option>
        </select>
        <select className="input-field w-auto" value={filters.status} onChange={e => f('status', e.target.value)}>
          <option value="">All statuses</option>
          {['draft','waiting','ready','done','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Type', 'Reference', 'Product', 'Qty', 'From → To', 'Status', 'By', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-white/30 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-white/30 text-sm">Loading...</td></tr>
              ) : moves.map(m => {
                const Icon = TYPE_ICON[m.type] || History
                const color = TYPE_COLOR[m.type] || 'text-white/50 bg-white/5'
                return (
                  <tr key={m._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors text-sm">
                    <td className="px-4 py-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon size={13} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-500">{m.reference}</td>
                    <td className="px-4 py-3 text-white">{m.product?.name || '—'}</td>
                    <td className="px-4 py-3 text-white font-medium">{m.quantity}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {m.fromWarehouse?.name || '—'} → {m.toWarehouse?.name || '—'}
                    </td>
                    <td className="px-4 py-3"><span className={STATUS_BADGE[m.status] || 'badge-gray'}>{m.status}</span></td>
                    <td className="px-4 py-3 text-white/40 text-xs">{m.createdBy?.name || '—'}</td>
                    <td className="px-4 py-3 text-white/30 text-xs">{new Date(m.createdAt).toLocaleString()}</td>
                  </tr>
                )
              })}
              {!loading && moves.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-white/30 text-sm">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 25 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-white/30">Showing {moves.length} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 disabled:opacity-30">Prev</button>
              <button disabled={moves.length < 25} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
