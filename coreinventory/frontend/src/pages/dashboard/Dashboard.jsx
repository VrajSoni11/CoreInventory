import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, TrendingDown, AlertTriangle, ArrowDownToLine,
  ArrowUpFromLine, ArrowLeftRight, Clock, CheckCircle2
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../../services/api'
import AppLayout from '../../components/layout/AppLayout'
import { useAuth } from '../../context/AuthContext'

const STATUS_BADGE = {
  done: 'badge-green',
  draft: 'badge-gray',
  waiting: 'badge-amber',
  ready: 'badge-blue',
  cancelled: 'badge-red',
}

const TYPE_ICON = {
  receipt: ArrowDownToLine,
  delivery: ArrowUpFromLine,
  transfer: ArrowLeftRight,
  adjustment: AlertTriangle,
}

const TYPE_COLOR = {
  receipt: 'text-emerald-400',
  delivery: 'text-amber-400',
  transfer: 'text-blue-400',
  adjustment: 'text-purple-400',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/operations/dashboard')
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const kpis = data ? [
    { label: 'Total Products', value: data.totalProducts, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Low Stock', value: data.lowStock, icon: TrendingDown, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Out of Stock', value: data.outOfStock, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Pending Receipts', value: data.pendingReceipts, icon: ArrowDownToLine, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Pending Deliveries', value: data.pendingDeliveries, icon: ArrowUpFromLine, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    { label: 'Pending Transfers', value: data.pendingTransfers, icon: ArrowLeftRight, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ] : []

  const chartData = data ? [
    { name: 'Receipts', value: data.pendingReceipts, color: '#34d399' },
    { name: 'Deliveries', value: data.pendingDeliveries, color: '#f59e0b' },
    { name: 'Transfers', value: data.pendingTransfers, color: '#818cf8' },
    { name: 'Low Stock', value: data.lowStock, color: '#f87171' },
  ] : []

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="text-brand-500">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-white/40 text-sm mt-1">Here's what's happening in your inventory today.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className={`card border ${k.bg} p-4 flex flex-col gap-2`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.bg}`}>
              <k.icon size={16} className={k.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{k.value ?? '—'}</p>
              <p className="text-white/40 text-xs mt-0.5">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="card lg:col-span-1">
          <h2 className="text-sm font-semibold text-white mb-4">Pending overview</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#0f0f23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 12 }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent moves */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent activity</h2>
            <Link to="/history" className="text-xs text-brand-500 hover:text-brand-400 transition-colors">View all</Link>
          </div>
          {data?.recentMoves?.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">No recent activity</div>
          ) : (
            <div className="space-y-2">
              {data?.recentMoves?.map(move => {
                const Icon = TYPE_ICON[move.type] || Clock
                const color = TYPE_COLOR[move.type] || 'text-white/50'
                return (
                  <div key={move._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0`}>
                      <Icon size={14} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{move.reference}</p>
                      <p className="text-xs text-white/30 truncate">{move.product?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={STATUS_BADGE[move.status] || 'badge-gray'}>{move.status}</span>
                      <p className="text-xs text-white/30 mt-1">{move.quantity} {move.product?.unit}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'New Receipt', to: '/operations/receipts/new', icon: ArrowDownToLine, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'New Delivery', to: '/operations/deliveries/new', icon: ArrowUpFromLine, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { label: 'New Transfer', to: '/operations/transfers/new', icon: ArrowLeftRight, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { label: 'Add Product', to: '/products/new', icon: Package, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
        ].map(a => (
          <Link key={a.label} to={a.to}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${a.color}`}>
            <a.icon size={16} />
            <span className="text-sm font-medium text-white">{a.label}</span>
          </Link>
        ))}
      </div>
    </AppLayout>
  )
}
