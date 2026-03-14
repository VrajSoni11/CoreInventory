import { useState, useEffect } from 'react'
import { Settings, Plus, Warehouse } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import AppLayout from '../../components/layout/AppLayout'

export default function SettingsPage() {
  const [warehouses, setWarehouses] = useState([])
  const [form, setForm] = useState({ name: '', code: '', address: '' })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetchWarehouses = async () => {
    try { const { data } = await api.get('/warehouses'); setWarehouses(data.data) } catch {}
  }

  useEffect(() => { fetchWarehouses() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name || !form.code) { toast.error('Name and code required'); return }
    setLoading(true)
    try {
      await api.post('/warehouses', form)
      toast.success('Warehouse created')
      setForm({ name: '', code: '', address: '' })
      setShowForm(false)
      fetchWarehouses()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <Settings size={20} className="text-brand-500" />
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      <div className="max-w-2xl">
        {/* Warehouses */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Warehouse size={16} className="text-white/50" />
              <h2 className="text-sm font-semibold text-white">Warehouses & Locations</h2>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary py-1.5 px-3 flex items-center gap-1.5 text-xs">
              <Plus size={13} /> Add Warehouse
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="space-y-3 mb-4 p-4 bg-white/5 rounded-xl">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Name *</label>
                  <input className="input-field" placeholder="Main Warehouse" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Code *</label>
                  <input className="input-field font-mono" placeholder="WH-001" value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-white/50 mb-1">Address</label>
                  <input className="input-field" placeholder="Optional address" value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-2">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-2">{loading ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {warehouses.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-4">No warehouses yet</p>
            ) : warehouses.map(w => (
              <div key={w._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Warehouse size={14} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{w.name}</p>
                    <p className="text-xs text-white/30">{w.address || 'No address'}</p>
                  </div>
                </div>
                <span className="font-mono text-xs text-brand-500 bg-brand-500/10 px-2 py-1 rounded-lg">{w.code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
