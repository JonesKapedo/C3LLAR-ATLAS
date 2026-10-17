import { useEffect, useMemo, useRef, useState } from 'react'
import type { Bottle, Pour } from './types'
import { cellarStats, plural, reason } from './logic'
import { DiscretionContext } from './privacy'
import { Icon } from './icons'
import { MAIN_NAV, ESTATE_NAV, ROUTES, TITLES, type Route } from './routes'
import { BottleSheet } from './BottleSheet'
import { BottleForm } from './BottleForm'
import { Wizard } from './Wizard'
import { CommandPalette } from './CommandPalette'
import { Overview } from './pages/Overview'
import { Cellar } from './pages/Cellar'
import { Windows } from './pages/Windows'
import { Book } from './pages/Book'
import { Valuation } from './pages/Valuation'
import { Security } from './pages/Security'
import { Market } from './pages/Market'
import { WineDetail } from './WineDetail'
import { loadSeedCellar, toCellarBottle, type CatalogWine } from './catalog'
import {
  eraseCellar,
  exportCsv,
  exportJson,
  loadCellar,
  loadPrefs,
  saveCellar,
  savePrefs,
  unlockCellar,
  type Prefs,
} from './store'
import type { EncryptedBlob } from './crypto'
import { HAS_CRYPTO } from './crypto'

