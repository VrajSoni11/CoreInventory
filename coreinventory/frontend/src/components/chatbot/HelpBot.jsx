import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Minimize2, Sparkles } from 'lucide-react'

const SYSTEM_PROMPT = `You are InventBot, a friendly and knowledgeable assistant built into CoreInventory — an inventory management system.

CoreInventory features:
- PRODUCTS: Add/edit products with SKU, category, unit, reorder threshold. Stock status shows In Stock / Low Stock / Out of Stock / New.
- WAREHOUSES: Create warehouses in Settings with name, code, address.
- RECEIPTS (Incoming): Log goods coming IN to a warehouse. Fill product, quantity, destination warehouse, location, vendor. Must VALIDATE to update stock.
- DELIVERIES (Outgoing): Log goods going OUT. Fill product, quantity, source warehouse, location, customer. Must VALIDATE. Checks if sufficient stock exists.
- TRANSFERS: Move stock between warehouses/locations. Needs source AND destination. Stock total stays same.
- ADJUSTMENTS: Physical count correction. Enter actual counted quantity — system auto-calculates variance.
- MOVE HISTORY: Full ledger of all operations.
- ANALYSIS: Charts — monthly trends, stock by product, operation types, most delivered/received, daily activity.
- PDF RECEIPTS: Click the gold PDF button on any done/cancelled operation to download a printable receipt.
- OTP FORGOT PASSWORD: Enter email → receive 6-digit OTP → verify → reset password.

Key rules:
- Stock only changes when you VALIDATE an operation (green checkmark ✅)
- Draft operations do NOT affect stock
- Deliveries/Transfers will FAIL if insufficient stock at source location
- Location names must match EXACTLY (case sensitive) — the form auto-fills location when you pick a warehouse that has stock
- Reorder threshold = alert level only, does NOT add stock

You are helpful, concise, and friendly. Use emojis occasionally. Keep answers short (2-4 sentences max) unless the user asks for detail. If unsure, say so honestly.`

const QUICK_QUESTIONS = [
  'How do I add stock?',
  'Why is delivery failing?',
  'How do transfers work?',
  'What is reorder threshold?',
  'How to download PDF receipt?',
]

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 14, width: 'fit-content' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: '#e8c547',
          animation: 'bounce 1.2s infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  )
}

function Message({ msg }) {
  const isBot = msg.role === 'assistant'
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: isBot ? 'row' : 'row-reverse' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', shrink: 0, flexShrink: 0,
        background: isBot ? 'rgba(232,197,71,0.15)' : 'rgba(99,102,241,0.15)',
        border: `1px solid ${isBot ? 'rgba(232,197,71,0.3)' : 'rgba(99,102,241,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isBot
          ? <Bot size={14} color="#e8c547" />
          : <User size={14} color="#818cf8" />}
      </div>
      <div style={{
        maxWidth: '78%',
        background: isBot ? 'rgba(255,255,255,0.05)' : 'rgba(232,197,71,0.1)',
        border: `1px solid ${isBot ? 'rgba(255,255,255,0.08)' : 'rgba(232,197,71,0.2)'}`,
        borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        padding: '10px 14px',
        fontSize: 13,
        lineHeight: 1.6,
        color: isBot ? 'rgba(255,255,255,0.85)' : '#f1f0ec',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
        {msg.time && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, textAlign: isBot ? 'left' : 'right' }}>
            {msg.time}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HelpBot() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm InventBot 👋 I'm here to help you with CoreInventory.\n\nAsk me anything — how to add stock, why an operation failed, how transfers work, or anything else!",
      time: 'Just now',
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, open])

  const getTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return
    setInput('')

    const userMsg = { role: 'user', content: userText, time: getTime() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Server error')
      }

      const reply = data.content || "Sorry, I couldn't get a response. Please try again!"
      const botMsg = { role: 'assistant', content: reply, time: getTime() }
      setMessages(prev => [...prev, botMsg])
      if (!open) setUnread(u => u + 1)
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Oops! Something went wrong. Make sure the backend is running and ANTHROPIC_API_KEY is set in your .env 🔧",
        time: getTime(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulse-bot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,197,71,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(232,197,71,0); }
        }
        .bot-fab { animation: pulse-bot 2.5s ease infinite; }
        .bot-fab:hover { transform: scale(1.08) !important; }
        .chat-window { animation: popIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .quick-q {
          background: rgba(232,197,71,0.07);
          border: 1px solid rgba(232,197,71,0.2);
          color: rgba(255,255,255,0.7);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }
        .quick-q:hover { background: rgba(232,197,71,0.15); color: #e8c547; border-color: rgba(232,197,71,0.4); }
        .send-btn { transition: all 0.2s; }
        .send-btn:hover { background: #f5d55a !important; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* Floating button */}
      <button
        className="bot-fab"
        onClick={() => { setOpen(!open); setMinimized(false) }}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #e8c547, #c9a832)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
          boxShadow: '0 4px 24px rgba(232,197,71,0.4)',
        }}
      >
        {open
          ? <X size={22} color="#0a0a1a" />
          : <MessageCircle size={22} color="#0a0a1a" />}
        {unread > 0 && !open && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 20, height: 20, borderRadius: '50%',
            background: '#f87171', border: '2px solid #080818',
            fontSize: 10, fontWeight: 700, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unread}</div>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="chat-window"
          style={{
            position: 'fixed', bottom: 92, right: 24, zIndex: 999,
            width: 360, borderRadius: 20,
            background: '#0d0d1f',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,197,71,0.08)',
            display: 'flex', flexDirection: 'column',
            maxHeight: minimized ? 'auto' : 520,
            overflow: 'hidden',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(232,197,71,0.12), rgba(232,197,71,0.05))',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(232,197,71,0.15)', border: '1px solid rgba(232,197,71,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} color="#e8c547" />
              </div>
              <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#34d399', border: '1.5px solid #0d0d1f' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>InventBot</span>
                <Sparkles size={12} color="#e8c547" />
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>CoreInventory Assistant · Online</p>
            </div>
            <button onClick={() => setMinimized(!minimized)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4, transition: 'color 0.2s' }}
              onMouseOver={e => e.target.style.color = '#fff'}
              onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.3)'}>
              <Minimize2 size={15} />
            </button>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                {loading && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'rgba(232,197,71,0.15)', border: '1px solid rgba(232,197,71,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={14} color="#e8c547" />
                    </div>
                    <TypingIndicator />
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick questions */}
              {messages.length <= 2 && (
                <div style={{ padding: '0 14px 12px', flexShrink: 0 }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 8, letterSpacing: 0.5 }}>QUICK QUESTIONS</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {QUICK_QUESTIONS.map(q => (
                      <button key={q} className="quick-q" onClick={() => sendMessage(q)}>{q}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0, background: 'rgba(255,255,255,0.02)' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask anything about CoreInventory..."
                  rows={1}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif", resize: 'none', outline: 'none',
                    lineHeight: 1.5, maxHeight: 80, overflowY: 'auto',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(232,197,71,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: '#e8c547', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Send size={16} color="#0a0a1a" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}