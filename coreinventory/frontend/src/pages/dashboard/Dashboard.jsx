import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, TrendingDown, AlertTriangle, ArrowDownToLine,
  ArrowUpFromLine, ArrowLeftRight, Clock
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid
} from 'recharts'
import api from '../../services/api'
import AppLayout from '../../components/layout/AppLayout'
import { useAuth } from '../../context/AuthContext'

const STATUS_BADGE = {
  done: 'badge-green', draft: 'badge-gray', waiting: 'badge-amber',
  ready: 'badge-blue', cancelled: 'badge-red',
}
const TYPE_ICON = {
  receipt: ArrowDownToLine, delivery: ArrowUpFromLine,
  transfer: ArrowLeftRight, adjustment: AlertTriangle,
}
const TYPE_COLOR = {
  receipt: 'text-emerald-400', delivery: 'text-amber-400',
  transfer: 'text-blue-400', adjustment: 'text-purple-400',
}
const TYPE_BG = {
  receipt: 'bg-emerald-500/10', delivery: 'bg-amber-500/10',
  transfer: 'bg-blue-500/10', adjustment: 'bg-purple-500/10',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f0f23] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
        <p className="text-white/50 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-sm">{payload[0].value} pending</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/operations/dashboard')
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const kpis = data ? [
    { label: 'Total Products', value: data.totalProducts, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', to: '/products' },
    { label: 'Low Stock', value: data.lowStock, icon: TrendingDown, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', to: '/products' },
    { label: 'Out of Stock', value: data.outOfStock, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', to: '/products' },
    { label: 'Pending Receipts', value: data.pendingReceipts, icon: ArrowDownToLine, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', to: '/operations/receipts' },
    { label: 'Pending Deliveries', value: data.pendingDeliveries, icon: ArrowUpFromLine, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', to: '/operations/deliveries' },
    { label: 'Pending Transfers', value: data.pendingTransfers, icon: ArrowLeftRight, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', to: '/operations/transfers' },
  ] : []

  const chartData = data ? [
    { name: 'Receipts', value: data.pendingReceipts, color: '#34d399' },
    { name: 'Deliveries', value: data.pendingDeliveries, color: '#f59e0b' },
    { name: 'Transfers', value: data.pendingTransfers, color: '#818cf8' },
    { name: 'Low Stock', value: data.lowStock, color: '#f87171' },
  ] : []

  const quickActions = [
    { label: 'New Receipt', to: '/operations/receipts', icon: ArrowDownToLine, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'New Delivery', to: '/operations/deliveries', icon: ArrowUpFromLine, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'New Transfer', to: '/operations/transfers', icon: ArrowLeftRight, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Add Product', to: '/products', icon: Package, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  ]

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 h-full">

        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white">
              {greeting}, <span className="text-brand-500">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-white/40 text-xs mt-0.5">Here's your inventory overview</p>
          </div>
          <div className="text-right">
            <p className="text-white/30 text-xs">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 shrink-0">
          {kpis.map((k) => (
            <button key={k.label} onClick={() => navigate(k.to)}
              className={`${k.bg} border ${k.border} rounded-xl p-3 flex flex-col gap-2 text-left hover:scale-[1.02] transition-all duration-200 cursor-pointer`}>
              <div className={`w-7 h-7 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon size={14} className={k.color} />
              </div>
              <div>
                <p className="text-xl font-bold text-white leading-none">{k.value ?? '—'}</p>
                <p className="text-white/40 text-xs mt-1 leading-tight">{k.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Middle row: Chart + Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-4 flex-1 min-h-0">

          {/* Chart */}
          <div className="card flex flex-col min-h-0">
            <h2 className="text-sm font-semibold text-white mb-3 shrink-0">Pending Overview</h2>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                    axisLine={false} tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity - compact, no scroll */}
          <div className="card lg:col-span-2 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
              <button onClick={() => navigate('/history')} className="text-xs text-brand-500 hover:text-brand-400 transition-colors">
                View all →
              </button>
            </div>
            {!data?.recentMoves?.length ? (
              <div className="flex-1 flex items-center justify-center text-white/30 text-sm">No recent activity</div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
                {data.recentMoves.slice(0, 6).map(move => {
                  const Icon = TYPE_ICON[move.type] || Clock
                  const color = TYPE_COLOR[move.type] || 'text-white/50'
                  const bg = TYPE_BG[move.type] || 'bg-white/5'
                  return (
                    <div key={move._id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
                      <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                        <Icon size={13} className={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-white font-medium font-mono">{move.reference}</p>
                          <span className={`${STATUS_BADGE[move.status] || 'badge-gray'} text-[10px] py-0 px-1.5`}>{move.status}</span>
                        </div>
                        <p className="text-xs text-white/30 truncate">{move.product?.name} · {move.quantity} {move.product?.unit}</p>
                      </div>
                      <p className="text-xs text-white/20 shrink-0">
                        {new Date(move.validatedAt || move.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - bottom row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
          {quickActions.map(a => (
            <button key={a.label} onClick={() => navigate(a.to)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${a.bg} ${a.border} hover:scale-[1.02] transition-all duration-200`}>
              <a.icon size={15} className={a.color} />
              <span className="text-sm font-medium text-white">{a.label}</span>
            </button>
          ))}
        </div>

      </div>
    </AppLayout>
  )
}