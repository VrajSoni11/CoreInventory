import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, CheckCircle, XCircle, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, AlertTriangle, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import AppLayout from '../../components/layout/AppLayout'

const TYPE_CONFIG = {
  receipts:    { label: 'Receipts',    api: 'receipt',    icon: ArrowDownToLine, color: 'text-emerald-400', title: 'Incoming Goods' },
  deliveries:  { label: 'Deliveries',  api: 'delivery',   icon: ArrowUpFromLine, color: 'text-amber-400',   title: 'Outgoing Goods' },
  transfers:   { label: 'Transfers',   api: 'transfer',   icon: ArrowLeftRight,  color: 'text-blue-400',    title: 'Internal Transfers' },
  adjustments: { label: 'Adjustments', api: 'adjustment', icon: AlertTriangle,   color: 'text-purple-400',  title: 'Stock Adjustments' },
}

const STATUS_BADGE = {
  done: 'badge-green', draft: 'badge-gray', waiting: 'badge-amber',
  ready: 'badge-blue', cancelled: 'badge-red',
}
const generateReceiptPDF = (move, type) => {
  const isReceipt = type === 'receipts'
  const isDelivery = type === 'deliveries'
  const isTransfer = type === 'transfers'
  const isAdjustment = type === 'adjustments'
  const typeLabel = isReceipt ? 'GOODS RECEIPT' : isDelivery ? 'DELIVERY ORDER' : isTransfer ? 'TRANSFER ORDER' : 'STOCK ADJUSTMENT'
  const color = isReceipt ? '#10b981' : isDelivery ? '#f59e0b' : isTransfer ? '#3b82f6' : '#a855f7'
  const date = new Date(move.validatedAt || move.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const time = new Date(move.validatedAt || move.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${move.reference} - CoreInventory</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid ${color}; }
    .brand { font-size: 24px; font-weight: 800; color: #1a1a2e; }
    .brand span { color: #e8c547; }
    .brand-sub { font-size: 11px; color: #888; margin-top: 2px; }
    .doc-type { text-align: right; }
    .doc-type h2 { font-size: 20px; font-weight: 700; color: ${color}; letter-spacing: 1px; }
    .doc-type .ref { font-size: 13px; color: #555; margin-top: 4px; font-family: monospace; }
    .doc-type .status { display: inline-block; margin-top: 6px; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: ${move.status === 'done' ? '#d1fae5' : '#fee2e2'}; color: ${move.status === 'done' ? '#065f46' : '#991b1b'}; text-transform: uppercase; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .info-box { background: #f8f9fa; border-radius: 10px; padding: 16px; border-left: 4px solid ${color}; }
    .info-box h4 { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
    .info-row .label { color: #666; }
    .info-row .value { font-weight: 600; color: #1a1a2e; text-align: right; }
    .table-section h3 { font-size: 13px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    thead tr { background: ${color}15; }
    th { padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; color: ${color}; font-weight: 700; letter-spacing: 0.5px; border-bottom: 2px solid ${color}30; }
    td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
    .qty-cell { font-weight: 700; font-size: 15px; color: ${color}; }
    .note-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 28px; font-size: 13px; color: #78350f; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
    .sig-box { text-align: center; }
    .sig-line { border-top: 1px solid #ccc; margin-top: 40px; padding-top: 8px; font-size: 11px; color: #888; }
    .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #f0f0f0; font-size: 11px; color: #aaa; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Core<span>Inventory</span></div>
      <div class="brand-sub">Inventory Management System</div>
    </div>
    <div class="doc-type">
      <h2>${typeLabel}</h2>
      <div class="ref">${move.reference}</div>
      <div class="status">${move.status}</div>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-box">
      <h4>Document Details</h4>
      <div class="info-row"><span class="label">Date</span><span class="value">${date}</span></div>
      <div class="info-row"><span class="label">Time</span><span class="value">${time}</span></div>
      <div class="info-row"><span class="label">Created by</span><span class="value">${move.createdBy ? move.createdBy.name : '—'}</span></div>
      ${move.validatedBy ? '<div class="info-row"><span class="label">Validated by</span><span class="value">' + (move.validatedBy.name || '—') + '</span></div>' : ''}
    </div>
    <div class="info-box">
      <h4>${isReceipt ? 'Supplier Info' : isDelivery ? 'Customer Info' : isTransfer ? 'Transfer Info' : 'Adjustment Info'}</h4>
      ${isReceipt ? '<div class="info-row"><span class="label">Vendor</span><span class="value">' + (move.vendor || '—') + '</span></div><div class="info-row"><span class="label">To Warehouse</span><span class="value">' + (move.toWarehouse ? move.toWarehouse.name : '—') + '</span></div><div class="info-row"><span class="label">Location</span><span class="value">' + (move.toLocation || 'Main') + '</span></div>' : ''}
      ${isDelivery ? '<div class="info-row"><span class="label">Customer</span><span class="value">' + (move.customer || '—') + '</span></div><div class="info-row"><span class="label">From Warehouse</span><span class="value">' + (move.fromWarehouse ? move.fromWarehouse.name : '—') + '</span></div><div class="info-row"><span class="label">Location</span><span class="value">' + (move.fromLocation || 'Main') + '</span></div>' : ''}
      ${isTransfer ? '<div class="info-row"><span class="label">From</span><span class="value">' + (move.fromWarehouse ? move.fromWarehouse.name : '—') + ' / ' + (move.fromLocation || 'Main') + '</span></div><div class="info-row"><span class="label">To</span><span class="value">' + (move.toWarehouse ? move.toWarehouse.name : '—') + ' / ' + (move.toLocation || 'Main') + '</span></div>' : ''}
      ${isAdjustment ? '<div class="info-row"><span class="label">Warehouse</span><span class="value">' + (move.toWarehouse ? move.toWarehouse.name : '—') + '</span></div><div class="info-row"><span class="label">Variance</span><span class="value">' + ((move.variance >= 0 ? '+' : '') + (move.variance || 0)) + '</span></div>' : ''}
    </div>
  </div>
  <div class="table-section">
    <h3>Items</h3>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Product Name</th><th>SKU</th><th>Unit</th><th>Quantity</th>
          ${isAdjustment ? '<th>Physical Count</th>' : ''}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td><strong>${move.product ? move.product.name : '—'}</strong></td>
          <td style="font-family:monospace;font-size:12px;color:#888">${move.product ? move.product.sku : '—'}</td>
          <td>${move.product ? move.product.unit : '—'}</td>
          <td class="qty-cell">${move.quantity}</td>
          ${isAdjustment ? '<td class="qty-cell">' + (move.countedQuantity != null ? move.countedQuantity : '—') + '</td>' : ''}
        </tr>
      </tbody>
    </table>
  </div>
  ${move.note ? '<div class="note-box"><strong>Note:</strong> ' + move.note + '</div>' : ''}
  <div class="signatures">
    <div class="sig-box"><div class="sig-line">Prepared By</div></div>
    <div class="sig-box"><div class="sig-line">Checked By</div></div>
    <div class="sig-box"><div class="sig-line">Authorized By</div></div>
  </div>
  <div class="footer">System-generated document &bull; CoreInventory &bull; ${move.reference} &bull; ${date}</div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  win.document.write(html)
  win.document.close()
}


function OperationModal({ type, onClose, onSave }) {
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [stockLocations, setStockLocations] = useState([]) // actual stock locations for selected product
  const [availableQty, setAvailableQty] = useState(null)
  const [form, setForm] = useState({
    product: '', quantity: '', vendor: '', customer: '',
    fromWarehouse: '', toWarehouse: '',
    fromLocation: '', toLocation: '',
    countedQuantity: '', note: '',
  })
  const [loading, setLoading] = useState(false)

  // Load products and warehouses on mount
  useEffect(() => {
    Promise.all([api.get('/products'), api.get('/warehouses')]).then(([p, w]) => {
      setProducts(p.data.data)
      setWarehouses(w.data.data)
    })
  }, [])

  // When product changes, load its stock locations from DB
  useEffect(() => {
    if (!form.product) { setStockLocations([]); setAvailableQty(null); return }
    api.get('/stock').then(res => {
      const locations = res.data.data.filter(s => s.product._id === form.product && s.quantity > 0)
      setStockLocations(locations)
    }).catch(() => {})
  }, [form.product])

  // When fromWarehouse + fromLocation changes, show available qty
  useEffect(() => {
    if (!form.product || !form.fromWarehouse) { setAvailableQty(null); return }
    const match = stockLocations.find(
      s => s.warehouse._id === form.fromWarehouse && s.locationName === form.fromLocation
    )
    setAvailableQty(match ? match.quantity : 0)
  }, [form.fromWarehouse, form.fromLocation, stockLocations, form.product])

  // Auto-fill fromLocation when a stock location is selected
  const handleFromWarehouseChange = (warehouseId) => {
    const match = stockLocations.find(s => s.warehouse._id === warehouseId)
    setForm(prev => ({
      ...prev,
      fromWarehouse: warehouseId,
      fromLocation: match ? match.locationName : '',
    }))
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.product) { toast.error('Select a product'); return }
    if (!form.quantity || +form.quantity <= 0) { toast.error('Enter a valid quantity'); return }

    // Validations per type
    if (type === 'receipt' && !form.toWarehouse) { toast.error('Select destination warehouse'); return }
    if (type === 'delivery' && !form.fromWarehouse) { toast.error('Select source warehouse'); return }
    if (type === 'transfer' && (!form.fromWarehouse || !form.toWarehouse)) { toast.error('Select both source and destination warehouses'); return }
    if (type === 'adjustment' && !form.toWarehouse) { toast.error('Select warehouse'); return }
    if (type === 'adjustment' && form.countedQuantity === '') { toast.error('Enter physical count quantity'); return }

    setLoading(true)
    try {
      const payload = {
        type,
        product: form.product,
        quantity: +form.quantity,
        note: form.note,
      }

      if (type === 'receipt') {
        payload.toWarehouse = form.toWarehouse
        payload.toLocation = form.toLocation || 'Main'
        payload.vendor = form.vendor
      }
      if (type === 'delivery') {
        payload.fromWarehouse = form.fromWarehouse
        payload.fromLocation = form.fromLocation || 'Main'
        payload.customer = form.customer
      }
      if (type === 'transfer') {
        payload.fromWarehouse = form.fromWarehouse
        payload.fromLocation = form.fromLocation || 'Main'
        payload.toWarehouse = form.toWarehouse
        payload.toLocation = form.toLocation || 'Main'
      }
      if (type === 'adjustment') {
        payload.toWarehouse = form.toWarehouse
        payload.toLocation = form.toLocation || 'Main'
        payload.countedQuantity = +form.countedQuantity
      }

      await api.post('/operations', payload)
      toast.success('Operation created successfully!')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating operation')
    } finally {
      setLoading(false)
    }
  }

  // Warehouses that have stock for selected product (for from-warehouse dropdowns)
  const warehousesWithStock = warehouses.filter(w =>
    stockLocations.some(s => s.warehouse._id === w._id)
  )

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f0f23] border border-white/10 rounded-2xl w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-[#0f0f23] z-10">
          <h2 className="text-white font-semibold">
            New {TYPE_CONFIG[type + 's']?.label?.slice(0, -1) || type}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Product */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Product *</label>
            <select className="input-field" value={form.product} onChange={e => f('product', e.target.value)}>
              <option value="">Select product</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>

          {/* Show current stock info if product selected */}
          {form.product && stockLocations.length > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-xs text-emerald-400 font-medium mb-1">Current stock locations:</p>
              {stockLocations.map((s, i) => (
                <p key={i} className="text-xs text-white/60">
                  📦 <span className="text-white">{s.warehouse.name}</span> →{' '}
                  <span className="text-white">{s.locationName}</span>:{' '}
                  <span className="text-emerald-400 font-bold">{s.quantity}</span> units
                </p>
              ))}
            </div>
          )}

          {form.product && stockLocations.length === 0 && (type === 'delivery' || type === 'transfer') && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              <p className="text-xs text-red-400">⚠️ No stock available for this product. Create a Receipt first.</p>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Quantity *
              {availableQty !== null && (
                <span className="text-white/30 font-normal ml-2">
                  (Available: <span className={availableQty === 0 ? 'text-red-400' : 'text-emerald-400'}>{availableQty}</span>)
                </span>
              )}
            </label>
            <input
              type="number" min="0.001" step="any" className="input-field" placeholder="0"
              value={form.quantity} onChange={e => f('quantity', e.target.value)}
            />
          </div>

          {/* RECEIPT: To warehouse + location */}
          {type === 'receipt' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Destination warehouse *</label>
                  <select className="input-field" value={form.toWarehouse} onChange={e => f('toWarehouse', e.target.value)}>
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Location</label>
                  <input className="input-field" placeholder="e.g. Rack A, Main" value={form.toLocation}
                    onChange={e => f('toLocation', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Vendor / Supplier</label>
                <input className="input-field" placeholder="Supplier name (optional)" value={form.vendor}
                  onChange={e => f('vendor', e.target.value)} />
              </div>
            </>
          )}

          {/* DELIVERY: From warehouse + location */}
          {type === 'delivery' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">From warehouse *</label>
                  <select className="input-field" value={form.fromWarehouse}
                    onChange={e => handleFromWarehouseChange(e.target.value)}>
                    <option value="">Select warehouse</option>
                    {(warehousesWithStock.length > 0 ? warehousesWithStock : warehouses).map(w => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Location</label>
                  <input className="input-field" placeholder="e.g. Main" value={form.fromLocation}
                    onChange={e => f('fromLocation', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Customer</label>
                <input className="input-field" placeholder="Customer name (optional)" value={form.customer}
                  onChange={e => f('customer', e.target.value)} />
              </div>
            </>
          )}

          {/* TRANSFER: From + To */}
          {type === 'transfer' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">From warehouse *</label>
                  <select className="input-field" value={form.fromWarehouse}
                    onChange={e => handleFromWarehouseChange(e.target.value)}>
                    <option value="">Select warehouse</option>
                    {(warehousesWithStock.length > 0 ? warehousesWithStock : warehouses).map(w => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">From location</label>
                  <input className="input-field" placeholder="Auto-filled" value={form.fromLocation}
                    onChange={e => f('fromLocation', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">To warehouse *</label>
                  <select className="input-field" value={form.toWarehouse} onChange={e => f('toWarehouse', e.target.value)}>
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">To location</label>
                  <input className="input-field" placeholder="e.g. Rack B" value={form.toLocation}
                    onChange={e => f('toLocation', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* ADJUSTMENT: Warehouse + physical count */}
          {type === 'adjustment' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Warehouse *</label>
                  <select className="input-field" value={form.toWarehouse}
                    onChange={e => handleFromWarehouseChange(e.target.value) || f('toWarehouse', e.target.value)}>
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Location</label>
                  <input className="input-field" placeholder="Auto-filled" value={form.toLocation || form.fromLocation}
                    onChange={e => f('toLocation', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">
                  Physical count quantity *
                  <span className="text-white/30 font-normal ml-1">(what you actually counted)</span>
                </label>
                <input type="number" min="0" className="input-field" placeholder="Actual quantity on shelf"
                  value={form.countedQuantity} onChange={e => f('countedQuantity', e.target.value)} />
              </div>
            </>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Note (optional)</label>
            <textarea className="input-field resize-none" rows={2} placeholder="Any notes..."
              value={form.note} onChange={e => f('note', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Operations() {
  const { type } = useParams()
  const config = TYPE_CONFIG[type]
  const [moves, setMoves] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [status, setStatus] = useState('')

  const apiType = config?.api

  const fetchMoves = useCallback(async () => {
    if (!apiType) return
    setLoading(true)
    try {
      const params = { type: apiType }
      if (status) params.status = status
      const { data } = await api.get('/operations', { params })
      setMoves(data.data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [apiType, status])

  useEffect(() => { fetchMoves() }, [fetchMoves])

  const handleValidate = async (id) => {
    try {
      const { data } = await api.put(`/operations/${id}/validate`)
      toast.success(`Validated! ${data.totalStock !== undefined ? `Total stock: ${data.totalStock}` : ''}`)
      fetchMoves()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Validation failed')
    }
  }

  const handleCancel = async (id) => {
    try {
      await api.put(`/operations/${id}/cancel`)
      toast.success('Operation cancelled')
      fetchMoves()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  if (!config) return (
    <AppLayout>
      <div className="text-white/40 text-center py-20">Invalid operation type</div>
    </AppLayout>
  )

  const Icon = config.icon

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Icon size={18} className={config.color} />
            <h1 className="text-xl font-bold text-white">{config.label}</h1>
          </div>
          <p className="text-white/40 text-sm">{config.title}</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New {config.label.slice(0, -1)}
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'draft', 'waiting', 'ready', 'done', 'cancelled'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              status === s ? 'bg-brand-500 text-brand-900' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Reference', 'Product', 'Quantity',
                  ...(type === 'receipts' ? ['Vendor', 'To Warehouse'] :
                     type === 'deliveries' ? ['Customer', 'From Warehouse'] :
                     type === 'transfers' ? ['From', 'To'] :
                     ['Warehouse']),
                  'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-white/30 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-white/30 text-sm">Loading...</td></tr>
              ) : moves.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12">
                  <Icon size={32} className="mx-auto text-white/10 mb-2" />
                  <p className="text-white/30 text-sm">No {type} found</p>
                </td></tr>
              ) : moves.map(m => (
                <tr key={m._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-brand-500 font-medium">{m.reference}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white">{m.product?.name}</p>
                    <p className="text-xs text-white/30">{m.product?.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-medium">
                    {m.quantity} <span className="text-white/30 text-xs">{m.product?.unit}</span>
                  </td>
                  {type === 'receipts' && <>
                    <td className="px-4 py-3 text-sm text-white/60">{m.vendor || '—'}</td>
                    <td className="px-4 py-3 text-xs text-white/50">{m.toWarehouse?.name} / {m.toLocation}</td>
                  </>}
                  {type === 'deliveries' && <>
                    <td className="px-4 py-3 text-sm text-white/60">{m.customer || '—'}</td>
                    <td className="px-4 py-3 text-xs text-white/50">{m.fromWarehouse?.name} / {m.fromLocation}</td>
                  </>}
                  {type === 'transfers' && <>
                    <td className="px-4 py-3 text-xs text-white/50">{m.fromWarehouse?.name} / {m.fromLocation}</td>
                    <td className="px-4 py-3 text-xs text-white/50">{m.toWarehouse?.name} / {m.toLocation}</td>
                  </>}
                  {type === 'adjustments' && <>
                    <td className="px-4 py-3 text-xs text-white/50">{m.toWarehouse?.name} / {m.toLocation}</td>
                  </>}
                  <td className="px-4 py-3">
                    <span className={STATUS_BADGE[m.status] || 'badge-gray'}>{m.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/30">{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 items-center">
                      {m.status !== 'done' && m.status !== 'cancelled' && (
                        <button onClick={() => handleValidate(m._id)}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Validate">
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {m.status !== 'done' && m.status !== 'cancelled' && (
                        <button onClick={() => handleCancel(m._id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Cancel">
                          <XCircle size={15} />
                        </button>
                      )}
                      {(m.status === 'done' || m.status === 'cancelled') && (
                        <button onClick={() => generateReceiptPDF(m, type)}
                          className="p-1.5 text-brand-500 hover:bg-brand-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium px-2" title="Download Receipt">
                          <Download size={13} /> PDF
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <OperationModal
          type={apiType}
          onClose={() => setModal(false)}
          onSave={() => { setModal(false); fetchMoves() }}
        />
      )}
    </AppLayout>
  )
}