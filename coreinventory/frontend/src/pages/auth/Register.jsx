import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim() || form.name.length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email) e.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500/10 border border-brand-500/30 rounded-2xl mb-4">
            <Package className="w-7 h-7 text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Core<span className="text-brand-500">Inventory</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">Create your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Full name</label>
              <input
                type="text"
                className={`input-field ${errors.name ? 'border-red-500/60' : ''}`}
                placeholder="John Doe"
                value={form.name}
                onChange={set('name')}
                autoComplete="name"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Email address</label>
              <input
                type="email"
                className={`input-field ${errors.email ? 'border-red-500/60' : ''}`}
                placeholder="you@company.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input-field pr-11 ${errors.password ? 'border-red-500/60' : ''}`}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Confirm password</label>
              <input
                type={showPass ? 'text' : 'password'}
                className={`input-field ${errors.confirm ? 'border-red-500/60' : ''}`}
                placeholder="Repeat password"
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
              />
              {errors.confirm && <p className="text-red-400 text-xs mt-1.5">{errors.confirm}</p>}
            </div>

            {/* Password strength */}
            {form.password && (
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    form.password.length >= i * 3
                      ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-amber-500' : i <= 3 ? 'bg-yellow-400' : 'bg-emerald-500'
                      : 'bg-white/10'
                  }`} />
                ))}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 !mt-6">
              {loading
                ? <div className="w-4 h-4 border-2 border-brand-900/40 border-t-brand-900 rounded-full animate-spin" />
                : <UserPlus size={16} />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-400 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}