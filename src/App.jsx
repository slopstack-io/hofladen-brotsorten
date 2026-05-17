import { useState, useEffect, useCallback } from 'react'

const DEFAULT_BREADS = [
  { id: '1', name: 'Rustikales Bauernbrot', emoji: '🍞', price: 3.50, desc: 'Sauerteig, kräftige Kruste', available: true },
  { id: '2', name: 'Dinkelsonnenbrot', emoji: '🌻', price: 4.00, desc: 'Mit Sonnenblumenkernen', available: true },
  { id: '3', name: 'Roggenmischbrot', emoji: '🌾', price: 3.20, desc: 'Herzhaft, lange Teigführung', available: true },
  { id: '4', name: 'Kürbiskernbrot', emoji: '🎃', price: 4.20, desc: 'Nussig, mit Kürbiskernen', available: true },
  { id: '5', name: 'Walnusshörnchen', emoji: '🥐', price: 2.80, desc: 'Blätterteig mit Walnüssen', available: true },
  { id: '6', name: 'Kamutbrot', emoji: '🧡', price: 4.50, desc: 'Urgetreide, mild-nussig', available: false },
]

const ADMIN_PIN = '1234'
const CUTOFF_HOUR = 8

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

function formatDate() {
  return new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function isBeforeCutoff() {
  const now = new Date()
  return now.getHours() < CUTOFF_HOUR
}

// Storage helpers
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

export default function App() {
  const [mode, setMode] = useState('customer') // 'customer' | 'admin'
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [isAdminAuth, setIsAdminAuth] = useState(false)

  // Data
  const [breads, setBreads] = useState(() => load('hofladen_breads', DEFAULT_BREADS))
  const [orders, setOrders] = useState(() => load('hofladen_orders', []))
  const [customerName, setCustomerName] = useState(() => load('hofladen_customer_name', ''))
  const [quantities, setQuantities] = useState({})
  const [showConfirmation, setShowConfirmation] = useState(null)

  const todayKey = getTodayKey()
  const open = isBeforeCutoff()
  const availableBreads = breads.filter(b => b.available)

  // Persist
  useEffect(() => save('hofladen_breads', breads), [breads])
  useEffect(() => save('hofladen_orders', orders), [orders])
  useEffect(() => save('hofladen_customer_name', customerName), [customerName])

  // Toggle bread availability
  const toggleBread = useCallback((id) => {
    setBreads(prev => prev.map(b => b.id === id ? { ...b, available: !b.available } : b))
  }, [])

  // Add new bread
  const [newBread, setNewBread] = useState({ name: '', price: '', emoji: '🍞', desc: '' })
  const addBread = useCallback(() => {
    if (!newBread.name || !newBread.price) return
    if (isNaN(parseFloat(newBread.price))) return alert('Bitte gib einen gültigen Preis ein.')
    const bread = {
      id: crypto.randomUUID(),
      name: newBread.name,
      emoji: newBread.emoji || '🍞',
      price: parseFloat(newBread.price),
      desc: newBread.desc || '',
      available: true
    }
    setBreads(prev => [...prev, bread])
    setNewBread({ name: '', price: '', emoji: '🍞', desc: '' })
  }, [newBread])

  // Remove bread
  const removeBread = useCallback((id) => {
    setBreads(prev => prev.filter(b => b.id !== id))
  }, [])

  // Quantity
  const setQty = useCallback((breadId, qty) => {
    setQuantities(prev => ({ ...prev, [breadId]: Math.max(0, qty) }))
  }, [])

  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0)
  const totalPrice = availableBreads.reduce((s, b) => s + (quantities[b.id] || 0) * b.price, 0)

  // Submit order
  const submitOrder = useCallback(() => {
    if (!customerName.trim()) return alert('Bitte gib deinen Namen ein.')
    if (totalItems === 0) return

    const items = availableBreads
      .filter(b => quantities[b.id] > 0)
      .map(b => ({ name: b.name, qty: quantities[b.id], price: b.price }))

    const order = {
      id: crypto.randomUUID(),
      date: todayKey,
      customer: customerName.trim(),
      items,
      total: totalPrice,
      createdAt: new Date().toISOString()
    }

    setOrders(prev => [...prev, order])
    setShowConfirmation(order)
    setQuantities({})
  }, [customerName, quantities, availableBreads, totalItems, totalPrice, todayKey])

  // Auth
  const handlePinSubmit = useCallback(() => {
    if (pinInput === ADMIN_PIN) {
      setIsAdminAuth(true)
      setMode('admin')
      setPinError(false)
    } else {
      setPinError(true)
    }
  }, [pinInput])

  const switchToAdmin = useCallback(() => {
    if (isAdminAuth) {
      setMode('admin')
    } else {
      setMode('pin')
    }
  }, [isAdminAuth])

  const todayOrders = orders.filter(o => o.date === todayKey)

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <h1><span>🍞</span> {mode === 'admin' ? 'Betreiberin' : 'Hofladen'}</h1>
        {mode === 'admin' ? (
          <button className="mode-toggle" onClick={() => setMode('customer')}>
            Kunden-Ansicht
          </button>
        ) : (
          <button className="mode-toggle" onClick={switchToAdmin}>
            Betreiberin
          </button>
        )}
      </div>

      <div className="content">
        {/* PIN Screen */}
        {mode === 'pin' && (
          <div className="admin-panel">
            <div className="admin-section">
              <h3>🔐 PIN eingeben</h3>
              <div className="pin-section">
                <input
                  type="password"
                  placeholder="PIN"
                  value={pinInput}
                  onChange={e => { setPinInput(e.target.value); setPinError(false) }}
                  onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
                  autoFocus
                />
                <button className="pin-btn" onClick={handlePinSubmit}>OK</button>
              </div>
              {pinError && <div className="pin-wrong">Falsche PIN. Bitte versuche es erneut.</div>}
              <button className="mode-toggle" style={{ marginTop: 16, color: 'var(--brown)', background: 'var(--cream)' }} onClick={() => setMode('customer')}>
                Zurück
              </button>
            </div>
          </div>
        )}

        {/* Customer Mode */}
        {mode === 'customer' && (
          <>
            {/* Date Bar */}
            <div className="date-bar">
              <span className="date">{formatDate()}</span>
              <span className={`status ${open ? 'status-open' : 'status-closed'}`}>
                {open ? 'Bestellung offen' : 'Bestellung geschlossen'}
              </span>
            </div>

            {!open && (
              <div className="closed-banner">
                <div className="emoji">⏰</div>
                <h3>Bestellzeitraum vorbei</h3>
                <p>Vorbestellungen sind bis {CUTOFF_HOUR}:00 Uhr möglich. Schau morgen wieder vorbei!</p>
              </div>
            )}

            {open && (
              <>
                {/* Name */}
                <div className="name-input-section">
                  <label>Dein Name für die Bestellung</label>
                  <input
                    type="text"
                    placeholder="z.B. Maria"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                  />
                </div>

                {/* Bread List */}
                <div className="section-title">Heute verfügbar ({availableBreads.length} Sorten)</div>
                {availableBreads.map(bread => (
                  <div key={bread.id} className="bread-card">
                    <div className="bread-header">
                      <div className="bread-emoji">{bread.emoji}</div>
                      <div className="bread-info">
                        <div className="bread-name">{bread.name}</div>
                        {bread.desc && <div className="bread-desc">{bread.desc}</div>}
                      </div>
                      <div className="bread-price">{(Number(bread.price) || 0).toFixed(2)} EUR</div>
                    </div>
                    <div className="qty-selector">
                      <button className="qty-btn" onClick={() => setQty(bread.id, (quantities[bread.id] || 0) - 1)}>−</button>
                      <span className="qty-display">{quantities[bread.id] || 0}</span>
                      <button className="qty-btn" onClick={() => setQty(bread.id, (quantities[bread.id] || 0) + 1)}>+</button>
                    </div>
                  </div>
                ))}

                {availableBreads.length === 0 && (
                  <div className="empty-state">
                    <div className="emoji">🚫</div>
                    <p>Heute sind noch keine Brotsorten eingetragen.</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Admin Mode */}
        {mode === 'admin' && (
          <div className="admin-panel">
            {/* Toggle Availability */}
            <div className="admin-section">
              <h3>🍞 Brotsorten verwalten</h3>
              {breads.map(bread => (
                <div key={bread.id} className="bread-admin-item">
                  <div className="left">
                    <span className="emoji-sm">{bread.emoji}</span>
                    <div>
                      <div className="name">{bread.name}</div>
                      <div className="price-sm">{(Number(bread.price) || 0).toFixed(2)} EUR — {bread.available ? 'verfügbar' : 'ausblenden'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      className={`toggle-btn ${bread.available ? 'active' : 'inactive'}`}
                      onClick={() => toggleBread(bread.id)}
                    />
                    <button
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }}
                      onClick={() => removeBread(bread.id)}
                      title="Löschen"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Bread */}
            <div className="admin-section">
              <h3>➕ Neue Brotsorte hinzufügen</h3>
              <div className="add-form">
                <div className="row">
                  <input
                    placeholder="Emoji"
                    value={newBread.emoji}
                    onChange={e => setNewBread(p => ({ ...p, emoji: e.target.value }))}
                    style={{ maxWidth: 60 }}
                  />
                  <input
                    placeholder="Name der Brotsorte"
                    value={newBread.name}
                    onChange={e => setNewBread(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="row">
                  <input
                    placeholder="Preis (z.B. 3.50)"
                    type="number"
                    step="0.10"
                    value={newBread.price}
                    onChange={e => setNewBread(p => ({ ...p, price: e.target.value }))}
                  />
                  <input
                    placeholder="Beschreibung (optional)"
                    value={newBread.desc}
                    onChange={e => setNewBread(p => ({ ...p, desc: e.target.value }))}
                  />
                </div>
                <button className="add-btn" onClick={addBread}>Hinzufügen</button>
              </div>
            </div>

            {/* Today's Orders */}
            <div className="admin-section">
              <h3>📋 Bestellungen heute ({todayOrders.length})</h3>
              {todayOrders.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 10px' }}>
                  <p>Noch keine Bestellungen heute.</p>
                </div>
              ) : (
                todayOrders.map(order => (
                  <div key={order.id} className="order-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="customer">{order.customer}</span>
                      <span className="time">{formatTime(order.createdAt)}</span>
                    </div>
                    <div className="items">
                      {order.items.map((item, i) => (
                        <div key={i}>{item.qty}x {item.name} ({(item.qty * item.price).toFixed(2)} EUR)</div>
                      ))}
                    </div>
                    <div style={{ fontWeight: 700, marginTop: 4, fontSize: '0.9rem' }}>
                      Gesamt: {order.total.toFixed(2)} EUR
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Button (Customer + Open) */}
      {mode === 'customer' && open && totalItems > 0 && (
        <button className="order-btn" onClick={submitOrder}>
          Vorbestellung absenden
          <span className="order-count">{totalItems} {totalItems === 1 ? 'Brot' : 'Brote'} — {totalPrice.toFixed(2)} EUR</span>
        </button>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal-overlay" onClick={() => setShowConfirmation(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="check-icon">✅</div>
            <h2>Bestellung aufgegeben!</h2>
            <p>Danke, {showConfirmation.customer}! Deine Vorbestellung wurde notiert.</p>
            <div className="order-details">
              {showConfirmation.items.map((item, i) => (
                <div key={i} className="item">
                  <span>{item.qty}x {item.name}</span>
                  <span>{(item.qty * item.price).toFixed(2)} EUR</span>
                </div>
              ))}
              <div className="order-total">
                <span>Gesamt</span>
                <span>{showConfirmation.total.toFixed(2)} EUR</span>
              </div>
            </div>
            <p>Abholen kannst du dein Brot ab 9 Uhr im Hofladen.</p>
            <button className="close-btn" onClick={() => setShowConfirmation(null)}>Okay!</button>
          </div>
        </div>
      )}
    </div>
  )
}
