import { useState } from 'react'
import { User, Lock, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import AppLayout from '../../components/layout/AppLayout'
import { useAuth } from '../../context/AuthContext'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [pass, setPass] = useState({ current: '', newPass: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.put('/auth/me', form)
      setUser(data.user)
      toast.success('Profile updated')
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pass.newPass !== pass.confirm) { toast.error('Passwords do not match'); return }
    if (pass.newPass.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await api.put('/auth/update-password', { currentPassword: pass.current, newPassword: pass.newPass })
      toast.success('Password updated')
      setPass({ current: '', newPass: '', confirm: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <User size={20} className="text-brand-500" />
        <h1 className="text-xl font-bold text-white">My Profile</h1>
      </div>

      <div className="max-w-xl">
        {/* Avatar */}
        <div className="card mb-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center text-brand-500 text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold">{user?.name}</p>
            <p className="text-white/40 text-sm">{user?.email}</p>
            <span className="badge-blue mt-1 inline-block capitalize">{user?.role}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white/5 p-1 rounded-xl">
          {[{k:'profile', label:'Profile', icon: User}, {k:'password', label:'Password', icon: Lock}].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.k ? 'bg-brand-500 text-brand-900' : 'text-white/40 hover:text-white'}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <form onSubmit={handleProfileSave} className="card space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Full name</label>
              <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Email address</label>
              <input type="email" className="input-field opacity-60 cursor-not-allowed" value={form.email} readOnly />
              <p className="text-xs text-white/30 mt-1">Email cannot be changed.</p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save size={14} /> {loading ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={handlePasswordChange} className="card space-y-4">
            {[{label:'Current password', key:'current'}, {label:'New password', key:'newPass'}, {label:'Confirm new password', key:'confirm'}].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-white/60 mb-1.5">{f.label}</label>
                <input type="password" className="input-field" value={pass[f.key]}
                  onChange={e => setPass({ ...pass, [f.key]: e.target.value })} />
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Lock size={14} /> {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </AppLayout>
  )
}
