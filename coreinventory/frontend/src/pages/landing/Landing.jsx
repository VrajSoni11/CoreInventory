import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Count-up hook ───────────────────────────────────────────────────────────
function useCountUp(target, duration = 1800, start = false) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (ts) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setVal(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return val
}

function StatCard({ value, suffix, label, start }) {
  const count = useCountUp(value, 1600, start)
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: 'clamp(40px,5vw,64px)', lineHeight: 1, color: '#e8c547', letterSpacing: 2 }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

// ─── 3-D CSS Cube ─────────────────────────────────────────────────────────────
function Cube3D({ size = 60, color = '#e8c547', opacity = 0.18, rotX = 20, rotY = 45, style = {} }) {
  const s = size
  const hs = s / 2
  const faceStyle = (bg, transform) => ({
    position: 'absolute', width: s, height: s,
    background: bg, border: `1px solid ${color}40`,
    backfaceVisibility: 'hidden', transform,
  })
  return (
    <div style={{ width: s, height: s, position: 'relative', transformStyle: 'preserve-3d', transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`, ...style }}>
      <div style={faceStyle(`rgba(${hexToRgb(color)},${opacity + 0.05})`, `translateZ(${hs}px)`)} />
      <div style={faceStyle(`rgba(${hexToRgb(color)},${opacity - 0.05})`, `rotateY(180deg) translateZ(${hs}px)`)} />
      <div style={faceStyle(`rgba(${hexToRgb(color)},${opacity})`, `rotateY(-90deg) translateZ(${hs}px)`)} />
      <div style={faceStyle(`rgba(${hexToRgb(color)},${opacity})`, `rotateY(90deg) translateZ(${hs}px)`)} />
      <div style={faceStyle(`rgba(${hexToRgb(color)},${opacity + 0.08})`, `rotateX(90deg) translateZ(${hs}px)`)} />
      <div style={faceStyle(`rgba(${hexToRgb(color)},${opacity - 0.08})`, `rotateX(-90deg) translateZ(${hs}px)`)} />
    </div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

// ─── Floating 3D particle field ───────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      z: Math.random() * 400 + 100,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 0.5,
      color: Math.random() > 0.7 ? '#e8c547' : Math.random() > 0.5 ? '#818cf8' : '#34d399'
    }))
    let frame
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.z += p.vz
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        if (p.z < 100 || p.z > 500) p.vz *= -1
        const scale = 300 / p.z
        const sx = (p.x - W / 2) * scale + W / 2
        const sy = (p.y - H / 2) * scale + H / 2
        const alpha = Math.min((500 - p.z) / 400, 0.6)
        const radius = Math.max(1, 3 * scale)
        ctx.beginPath()
        ctx.arc(sx, sy, radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0')
        ctx.fill()
      })
      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const scaleA = 300 / a.z, scaleB = 300 / b.z
            const ax = (a.x - W / 2) * scaleA + W / 2
            const ay = (a.y - H / 2) * scaleA + H / 2
            const bx = (b.x - W / 2) * scaleB + W / 2
            const by = (b.y - H / 2) * scaleB + H / 2
            ctx.beginPath()
            ctx.moveTo(ax, ay)
            ctx.lineTo(bx, by)
            ctx.strokeStyle = `rgba(232,197,71,${(1 - dist / 120) * 0.08})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      frame = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

// ─── Interactive operation demo widget ────────────────────────────────────────
const OPS = [
  { key: 'receipt',   icon: '⬇', label: 'Receipt',   color: '#34d399', desc: 'Incoming goods from vendor' },
  { key: 'delivery',  icon: '⬆', label: 'Delivery',  color: '#f87171', desc: 'Outgoing to customer' },
  { key: 'transfer',  icon: '⇄', label: 'Transfer',  color: '#818cf8', desc: 'Between warehouses' },
  { key: 'adjust',    icon: '◈', label: 'Adjust',    color: '#f59e0b', desc: 'Stock reconciliation' },
]

function LiveDemo() {
  const [active, setActive] = useState('receipt')
  const [validated, setValidated] = useState(false)
  const [animating, setAnimating] = useState(false)
  const op = OPS.find(o => o.key === active)

  const handleValidate = () => {
    setAnimating(true)
    setTimeout(() => { setValidated(true); setAnimating(false) }, 700)
  }
  const handleReset = () => { setValidated(false) }

  return (
    <div style={{ background: 'rgba(10,10,28,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {['#f87171','#f59e0b','#34d399'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginLeft: 4, fontFamily: 'Space Mono, monospace' }}>operations.log</span>
      </div>

      {/* Op tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {OPS.map(o => (
          <button key={o.key} onClick={() => { setActive(o.key); setValidated(false) }}
            style={{ flex: 1, padding: '12px 4px', background: active === o.key ? `${o.color}12` : 'transparent',
              border: 'none', borderBottom: active === o.key ? `2px solid ${o.color}` : '2px solid transparent',
              color: active === o.key ? o.color : 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer', transition: 'all .2s', fontWeight: 600, letterSpacing: 0.5 }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{o.icon}</div>
            {o.label}
          </button>
        ))}
      </div>

      {/* Form body */}
      <div style={{ padding: '20px', minHeight: 220 }}>
        {!validated ? (
          <div style={{ animation: animating ? 'none' : 'fadeUp .3s ease' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16, letterSpacing: 1 }}>NEW {active.toUpperCase()} — {op.desc.toUpperCase()}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                active === 'receipt' ? ['Vendor', 'Gujarat Textiles Ltd'] :
                active === 'delivery' ? ['Customer', 'Rajkot Exports'] :
                active === 'transfer' ? ['From', 'WH-Surat'] : ['Product', 'SKU-0042'],
                active === 'receipt' ? ['Warehouse', 'WH-Main'] :
                active === 'delivery' ? ['Warehouse', 'WH-Main'] :
                active === 'transfer' ? ['To', 'WH-Ahmedabad'] : ['Reason', 'Count variance'],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, marginBottom: 5 }}>{lbl.toUpperCase()}</div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, marginBottom: 5 }}>PRODUCT LINES</div>
              {[['Cotton Fabric 40s', '120 rolls', op.color], ['Polyester Blend', '80 rolls', op.color]].map(([name, qty, c]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: 6, background: `${c}08`, border: `1px solid ${c}20`, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{name}</span>
                  <span style={{ fontSize: 11, color: c, fontWeight: 700 }}>{qty}</span>
                </div>
              ))}
            </div>
            <button onClick={handleValidate}
              style={{ width: '100%', padding: '11px', background: op.color, border: 'none', borderRadius: 10,
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                color: '#080818', transition: 'all .2s', opacity: animating ? 0.6 : 1 }}>
              {animating ? '⟳ Processing…' : `✓ Validate ${op.label}`}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', animation: 'fadeUp .4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 22, fontFamily: 'Bebas Neue, cursive', letterSpacing: 2, color: op.color, marginBottom: 8 }}>{op.label} Validated!</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Reference: {active.slice(0,3).toUpperCase()}-{String(Math.floor(Math.random()*9000+1000))}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>Stock updated · PDF ready</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={handleReset} style={{ padding: '8px 18px', background: 'transparent', border: `1px solid ${op.color}50`, color: op.color, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>New Operation</button>
              <button style={{ padding: '8px 18px', background: `${op.color}15`, border: `1px solid ${op.color}30`, color: op.color, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>⬇ Download PDF</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Animated 3D Ring (SVG-based) ─────────────────────────────────────────────
function Ring3D({ size = 180, color = '#e8c547', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" style={style}>
      <defs>
        <radialGradient id="rg1" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <ellipse cx="90" cy="90" rx="75" ry="22" fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.15" />
      <ellipse cx="90" cy="90" rx="75" ry="22" fill="none" stroke="url(#rg1)" strokeWidth="2.5"
        strokeDasharray="60 260" strokeDashoffset="0">
        <animateTransform attributeName="transform" type="rotate" from="0 90 90" to="360 90 90" dur="6s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="90" cy="90" rx="55" ry="16" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.1" />
      <ellipse cx="90" cy="90" rx="55" ry="16" fill="none" stroke={color} strokeWidth="2"
        strokeDasharray="40 200" strokeDashoffset="80" strokeOpacity="0.5">
        <animateTransform attributeName="transform" type="rotate" from="360 90 90" to="0 90 90" dur="4s" repeatCount="indefinite" />
      </ellipse>
      <circle cx="90" cy="90" r="12" fill={color} fillOpacity="0.15" />
      <circle cx="90" cy="90" r="6" fill={color} fillOpacity="0.4" />
    </svg>
  )
}

// ─── Warehouse 3D Isometric mini viz ─────────────────────────────────────────
function IsometricWarehouse({ fill = 0.7 }) {
  const pct = Math.min(Math.max(fill, 0), 1)
  return (
    <svg width="200" height="140" viewBox="0 0 200 140" style={{ overflow: 'visible' }}>
      {/* Floor */}
      <path d="M100 80 L160 46 L160 110 L100 144 Z" fill="rgba(232,197,71,0.06)" stroke="rgba(232,197,71,0.2)" strokeWidth="1" />
      <path d="M40 46 L100 80 L100 144 L40 110 Z" fill="rgba(232,197,71,0.04)" stroke="rgba(232,197,71,0.15)" strokeWidth="1" />
      <path d="M40 46 L100 10 L160 46 L100 80 Z" fill="rgba(232,197,71,0.1)" stroke="rgba(232,197,71,0.3)" strokeWidth="1" />
      {/* Shelves */}
      {[0.85, 0.65, 0.45].map((y, i) => (
        <g key={i}>
          <line x1={55 + i * 4} y1={40 + (y * 40)} x2={95 + i * 4} y2={60 + (y * 40)} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
        </g>
      ))}
      {/* Fill indicator */}
      <path d={`M100 ${80 - pct * 60} L${100 + 60 * (1 - (80 - pct * 60 - 20) / 60)} ${46} L160 46 L160 ${46 + (80 - pct * 60 - 10)} Z`}
        fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.3)" strokeWidth="0.8" opacity="0.6" />
      {/* Grid lines on front face */}
      {[0.33, 0.66].map((t, i) => (
        <line key={i} x1={40 + t * 60} y1={46 + t * 34} x2={40 + t * 60} y2={110 + t * 34}
          stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
      ))}
    </svg>
  )
}

// ─── Features data ────────────────────────────────────────────────────────────
const features = [
  { icon: '⬇', title: 'Smart Receipts', desc: 'Log incoming goods with vendor details, quantities, and warehouse destinations in seconds.', color: '#34d399', route: '/receipts' },
  { icon: '⬆', title: 'Delivery Orders', desc: 'Process outgoing shipments with automatic stock deduction and customer tracking.', color: '#f87171', route: '/deliveries' },
  { icon: '⇄', title: 'Internal Transfers', desc: 'Move stock between warehouses while keeping your ledger perfectly balanced.', color: '#818cf8', route: '/transfers' },
  { icon: '◈', title: 'Stock Adjustments', desc: 'Reconcile physical counts with system data and track every variance automatically.', color: '#f59e0b', route: '/adjustments' },
  { icon: '◉', title: 'Live Analytics', desc: 'Beautiful charts and trend analysis to spot patterns before they become problems.', color: '#e8c547', route: '/analytics' },
  { icon: '⬡', title: 'PDF Receipts', desc: 'Generate professional printable receipts for every operation with one click.', color: '#06b6d4', route: '/dashboard' },
]

const steps = [
  { n: '01', title: 'Add your products', desc: 'Create your product catalog with SKUs, categories, units, and reorder thresholds.', route: '/products/new' },
  { n: '02', title: 'Set up warehouses', desc: 'Define your storage locations and organize your physical space.', route: '/warehouses/new' },
  { n: '03', title: 'Process operations', desc: 'Create and validate receipts, deliveries, transfers, and adjustments.', route: '/operations/new' },
  { n: '04', title: 'Track everything', desc: 'Watch your dashboard update in real time with every move you make.', route: '/dashboard' },
]

const testimonials = [
  { name: 'Rohan Mehta', role: 'Warehouse Manager, Ahmedabad', text: 'CoreInventory replaced 3 spreadsheets. We catch low stock issues before they shut down production.', avatar: 'RM', color: '#e8c547' },
  { name: 'Priya Soni', role: 'Operations Head, Surat', text: 'The transfer system is flawless. Moving stock between our 4 warehouses used to take hours. Now minutes.', avatar: 'PS', color: '#34d399' },
  { name: 'Dev Patel', role: 'Founder, Rajkot Exports', text: 'We finally have a paper trail for every delivery. The PDF receipt feature alone is worth it.', avatar: 'DP', color: '#818cf8' },
]

// ─── Main component ───────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const statsRef = useRef(null)
  const [statsVisible, setStatsVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [hoveredFeature, setHoveredFeature] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onMove = (e) => setMousePos({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true) }, { threshold: 0.3 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const S = {
    page: { background: '#060615', color: '#f1f0ec', fontFamily: 'DM Sans, sans-serif', overflowX: 'hidden' },
    container: { maxWidth: 1140, margin: '0 auto', padding: '0 24px' },
    section: { padding: '100px 0' },
    tag: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(232,197,71,0.08)', border: '1px solid rgba(232,197,71,0.2)', color: '#e8c547', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 14px', borderRadius: 20 },
    h2: { fontFamily: 'Bebas Neue, cursive', fontSize: 'clamp(40px,5vw,64px)', color: '#fff', letterSpacing: 1, lineHeight: 1.05 },
    gold: { color: '#e8c547' },
    muted: { color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 },
  }

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .nav-link{color:rgba(255,255,255,0.5);font-size:14px;font-weight:500;cursor:pointer;transition:color .2s;text-decoration:none}
        .nav-link:hover{color:#e8c547}
        .btn-g{background:#e8c547;color:#0a0a1a;border:none;padding:14px 32px;border-radius:10px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;cursor:pointer;transition:all .25s}
        .btn-g:hover{background:#f5d55a;transform:translateY(-2px);box-shadow:0 8px 30px rgba(232,197,71,0.35)}
        .btn-g:active{transform:translateY(0)}
        .btn-o{background:transparent;color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.15);padding:14px 28px;border-radius:10px;font-family:'DM Sans',sans-serif;font-weight:500;font-size:15px;cursor:pointer;transition:all .2s}
        .btn-o:hover{border-color:rgba(232,197,71,0.5);color:#e8c547}
        .feat-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;transition:all .35s cubic-bezier(.17,.67,.34,1.1);cursor:pointer;position:relative;overflow:hidden}
        .feat-card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 40%,rgba(232,197,71,0.07),transparent 60%);opacity:0;transition:opacity .3s}
        .feat-card:hover::before{opacity:1}
        .feat-card:hover{transform:translateY(-6px) scale(1.01);box-shadow:0 20px 60px rgba(0,0,0,0.4)}
        .testi-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:28px;transition:all .3s}
        .testi-card:hover{transform:translateY(-4px)}
        .step-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:16px;padding:28px 24px;transition:all .3s;cursor:pointer}
        .step-card:hover{background:rgba(232,197,71,0.04);border-color:rgba(232,197,71,0.15);transform:translateY(-4px)}
        .orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none}
        @keyframes float{0%,100%{transform:translateY(0) rotateY(0deg)}50%{transform:translateY(-18px) rotateY(8deg)}}
        @keyframes floatB{0%,100%{transform:translateY(0) rotateX(0deg)}50%{transform:translateY(-10px) rotateX(5deg)}}
        @keyframes rotateRing{from{transform:rotateZ(0deg)}to{transform:rotateZ(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .fu{animation:fadeUp .7s ease forwards}
        .d1{animation-delay:.1s;opacity:0}.d2{animation-delay:.25s;opacity:0}.d3{animation-delay:.4s;opacity:0}.d4{animation-delay:.55s;opacity:0}.d5{animation-delay:.7s;opacity:0}
        .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:28px}
        .stat-g{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
        .grid-line-bg{position:absolute;inset:0;z-index:0;opacity:0.025;
          background-image:linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px);
          background-size:70px 70px}
        @media(max-width:900px){
          .g3{grid-template-columns:1fr 1fr}.g4{grid-template-columns:1fr 1fr;gap:20px}
          .stat-g{grid-template-columns:1fr 1fr;gap:28px}.hero-right{display:none!important}}
        @media(max-width:600px){
          .g3{grid-template-columns:1fr}.g4{grid-template-columns:1fr}.stat-g{grid-template-columns:1fr 1fr}
          .d-none-m{display:none!important}.hero-btns{flex-direction:column!important}}
        .floating-badge{position:absolute;background:rgba(10,10,28,0.85);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:10px 14px;backdrop-filter:blur(16px);pointer-events:none}
        .glow-btn{position:relative;overflow:hidden}
        .glow-btn::after{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(255,255,255,0.15) 0%,transparent 60%);opacity:0;transition:opacity .3s}
        .glow-btn:hover::after{opacity:1}
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrollY > 60 ? 'rgba(6,6,21,0.92)' : 'transparent', backdropFilter: scrollY > 60 ? 'blur(24px)' : 'none', borderBottom: scrollY > 60 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'all .3s' }}>
        <div style={{ ...S.container, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 32, height: 32, background: 'rgba(232,197,71,0.1)', border: '1px solid rgba(232,197,71,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#e8c547' }}>◈</div>
            <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 18, color: '#fff' }}>Core<span style={S.gold}>Inventory</span></span>
          </div>
          <div className="d-none-m" style={{ display: 'flex', gap: 36 }}>
            {[['Features','features'],['How it works','how-it-works'],['Live Demo','demo'],['Testimonials','testimonials']].map(([l, id]) => (
              <span key={l} className="nav-link" onClick={() => scrollTo(id)}>{l}</span>
            ))}
          </div>
          <div className="d-none-m" style={{ display: 'flex', gap: 12 }}>
            <button className="btn-o" style={{ padding: '10px 20px', fontSize: 14 }} onClick={() => navigate('/login')}>Sign in</button>
            <button className="btn-g glow-btn" style={{ padding: '10px 20px', fontSize: 14 }} onClick={() => navigate('/register')}>Get started →</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', paddingTop: 80 }}>
        <div className="grid-line-bg" />
        <ParticleField />

        {/* Glowing orbs */}
        <div className="orb" style={{ width: 700, height: 700, background: 'radial-gradient(circle,rgba(232,197,71,.1) 0%,transparent 65%)', top: -200, right: -200 }} />
        <div className="orb" style={{ width: 500, height: 500, background: 'radial-gradient(circle,rgba(99,102,241,.07) 0%,transparent 70%)', bottom: -100, left: -150 }} />

        {/* Floating 3D cubes — background decor */}
        <div style={{ position: 'absolute', top: '15%', right: '8%', perspective: 400, zIndex: 1, animation: 'floatB 7s ease-in-out infinite' }}>
          <Cube3D size={80} color="#818cf8" opacity={0.1} rotX={20} rotY={45} />
        </div>
        <div style={{ position: 'absolute', top: '60%', right: '18%', perspective: 400, zIndex: 1, animation: 'float 9s ease-in-out infinite' }}>
          <Cube3D size={40} color="#34d399" opacity={0.12} rotX={35} rotY={20} />
        </div>
        <div style={{ position: 'absolute', top: '25%', left: '4%', perspective: 400, zIndex: 1, animation: 'floatB 11s ease-in-out infinite' }}>
          <Cube3D size={55} color="#e8c547" opacity={0.08} rotX={15} rotY={60} />
        </div>

        <div style={{ ...S.container, position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 60, width: '100%' }}>
          {/* Left content */}
          <div style={{ flex: '0 0 auto', maxWidth: 560 }}>
            <div className="fu d1" style={{ marginBottom: 24 }}>
              <span style={S.tag}>⬡ Inventory Management System</span>
            </div>
            <h1 className="fu d2" style={{ fontFamily: 'Bebas Neue, cursive', fontSize: 'clamp(60px,8vw,108px)', lineHeight: 0.93, letterSpacing: 1, color: '#fff', marginBottom: 28 }}>
              Every unit.<br />Every move.<br /><span style={{ ...S.gold, textShadow: '0 0 60px rgba(232,197,71,0.35)' }}>Always tracked.</span>
            </h1>
            <p className="fu d3" style={{ ...S.muted, fontSize: 17, maxWidth: 480, marginBottom: 40 }}>
              CoreInventory gives your team a single source of truth — receipts, deliveries, transfers, adjustments, and live analytics all in one place.
            </p>
            <div className="fu d4 hero-btns" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
              <button className="btn-g glow-btn" onClick={() => navigate('/register')} style={{ fontSize: 16, padding: '16px 40px' }}>Start for free →</button>
              <button className="btn-o" onClick={() => navigate('/login')} style={{ fontSize: 16, padding: '16px 28px' }}>Sign in</button>
              <button className="btn-o" onClick={() => scrollTo('demo')} style={{ fontSize: 16, padding: '16px 28px' }}>Try demo ↓</button>
            </div>
            {/* Social proof */}
            <div className="fu d5" style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 36, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex' }}>
                {['#e8c547','#34d399','#818cf8','#f87171'].map((c, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: '2px solid #060615', marginLeft: i > 0 ? -10 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#080818' }}>
                    {['RM','PS','DP','VJ'][i]}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Trusted by <span style={{ color: '#e8c547', fontWeight: 600 }}>warehouse teams</span> across Gujarat
              </p>
            </div>
          </div>

          {/* Right — Dashboard preview + 3D ring */}
          <div className="hero-right" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            {/* 3D Ring behind dashboard */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%,-50%) translateX(${mousePos.x * 12}px) translateY(${mousePos.y * 8}px)`, zIndex: 0, pointerEvents: 'none' }}>
              <Ring3D size={360} color="#e8c547" />
            </div>
            <div style={{ position: 'relative', zIndex: 1, transform: `translateX(${mousePos.x * -8}px) translateY(${mousePos.y * -6}px)`, transition: 'transform .1s ease-out' }}>
              <div style={{ background: 'rgba(10,10,28,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 50px 140px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,197,71,0.05)', animation: 'float 6s ease-in-out infinite' }}>
                {/* Browser chrome */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['#f87171','#f59e0b','#34d399'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginLeft: 8, fontFamily: 'Space Mono', letterSpacing: 0.5 }}>coreinventory.app/dashboard</span>
                </div>
                {/* Dashboard body */}
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', minHeight: 300 }}>
                  <div style={{ background: 'rgba(12,12,30,0.95)', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '16px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: '0 6px' }}>
                      <div style={{ width: 22, height: 22, background: 'rgba(232,197,71,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#e8c547' }}>◈</div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Core<span style={S.gold}>Inv</span></span>
                    </div>
                    {[['◉ Dashboard', true,'#e8c547'],['⬡ Products', false,''],['⬢ Operations', false,''],['◈ Analytics', false,''],['◎ History', false,'']].map(([l, a, c]) => (
                      <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, fontSize: 11, color: a ? c : 'rgba(255,255,255,0.3)', background: a ? 'rgba(232,197,71,0.08)' : 'transparent', marginBottom: 2, cursor: 'pointer' }}>{l}</div>
                    ))}
                  </div>
                  <div style={{ padding: '14px' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 1.5, marginBottom: 10 }}>LIVE OVERVIEW</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
                      {[['142','Products','#818cf8'],['3 ⚠','Low Stock','#f59e0b'],['28k','Units','#34d399']].map(([v,l,c]) => (
                        <div key={l} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${c}25`, borderRadius: 10, padding: 10 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: c, fontFamily: 'Bebas Neue', letterSpacing: 1 }}>{v}</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 8 }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px', height: 118, overflow: 'hidden' }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginBottom: 6, letterSpacing: 1 }}>WEEKLY</div>
                        <svg width="100%" height="82" viewBox="0 0 110 82">
                          {[[8,60,22,'#34d399'],[36,42,22,'#f59e0b'],[64,52,22,'#818cf8'],[88,32,14,'#f87171']].map(([x,h,w,c],i) => (
                            <g key={i}>
                              <rect x={x} y={82-h} width={w} height={h} rx={3} fill={c} fillOpacity={0.15} />
                              <rect x={x} y={82-h} width={w} height={4} rx={2} fill={c} fillOpacity={0.9} />
                            </g>
                          ))}
                        </svg>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 10, height: 118, overflow: 'hidden' }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginBottom: 6, letterSpacing: 1 }}>RECENT OPS</div>
                        {[['REC-00012','done','#34d399'],['DEL-00008','done','#34d399'],['TRF-00003','draft','#6b7280'],['ADJ-00001','done','#34d399']].map(([ref,st,c]) => (
                          <div key={ref} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontFamily: 'Space Mono' }}>{ref}</span>
                            <span style={{ fontSize: 8, color: c, background: `${c}20`, padding: '2px 5px', borderRadius: 4 }}>{st}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="floating-badge" style={{ bottom: '12%', left: '-8%', animation: 'float 5s ease-in-out infinite', animationDelay: '1s' }}>
              <div style={{ fontSize: 10, color: '#34d399', fontWeight: 700, letterSpacing: 1 }}>✓ REC-00012 VALIDATED</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>200 units · WH-Main</div>
            </div>
            <div className="floating-badge" style={{ top: '10%', right: '-4%', animation: 'float 7s ease-in-out infinite', animationDelay: '2.5s' }}>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, letterSpacing: 1 }}>⚠ LOW STOCK ALERT</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>3 products below threshold</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      <div ref={statsRef} style={{ background: 'rgba(232,197,71,0.03)', borderTop: '1px solid rgba(232,197,71,0.08)', borderBottom: '1px solid rgba(232,197,71,0.08)', padding: '64px 0' }}>
        <div style={S.container}>
          <div className="stat-g">
            <StatCard value={10000} suffix="+" label="Units tracked daily" start={statsVisible} />
            <StatCard value={99} suffix="%" label="Stock accuracy" start={statsVisible} />
            <StatCard value={4} suffix="" label="Operation types" start={statsVisible} />
            <StatCard value={60} suffix="s" label="Avg. validate time" start={statsVisible} />
          </div>
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section style={S.section} id="features">
        <div style={S.container}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={{ ...S.tag, marginBottom: 16, display: 'inline-flex' }}>⬡ Features</span>
            <h2 style={{ ...S.h2, marginTop: 16, marginBottom: 16 }}>Everything you need.<br /><span style={S.gold}>Nothing you don't.</span></h2>
            <p style={{ ...S.muted, fontSize: 16, maxWidth: 440, margin: '0 auto' }}>Built for real warehouses, real teams, and real problems.</p>
          </div>
          <div className="g3">
            {features.map((f, i) => (
              <div key={i} className="feat-card" onClick={() => navigate(f.route)}
                onMouseEnter={() => setHoveredFeature(i)} onMouseLeave={() => setHoveredFeature(null)}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle,${f.color}08,transparent 70%)`, borderRadius: '0 18px 0 0', pointerEvents: 'none' }} />
                <div style={{ fontSize: 22, marginBottom: 16, display: 'inline-flex', width: 48, height: 48, alignItems: 'center', justifyContent: 'center', background: `${f.color}12`, border: `1px solid ${f.color}25`, borderRadius: 12, color: f.color, transition: 'all .3s', transform: hoveredFeature === i ? 'scale(1.12) rotate(-5deg)' : 'scale(1) rotate(0deg)' }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ ...S.muted, fontSize: 14, marginBottom: 16 }}>{f.desc}</p>
                <span style={{ fontSize: 12, color: f.color, fontWeight: 600, opacity: hoveredFeature === i ? 1 : 0, transition: 'opacity .2s' }}>Explore →</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE DEMO ─────────────────────────────────────────────────── */}
      <section style={{ ...S.section, background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }} id="demo">
        <div className="orb" style={{ width: 500, height: 500, background: 'radial-gradient(circle,rgba(129,140,248,.06) 0%,transparent 70%)', top: '-10%', left: '40%' }} />
        <div style={{ ...S.container, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <span style={{ ...S.tag, marginBottom: 20, display: 'inline-flex' }}>◉ Interactive Demo</span>
              <h2 style={{ ...S.h2, marginTop: 16, marginBottom: 20 }}>See it work <span style={S.gold}>right now.</span></h2>
              <p style={{ ...S.muted, fontSize: 16, marginBottom: 32 }}>Pick any operation type and validate it — just like your team would do every day. No signup required.</p>
              
              {/* 3D warehouse visual */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, marginBottom: 24 }}>
                <IsometricWarehouse fill={0.72} />
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>WH-Main · Surat</div>
                  <div style={{ fontSize: 22, fontFamily: 'Bebas Neue, cursive', letterSpacing: 2, color: '#34d399' }}>72% CAPACITY</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {[['#34d399','Cotton'],['#818cf8','Poly'],['#f59e0b','Denim']].map(([c,l]) => (
                      <span key={l} style={{ fontSize: 10, color: c, background: `${c}15`, border: `1px solid ${c}30`, padding: '2px 8px', borderRadius: 20 }}>{l}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button className="btn-g glow-btn" onClick={() => navigate('/register')} style={{ fontSize: 15, padding: '14px 32px' }}>
                Start tracking your warehouse →
              </button>
            </div>
            <div>
              <LiveDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section style={S.section} id="how-it-works">
        <div style={S.container}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={{ ...S.tag, marginBottom: 16, display: 'inline-flex' }}>◉ Process</span>
            <h2 style={{ ...S.h2, marginTop: 16 }}>Up and running in <span style={S.gold}>minutes.</span></h2>
          </div>
          <div className="g4">
            {steps.map((s, i) => (
              <div key={i} className="step-card" onClick={() => navigate(s.route)} style={{ position: 'relative', paddingTop: 20 }}>
                <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: 90, lineHeight: 1, color: 'rgba(232,197,71,0.06)', position: 'absolute', top: -20, left: -8, userSelect: 'none' }}>{s.n}</div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(232,197,71,0.07)', border: '1px solid rgba(232,197,71,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#e8c547', animation: 'pulse 2s ease-in-out infinite', animationDelay: `${i * 0.3}s` }} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ ...S.muted, fontSize: 14, marginBottom: 16 }}>{s.desc}</p>
                  <span style={{ fontSize: 12, color: '#e8c547', fontWeight: 600 }}>Go →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3D SHOWCASE STRIP ────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '60px 0', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
        <div style={S.container}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 60, flexWrap: 'wrap', perspective: 600 }}>
            {[
              { size: 70, color: '#34d399', rotX: 25, rotY: 40, label: 'Receipts', delay: '0s' },
              { size: 90, color: '#e8c547', rotX: 15, rotY: 55, label: 'Operations', delay: '1s' },
              { size: 60, color: '#818cf8', rotX: 35, rotY: 20, label: 'Transfers', delay: '2s' },
              { size: 80, color: '#f87171', rotX: 10, rotY: 65, label: 'Deliveries', delay: '1.5s' },
              { size: 65, color: '#f59e0b', rotX: 30, rotY: 35, label: 'Analytics', delay: '0.5s' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', animation: `floatB ${6 + i}s ease-in-out infinite`, animationDelay: item.delay }}>
                <div style={{ perspective: 400 }}>
                  <Cube3D size={item.size} color={item.color} opacity={0.15} rotX={item.rotX} rotY={item.rotY} />
                </div>
                <div style={{ marginTop: 14, fontSize: 11, color: item.color, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section style={S.section} id="testimonials">
        <div style={S.container}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={{ ...S.tag, marginBottom: 16, display: 'inline-flex' }}>◎ Testimonials</span>
            <h2 style={{ ...S.h2, marginTop: 16 }}>Teams that <span style={S.gold}>trust us.</span></h2>
          </div>
          <div className="g3">
            {testimonials.map((t, i) => (
              <div key={i} className="testi-card" style={{ borderColor: `rgba(${hexToRgb(t.color)},0.1)` }}>
                <div style={{ display: 'flex', marginBottom: 16 }}>
                  {[...Array(5)].map((_, j) => <span key={j} style={{ color: t.color, fontSize: 14 }}>★</span>)}
                </div>
                <p style={{ ...S.muted, fontSize: 15, marginBottom: 24, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${t.color}15`, border: `1px solid ${t.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: t.color }}>{t.avatar}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 0', position: 'relative', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 800, height: 800, background: 'radial-gradient(circle,rgba(232,197,71,.07) 0%,transparent 65%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        {/* Spinning rings */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
          <Ring3D size={500} color="#e8c547" style={{ opacity: 0.4 }} />
        </div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(60deg)', pointerEvents: 'none' }}>
          <Ring3D size={400} color="#818cf8" style={{ opacity: 0.25 }} />
        </div>
        <div style={{ ...S.container, position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <span style={{ ...S.tag, marginBottom: 24, display: 'inline-flex' }}>⬡ Get started</span>
          <h2 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: 'clamp(48px,7vw,90px)', color: '#fff', letterSpacing: 1, marginTop: 20, marginBottom: 20, lineHeight: 1 }}>
            Ready to take control<br />of your <span style={{ ...S.gold, textShadow: '0 0 80px rgba(232,197,71,0.4)' }}>inventory?</span>
          </h2>
          <p style={{ ...S.muted, fontSize: 17, maxWidth: 440, margin: '0 auto 40px' }}>Join warehouse teams who track every unit, every move, every day.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-g glow-btn" onClick={() => navigate('/register')} style={{ fontSize: 16, padding: '18px 48px' }}>Create free account →</button>
            <button className="btn-o" onClick={() => navigate('/login')} style={{ fontSize: 16, padding: '18px 32px' }}>Sign in</button>
            <button className="btn-o" onClick={() => scrollTo('demo')} style={{ fontSize: 16, padding: '18px 28px' }}>Try demo first</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 0' }}>
        <div style={{ ...S.container, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 26, height: 26, background: 'rgba(232,197,71,0.1)', border: '1px solid rgba(232,197,71,0.2)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#e8c547' }}>◈</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Core<span style={S.gold}>Inventory</span></span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>© 2026 CoreInventory · Built by Vraj | Darsh</p>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['Dashboard','/dashboard'],['Login','/login'],['Register','/register'],['Analytics','/analytics']].map(([l, r]) => (
              <span key={l} className="nav-link" style={{ fontSize: 13 }} onClick={() => navigate(r)}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}