function readRoute(): Route {
  if (typeof window === 'undefined') return 'tonight'
  const raw = window.location.hash.replace(/^#\/?/, '')
  return (ROUTES as readonly string[]).includes(raw) ? (raw as Route) : 'tonight'
}

interface Toast {
  title: string
  body: string
  detail: string
}

type Phase = 'loading' | 'locked' | 'ready'

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [bottles, setBottles] = useState<Bottle[]>([])
  const [log, setLog] = useState<Pour[]>([])
  const [passcode, setPasscode] = useState<string | null>(null)
  const [blob, setBlob] = useState<EncryptedBlob | null>(null)
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs())
  const [route, setRoute] = useState<Route>(readRoute)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [catalogWine, setCatalogWine] = useState<CatalogWine | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  /* ---------- boot ---------- */
  useEffect(() => {
    const res = loadCellar()
    if (res.kind === 'encrypted') {
      setBlob(res.blob)
      setPhase('locked')
      return
    }
    if (res.kind === 'plain') {
      setBottles(res.data.bottles)
      setLog(res.data.log)
      setPhase('ready')
      return
    }
    void loadSeedCellar()
      .then((seed) => setBottles(seed))
      .catch(() => setBottles([]))
      .finally(() => setPhase('ready'))
  }, [])

  /* ---------- persist ---------- */
  useEffect(() => {
    if (phase !== 'ready') return
    void saveCellar({ bottles, log }, passcode)
  }, [bottles, log, passcode, phase])

  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])

  /* ---------- routing ---------- */
  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute())
      setMenuOpen(false)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function go(next: Route) {
    setMenuOpen(false)
    if (readRoute() === next) {
      window.scrollTo({ top: 0 })
      return
    }
    window.location.hash = `#/${next}`
  }

  /* ---------- palette ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ---------- toast ---------- */
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 7000)
    return () => window.clearTimeout(t)
  }, [toast])

  /* ---------- lock ---------- */
  async function lock() {
    if (!passcode) return
    await saveCellar({ bottles, log }, passcode)
    const res = loadCellar()
    if (res.kind === 'encrypted') {
      setBlob(res.blob)
      setBottles([])
      setLog([])
      setPhase('locked')
      setActiveId(null)
      setAdding(false)
      setEditingId(null)
      setPaletteOpen(false)
      setTourOpen(false)
    }
  }

  useEffect(() => {
    if (phase !== 'ready' || !passcode || prefs.autoLockMinutes <= 0) return
    const ms = prefs.autoLockMinutes * 60_000
    let timer = window.setTimeout(() => {
      void lock()
    }, ms)
    const bump = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        void lock()
      }, ms)
    }
    window.addEventListener('pointerdown', bump)
    window.addEventListener('keydown', bump)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointerdown', bump)
      window.removeEventListener('keydown', bump)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, passcode, prefs.autoLockMinutes])

  async function unlock(pass: string): Promise<boolean> {
    if (!blob) return false
    try {
      const data = await unlockCellar(pass, blob)
      setBottles(data.bottles)
      setLog(data.log)
      setPasscode(pass)
      setBlob(null)
      setPhase('ready')
      return true
    } catch {
      return false
    }
  }

  async function enablePasscode(pass: string) {
    await saveCellar({ bottles, log }, pass)
    setPasscode(pass)
    setToast({
      title: 'The cellar is encrypted',
      body: 'AES-256-GCM, keyed from your passcode. It is never stored and never sent.',
      detail: 'Auto-lock is available in Privacy & security.',
    })
  }

  function disablePasscode() {
    const ok = window.confirm(
      'Turn off encryption? The cellar will be stored on this device as plain text.',
    )
    if (!ok) return
    setPasscode(null)
    setToast({
      title: 'Encryption is off',
      body: 'Your cellar is still local to this device, but it is no longer sealed.',
      detail: 'You can turn the passcode back on at any time.',
    })
  }

  function wipe() {
    eraseCellar()
    setBottles([])
    setLog([])
    setPasscode(null)
    setBlob(null)
    setPhase('ready')
    setToast({
      title: 'Cellar erased',
      body: 'Every bottle, note and window has been deleted from this device.',
      detail: 'Nothing was ever held anywhere else.',
    })
  }

  /* ---------- cellar actions ---------- */
  function openBottle(bottle: Bottle) {
    if (bottle.quantity === 0) return
    const next = bottle.quantity - 1
    setBottles((prev) => prev.map((b) => (b.id === bottle.id ? { ...b, quantity: next } : b)))
    setLog((prev) => [
      {
        id: crypto.randomUUID(),
        bottleId: bottle.id,
        producer: bottle.producer,
        cuvee: bottle.cuvee,
        vintage: bottle.vintage,
        at: Date.now(),
        note: '',
        value: bottle.marketValue,
      },
      ...prev,
    ])
    setToast({
      title: `Opened — ${bottle.producer} ${bottle.vintage}`,
      body:
        next === 0
          ? 'The last one. Recorded in your cellar book.'
          : `Recorded in your cellar book. ${next} ${plural(next, 'bottle')} remain.`,
      detail: bottle.serving,
    })
    if (next === 0) setActiveId(null)
  }

  function addOne(bottle: Bottle) {
    setBottles((prev) =>
      prev.map((b) => (b.id === bottle.id ? { ...b, quantity: b.quantity + 1 } : b)),
    )
    setToast({
      title: `One more ${bottle.producer}`,
      body: 'Added to the count. Nothing else to fill in.',
      detail: reason(bottle),
    })
  }

  function removeBottles(bottle: Bottle, count: number) {
    const left = Math.max(0, bottle.quantity - count)
    const unit = bottle.format.toLowerCase()
    setBottles((prev) =>
      prev
        .map((b) => (b.id === bottle.id ? { ...b, quantity: left } : b))
        .filter((b) => b.quantity > 0),
    )
    setActiveId(null)
    setToast({
      title: `Removed — ${bottle.producer} ${bottle.vintage}`,
      body:
        left > 0
          ? `${count} ${plural(count, unit, `${unit}s`)} taken out of the register. ${left} remain.`
          : 'The last bottle is out of the register.',
      detail: 'Removal leaves no entry in the cellar book.',
    })
  }

  function saveBottle(bottle: Bottle) {
    const wasEditing = Boolean(editingId)
    setBottles((prev) => {
      const exists = prev.some((b) => b.id === bottle.id)
      return exists ? prev.map((b) => (b.id === bottle.id ? bottle : b)) : [bottle, ...prev]
    })
    setAdding(false)
    setEditingId(null)
    setActiveId(null)
    setToast({
      title: wasEditing
        ? `Saved — ${bottle.producer} ${bottle.vintage}`
        : `Added — ${bottle.producer} ${bottle.vintage}`,
      body: wasEditing
        ? 'The record has been amended. Its window and value are updated.'
        : 'Your drinking window is set and the cellar is updated.',
      detail: reason(bottle),
    })
  }

  function setLogNote(id: string, note: string) {
    setLog((prev) => prev.map((p) => (p.id === id ? { ...p, note } : p)))
  }

  /** Where this owner actually keeps wine — used when adding from the market. */
  function usualLocation(): string {
    const counts = new Map<string, number>()
    for (const b of bottles) counts.set(b.location, (counts.get(b.location) ?? 0) + b.quantity)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Home, Dining Room'
  }

  async function restoreDemo() {
    try {
      setBottles(await loadSeedCellar())
      setToast({
        title: 'Sample cellar restored',
        body: 'The generated selection of benchmark wines is back, with its windows and values.',
        detail: 'Replace it with your own whenever you like.',
      })
    } catch {
      setToast({
        title: 'Sample cellar unavailable',
        body: 'The generated cellar file could not be loaded.',
        detail: 'Run npm run catalog to regenerate it.',
      })
    }
  }

  function addFromCatalog(wine: CatalogWine) {
    const location = usualLocation()
    const bottle = toCellarBottle(wine, location)
    setBottles((prev) => [bottle, ...prev])
    setCatalogWine(null)
    setActiveId(bottle.id)
    setToast({
      title: `Added — ${wine.producer} ${wine.vintage}`,
      body: `One bottle, stored at ${location}.`,
      detail: 'Change the quantity or location with Edit details.',
    })
  }

  function finishTour(withForm = false) {
    setPrefs((p) => ({ ...p, onboarded: true }))
    setTourOpen(false)
    if (withForm) setAdding(true)
  }

  const stats = useMemo(() => cellarStats(bottles), [bottles])
  const active = bottles.find((b) => b.id === activeId) ?? null
  const editing = bottles.find((b) => b.id === editingId) ?? null
  const locations = useMemo(
    () => Array.from(new Set(bottles.map((b) => b.location))).sort(),
    [bottles],
  )
  const showWizard = phase === 'ready' && (tourOpen || !prefs.onboarded)

  /* ---------- screens ---------- */
  if (phase === 'loading') {
    return (
      <div className="gate">
        <div className="gate-mark">
          <Icon name="cellar" size={26} />
        </div>
        <p className="gate-title">Opening the cellar</p>
      </div>
    )
  }

  if (phase === 'locked') {
    return <LockScreen onUnlock={unlock} onErase={wipe} />
  }

  const navCount = (r: Route): number | undefined => {
    if (r === 'cellar') return bottles.filter((b) => b.quantity > 0).length
    if (r === 'book') return log.length || undefined
    if (r === 'windows') return stats.atPeakWines || undefined
    return undefined
  }

  const page = (() => {
    switch (route) {
      case 'tonight':
        return (
          <Overview
            bottles={bottles}
            registerNo={prefs.registerNo}
            onSelect={(b) => setActiveId(b.id)}
            onOpen={openBottle}
            onGoCellar={() => go('cellar')}
          />
        )
      case 'cellar':
        return (
          <Cellar
            bottles={bottles}
            onSelect={(b) => setActiveId(b.id)}
            onAdd={() => setAdding(true)}
            onRestoreDemo={() => void restoreDemo()}
          />
        )
      case 'market':
        return <Market onOpenWine={setCatalogWine} />
      case 'windows':
        return <Windows bottles={bottles} onSelect={(b) => setActiveId(b.id)} />
      case 'book':
        return <Book log={log} onNote={setLogNote} />
      case 'valuation':
        return (
          <Valuation
            bottles={bottles}
            onSelect={(b) => setActiveId(b.id)}
            onExportCsv={() => exportCsv({ bottles, log })}
          />
        )
      case 'security':
        return (
          <Security
            passcode={passcode}
            hasCrypto={HAS_CRYPTO}
            prefs={prefs}
            bottleCount={stats.bottles}
            onEnable={enablePasscode}
            onDisable={disablePasscode}
            onLock={() => void lock()}
            onDiscreet={(v) => setPrefs((p) => ({ ...p, discreet: v }))}
            onAutoLock={(m) => setPrefs((p) => ({ ...p, autoLockMinutes: m }))}
            onExportCsv={() => exportCsv({ bottles, log })}
            onExportJson={() => exportJson({ bottles, log })}
            onErase={wipe}
          />
        )
    }
  })()

  return (
    <DiscretionContext.Provider value={prefs.discreet}>
      <div className="shell">
        {menuOpen && <div className="side-scrim" onClick={() => setMenuOpen(false)} />}

        <aside className={`sidebar${menuOpen ? ' is-open' : ''}`}>
          <div className="side-head">
            <button className="wordmark" onClick={() => go('tonight')} type="button">
              <span className="monogram" aria-hidden="true">
                <Icon name="cellar" size={20} />
              </span>
              <span className="wordmark-text">
                Cellar Atlas
                <em>Private cellar intelligence</em>
              </span>
            </button>
            <button
              className="icon-btn side-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <Icon name="close" />
            </button>
          </div>

          <nav className="side-nav">
            <p className="side-label">Cellar</p>
            {MAIN_NAV.map((item) => (
              <button
                key={item.route}
                className={`side-link${route === item.route ? ' is-active' : ''}`}
                onClick={() => go(item.route)}
                type="button"
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {navCount(item.route) !== undefined && (
                  <span className="side-count">{navCount(item.route)}</span>
                )}
              </button>
            ))}

            <p className="side-label">Estate</p>
            {ESTATE_NAV.map((item) => (
              <button
                key={item.route}
                className={`side-link${route === item.route ? ' is-active' : ''}`}
                onClick={() => go(item.route)}
                type="button"
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}

            <p className="side-label">The house</p>
            <button className="side-link" onClick={() => setTourOpen(true)} type="button">
              <Icon name="book" />
              <span>Take the introduction</span>
            </button>
          </nav>

          <div className="side-foot">
            <div className="side-register">
              <span className="side-register-label">Private register</span>
              <span className="side-register-no">
                № {String(prefs.registerNo).padStart(4, '0')}
              </span>
            </div>
            <div className="side-status">
              <Icon name={passcode ? 'shieldCheck' : 'eye-off'} size={16} />
              <div>
                <strong>{passcode ? 'Encrypted on this device' : 'Local to this device'}</strong>
                <span>{passcode ? 'AES-256 · passcode required' : 'No account · no server'}</span>
              </div>
            </div>
            {passcode ? (
              <button className="btn btn-outline btn-small side-lock" onClick={() => void lock()}>
                <Icon name="lock" size={13} />
                Lock now
              </button>
            ) : (
              <button className="btn btn-ghost btn-small side-lock" onClick={() => go('security')}>
                Turn on encryption
              </button>
            )}
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <button
              className="icon-btn menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Icon name="menu" />
            </button>

            <div className="crumb">
              <span>Cellar</span>
              <Icon name="chev" size={13} />
              <strong>{TITLES[route]}</strong>
            </div>

            <div className="top-actions">
              <button
                className="search-trigger"
                onClick={() => setPaletteOpen(true)}
                aria-label="Search the cellar"
                type="button"
              >
                <Icon name="search" size={15} />
                <span>Search</span>
                <kbd>⌘K</kbd>
              </button>
              <button
                className={`discreet${prefs.discreet ? ' is-on' : ''}`}
                onClick={() => setPrefs((p) => ({ ...p, discreet: !p.discreet }))}
                title="Hide every monetary value"
                type="button"
              >
                <Icon name={prefs.discreet ? 'eye-off' : 'eye'} size={15} />
                <span>{prefs.discreet ? 'Values hidden' : 'Discretion'}</span>
              </button>
              <button className="btn btn-outline btn-small" onClick={() => setAdding(true)}>
                <Icon name="plus" size={14} />
                Add bottle
              </button>
            </div>
          </header>

          <main className="view">{page}</main>
        </div>
      </div>

      {active && (
        <BottleSheet
          bottle={active}
          onClose={() => setActiveId(null)}
          onOpen={() => openBottle(active)}
          onAdd={() => addOne(active)}
          onEdit={() => {
            setEditingId(active.id)
            setActiveId(null)
          }}
          onRemove={(count) => removeBottles(active, count)}
        />
      )}

      {(adding || editing) && (
        <BottleForm
          locations={locations}
          initial={editing ?? undefined}
          onClose={() => {
            setAdding(false)
            setEditingId(null)
          }}
          onSave={saveBottle}
        />
      )}

      {catalogWine && (
        <WineDetail
          wine={catalogWine}
          onClose={() => setCatalogWine(null)}
          onAdd={() => addFromCatalog(catalogWine)}
        />
      )}

      {paletteOpen && (
        <CommandPalette
          bottles={bottles}
          hasPasscode={Boolean(passcode)}
          onClose={() => setPaletteOpen(false)}
          onSelect={(b) => setActiveId(b.id)}
          onGo={go}
          onAdd={() => setAdding(true)}
          onTour={() => setTourOpen(true)}
          onLock={() => void lock()}
        />
      )}

      {showWizard && (
        <Wizard
          registerNo={prefs.registerNo}
          openedOn={prefs.openedOn}
          bottleCount={stats.bottles}
          sample={bottles[0]}
          onFinish={() => finishTour(false)}
          onAddFirst={() => finishTour(true)}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <div className="toast-mark" aria-hidden="true">
            <Icon name="cellar" size={20} />
          </div>
          <div className="toast-body">
            <p className="toast-title">{toast.title}</p>
            <p className="toast-text">{toast.body}</p>
            <p className="toast-serving">{toast.detail}</p>
          </div>
          <button className="toast-close" onClick={() => setToast(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
    </DiscretionContext.Provider>
  )
}

function LockScreen({
  onUnlock,
  onErase,
}: {
  onUnlock: (pass: string) => Promise<boolean>
  onErase: () => void
}) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    input.current?.focus()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!value) return
    setBusy(true)
    setError('')
    const ok = await onUnlock(value)
    setBusy(false)
    if (!ok) {
      setError('That passcode does not open this cellar.')
      setValue('')
    }
  }

  return (
    <div className="gate">
      <form className="gate-card" onSubmit={submit}>
        <div className="gate-mark">
          <Icon name="lock" size={22} />
        </div>
        <p className="eyebrow">Cellar Atlas</p>
        <h1 className="gate-title">Unlock your cellar</h1>
        <p className="gate-copy">
          This cellar is encrypted on this device. There is no reset link — the passcode is the only
          key.
        </p>

        <input
          ref={input}
          type="password"
          className="gate-input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError('')
          }}
          placeholder="Passcode"
          autoComplete="current-password"
          aria-label="Passcode"
        />

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn-primary gate-btn" type="submit" disabled={busy || !value}>
          {busy ? 'Opening…' : 'Unlock'}
        </button>

        <button
          className="link-btn gate-link"
          type="button"
          onClick={() => {
            if (window.confirm('Erase this cellar? The encrypted record will be deleted.')) onErase()
          }}
        >
          Erase and start fresh
        </button>
      </form>
    </div>
  )
}
