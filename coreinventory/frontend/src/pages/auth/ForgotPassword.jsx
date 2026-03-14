import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, Package, Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const STEPS = { EMAIL: 1, OTP: 2, RESET: 3, DONE: 4 }

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(STEPS.EMAIL)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const otpRefs = useRef([])

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault()
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Enter a valid email'); return
    }
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      toast.success('OTP sent to your email!')
      setStep(STEPS.OTP)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  // OTP input handlers
  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && i > 0) otpRefs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) { toast.error('Enter all 6 digits'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: code })
      setResetToken(data.resetToken)
      toast.success('OTP verified!')
      setStep(STEPS.RESET)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  // Step 3: Reset password
  const handleReset = async (e) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email, resetToken, newPassword: password })
      setStep(STEPS.DONE)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500/10 border border-brand-500/30 rounded-2xl mb-4">
            <Package className="w-7 h-7 text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Core<span className="text-brand-500">Inventory</span></h1>
        </div>

        <div className="card">
          {/* Progress dots */}
          {step < STEPS.DONE && (
            <div className="flex gap-2 justify-center mb-6">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'bg-brand-500 w-8' : 'bg-white/10 w-4'}`} />
              ))}
            </div>
          )}

          {/* Step 1: Email */}
          {step === STEPS.EMAIL && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Forgot your password?</h2>
                <p className="text-white/40 text-sm">Enter your email and we'll send you a 6-digit OTP.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input type="email" className="input-field pl-10" placeholder="you@company.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-brand-900/40 border-t-brand-900 rounded-full animate-spin" /> : null}
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Check your email</h2>
                <p className="text-white/40 text-sm">We sent a 6-digit code to <span className="text-brand-500">{email}</span></p>
              </div>
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-xl font-bold font-mono rounded-xl border transition-all duration-200 bg-white/5 text-white focus:outline-none focus:ring-1
                      ${digit ? 'border-brand-500 focus:border-brand-500 focus:ring-brand-500' : 'border-white/10 focus:border-brand-500 focus:ring-brand-500'}`}
                  />
                ))}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-brand-900/40 border-t-brand-900 rounded-full animate-spin" /> : null}
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button type="button" onClick={() => { setStep(STEPS.EMAIL); setOtp(['','','','','','']) }}
                className="w-full text-center text-sm text-white/40 hover:text-white/60 transition-colors">
                Didn't receive? Resend
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === STEPS.RESET && (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Set new password</h2>
                <p className="text-white/40 text-sm">Choose a strong password for your account.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">New password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input-field pr-11" placeholder="Min. 8 characters"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Confirm password</label>
                <input type={showPass ? 'text' : 'password'} className="input-field" placeholder="Repeat password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-brand-900/40 border-t-brand-900 rounded-full animate-spin" /> : null}
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          )}

          {/* Step 4: Done */}
          {step === STEPS.DONE && (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-2">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Password reset!</h2>
              <p className="text-white/40 text-sm">Your password has been updated successfully.</p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full mt-2">Go to login</button>
            </div>
          )}

          {step !== STEPS.DONE && (
            <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors mt-5">
              <ArrowLeft size={14} /> Back to login
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
