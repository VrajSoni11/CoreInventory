import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts'
import { TrendingUp, Package, ArrowDownToLine, ArrowUpFromLine, BarChart2 } from 'lucide-react'
import api from '../../services/api'
import AppLayout from '../../components/layout/AppLayout'

const COLORS = ['#e8c547', '#34d399', '#818cf8', '#f87171', '#f59e0b', '#06b6d4', '#a855f7', '#ec4899']
const STATUS_COLORS = ['#34d399', '#f87171', '#6b7280']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#0d0d1f',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '8px 12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        minWidth: 100,
      }}>
        {label && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || '#e8c547', fontSize: 13, fontWeight: 600, margin: '2px 0' }}>
            {p.name}: <span style={{ color: '#fff' }}>{p.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const R = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  return (
    <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function Analysis() {
  const [moves, setMoves] = useState([])
  const [stocks, setStocks] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/operations?limit=200'),
      api.get('/stock'),
      api.get('/products?limit=100'),
    ]).then(([m, s, p]) => {
      setMoves(m.data.data || [])
      setStocks(s.data.data || [])
      setProducts(p.data.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  // Stock by product
  const stockMap = {}
  stocks.forEach(s => {
    const name = s.product?.name || 'Unknown'
    stockMap[name] = (stockMap[name] || 0) + s.quantity
  })
  const stockByProduct = Object.entries(stockMap)
    .map(([name, qty]) => ({ name: name.length > 14 ? name.slice(0, 13) + '…' : name, qty }))
    .sort((a, b) => b.qty - a.qty)

  // Monthly trend (last 6 months)
  const monthTrend = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1)
    const key = d.toLocaleString('default', { month: 'short' })
    monthTrend[key] = { month: key, receipts: 0, deliveries: 0, transfers: 0 }
  }
  moves.forEach(m => {
    const key = new Date(m.createdAt).toLocaleString('default', { month: 'short' })
    if (monthTrend[key]) {
      if (m.type === 'receipt') monthTrend[key].receipts++
      if (m.type === 'delivery') monthTrend[key].deliveries++
      if (m.type === 'transfer') monthTrend[key].transfers++
    }
  })
  const trendData = Object.values(monthTrend)

  // Most delivered
  const deliveryMap = {}
  moves.filter(m => m.type === 'delivery' && m.status === 'done').forEach(m => {
    const name = m.product?.name || 'Unknown'
    deliveryMap[name] = (deliveryMap[name] || 0) + m.quantity
  })
  const topDelivered = Object.entries(deliveryMap)
    .map(([name, qty]) => ({ name: name.length > 14 ? name.slice(0, 13) + '…' : name, qty }))
    .sort((a, b) => b.qty - a.qty).slice(0, 6)

  // Most received
  const receiptMap = {}
  moves.filter(m => m.type === 'receipt' && m.status === 'done').forEach(m => {
    const name = m.product?.name || 'Unknown'
    receiptMap[name] = (receiptMap[name] || 0) + m.quantity
  })
  const topReceived = Object.entries(receiptMap)
    .map(([name, qty]) => ({ name: name.length > 14 ? name.slice(0, 13) + '…' : name, qty }))
    .sort((a, b) => b.qty - a.qty).slice(0, 6)

  // Operation type pie
  const typeCounts = { Receipt: 0, Delivery: 0, Transfer: 0, Adjustment: 0 }
  moves.forEach(m => {
    if (m.type === 'receipt') typeCounts.Receipt++
    if (m.type === 'delivery') typeCounts.Delivery++
    if (m.type === 'transfer') typeCounts.Transfer++
    if (m.type === 'adjustment') typeCounts.Adjustment++
  })
  const typePieData = Object.entries(typeCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))

  // Stock status pie
  const stockedIds = new Set(stocks.map(s => s.product?._id?.toString()))
  const inStock = products.filter(p => stockedIds.has(p._id?.toString()) && (stockMap[p.name] || 0) > 0).length
  const outOfStock = products.filter(p => stockedIds.has(p._id?.toString()) && (stockMap[p.name] || 0) === 0).length
  const neverReceived = products.length - inStock - outOfStock
  const statusPieData = [
    { name: 'In Stock', value: inStock },
    { name: 'Out of Stock', value: outOfStock },
    { name: 'Never Received', value: neverReceived },
  ].filter(d => d.value > 0)

  // Daily activity (14 days)
  const dailyMap = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    dailyMap[key] = { day: key, count: 0 }
  }
  moves.forEach(m => {
    const key = new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    if (dailyMap[key]) dailyMap[key].count++
  })
  const dailyData = Object.values(dailyMap)

  const totalStockQty = Object.values(stockMap).reduce((a, b) => a + b, 0)

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  )

  const Card = ({ children, className = '', height }) => (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 ${className}`} style={height ? { height } : {}}>
      {children}
    </div>
  )

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto flex flex-col gap-4 pb-4">

        {/* Header */}
        <div className="flex items-center gap-2 shrink-0">
          <BarChart2 size={18} className="text-brand-500" />
          <div>
            <h1 className="text-xl font-bold text-white">Analysis</h1>
            <p className="text-white/40 text-xs">Inventory analytics and trends</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          {[
            { label: 'Total Operations', value: moves.length, icon: BarChart2, color: 'text-brand-500', bg: 'bg-brand-500/10 border-brand-500/20' },
            { label: 'Completed', value: moves.filter(m => m.status === 'done').length, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Total Products', value: products.length, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Total Stock Units', value: totalStockQty.toLocaleString(), icon: ArrowDownToLine, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-xl p-3 flex items-center gap-3`}>
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon size={15} className={s.color} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-white/40 text-xs leading-tight">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Row 1: Area trend + Operation pie */}
        <div className="grid lg:grid-cols-3 gap-4 shrink-0">
          <Card className="lg:col-span-2" height={230}>
            <h3 className="text-sm font-semibold text-white mb-3">Monthly Operations Trend</h3>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={trendData} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  {[['gR','#34d399'],['gD','#f59e0b'],['gT','#818cf8']].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none" }} />
                <Area type="monotone" dataKey="receipts" name="Receipts" stroke="#34d399" fill="url(#gR)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="deliveries" name="Deliveries" stroke="#f59e0b" fill="url(#gD)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="transfers" name="Transfers" stroke="#818cf8" fill="url(#gT)" strokeWidth={2} dot={false} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card height={230}>
            <h3 className="text-sm font-semibold text-white mb-2">Operation Types</h3>
            {typePieData.length === 0
              ? <div className="flex items-center justify-center h-4/5 text-white/30 text-sm">No data yet</div>
              : <ResponsiveContainer width="100%" height="88%">
                  <PieChart>
                    <Pie data={typePieData} cx="50%" cy="45%" outerRadius={70} dataKey="value" labelLine={false} label={PieLabel}>
                      {typePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none" }} />
                    <Legend wrapperStyle={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }} />
                  </PieChart>
                </ResponsiveContainer>
            }
          </Card>
        </div>

        {/* Row 2: Remaining stock bar + Stock status donut */}
        <div className="grid lg:grid-cols-3 gap-4 shrink-0">
          <Card className="lg:col-span-2" height={230}>
            <h3 className="text-sm font-semibold text-white mb-3">Remaining Stock by Product</h3>
            {stockByProduct.length === 0
              ? <div className="flex items-center justify-center h-4/5 text-white/30 text-sm">No stock data</div>
              : <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={stockByProduct} margin={{ left: -20, right: 4, top: 4, bottom: 0 }} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none" }} />
                    <Bar dataKey="qty" name="Stock" radius={[6, 6, 0, 0]}>
                      {stockByProduct.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            }
          </Card>

          <Card height={230}>
            <h3 className="text-sm font-semibold text-white mb-2">Stock Status</h3>
            {statusPieData.length === 0
              ? <div className="flex items-center justify-center h-4/5 text-white/30 text-sm">No products</div>
              : <ResponsiveContainer width="100%" height="88%">
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="45%" innerRadius={40} outerRadius={70} dataKey="value" labelLine={false} label={PieLabel}>
                      {statusPieData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none" }} />
                    <Legend wrapperStyle={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }} />
                  </PieChart>
                </ResponsiveContainer>
            }
          </Card>
        </div>

        {/* Row 3: Most delivered + Most received (horizontal bars) */}
        <div className="grid lg:grid-cols-2 gap-4 shrink-0">
          <Card height={210}>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpFromLine size={13} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Most Delivered Products</h3>
            </div>
            {topDelivered.length === 0
              ? <div className="flex items-center justify-center h-4/5 text-white/30 text-sm">No deliveries yet</div>
              : <ResponsiveContainer width="100%" height="82%">
                  <BarChart data={topDelivered} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }} barSize={12}>
                    <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none" }} />
                    <Bar dataKey="qty" name="Qty Delivered" radius={[0, 6, 6, 0]} fill="#f59e0b" fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </Card>

          <Card height={210}>
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownToLine size={13} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Most Received Products</h3>
            </div>
            {topReceived.length === 0
              ? <div className="flex items-center justify-center h-4/5 text-white/30 text-sm">No receipts yet</div>
              : <ResponsiveContainer width="100%" height="82%">
                  <BarChart data={topReceived} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }} barSize={12}>
                    <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none" }} />
                    <Bar dataKey="qty" name="Qty Received" radius={[0, 6, 6, 0]} fill="#34d399" fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </Card>
        </div>

        {/* Row 4: Daily activity line */}
        <Card className="shrink-0" height={190}>
          <h3 className="text-sm font-semibold text-white mb-3">Daily Activity — Last 14 Days</h3>
          <ResponsiveContainer width="100%" height="82%">
            <LineChart data={dailyData} margin={{ left: -20, right: 10, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none" }} />
              <Line type="monotone" dataKey="count" name="Operations" stroke="#e8c547" strokeWidth={2.5} dot={{ fill: '#e8c547', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#e8c547' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

      </div>
    </AppLayout>
  )
}