import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Package, AlertTriangle, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import AppLayout from '../../components/layout/AppLayout'

const UNITS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'carton', 'meter', 'set']
const CATEGORIES = ['Electronics', 'Furniture', 'Steel', 'Chemicals', 'Packaging', 'Tools', 'Other']

function ProductModal({ product, onClose, onSave }) {
  const isEdit = !!product?._id
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || '',
    unit: product?.unit || 'pcs',
    description: product?.description || '',
    reorderThreshold: product?.reorderThreshold || 10,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.sku || !form.category) { toast.error('Fill all required fields'); return }
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/products/${product._id}`, form)
        toast.success('Product updated')
      } else {
        await api.post('/products', form)
        toast.success('Product created')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f0f23] border border-white/10 rounded-2xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-white font-semibold">{isEdit ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/60 mb-1.5">Product Name *</label>
              <input className="input-field" placeholder="e.g. Steel Rod 10mm" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">SKU / Code *</label>
              <input className="input-field font-mono" placeholder="e.g. STL-001" value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Unit *</label>
              <select className="input-field" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Category *</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Reorder threshold
                <span className="text-white/30 font-normal ml-1">(alert when stock drops below this)</span>
              </label>
              <input type="number" min="0" className="input-field" value={form.reorderThreshold}
                onChange={e => setForm({ ...form, reorderThreshold: +e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/60 mb-1.5">Description</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Optional notes..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [modal, setModal] = useState(null) // null | 'new' | product object

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (category) params.category = category
      const { data } = await api.get('/products', { params })
      setProducts(data.data)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }, [search, category])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Products</h1>
          <p className="text-white/40 text-sm mt-0.5">Manage your product catalog</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input className="input-field pl-10" placeholder="Search by name or SKU..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Product', 'SKU', 'Category', 'Unit', 'Total Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-white/30 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-white/30 text-sm">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Package size={32} className="mx-auto text-white/10 mb-2" />
                  <p className="text-white/30 text-sm">No products found</p>
                </td></tr>
              ) : products.map(p => {
                const isLow = p.reorderThreshold > 0 && p.totalStock <= p.reorderThreshold && p.totalStock > 0
                const isOut = p.totalStock === 0 && p.stockLocations.length > 0
                return (
                  <tr key={p._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center">
                          <Package size={14} className="text-brand-500" />
                        </div>
                        <span className="text-sm text-white font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/50">{p.sku}</td>
                    <td className="px-4 py-3 text-sm text-white/60">{p.category}</td>
                    <td className="px-4 py-3 text-sm text-white/60">{p.unit}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{p.totalStock}</td>
                    <td className="px-4 py-3">
                      {p.totalStock === 0 && p.stockLocations.length === 0 ? <span className="badge-gray">New — no stock</span> : isOut ? <span className="badge-red flex items-center gap-1 w-fit"><AlertTriangle size={10} />Out of stock</span>
                        : isLow ? <span className="badge-amber flex items-center gap-1 w-fit"><AlertTriangle size={10} />Low stock</span>
                        : <span className="badge-green">In stock</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setModal(p)} className="text-white/30 hover:text-brand-500 transition-colors p-1.5 rounded-lg hover:bg-brand-500/10">
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchProducts() }}
        />
      )}
    </AppLayout>
  )
}