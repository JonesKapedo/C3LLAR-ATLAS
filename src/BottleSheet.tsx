import { useEffect, useState } from 'react'
import type { Bottle } from './types'
import { WindowBar, ReadinessPill } from './ui'
import { READINESS_COPY, costValue, holdingValue, plural, readiness, reason } from './logic'
import { useMoney } from './privacy'
import { Icon } from './icons'

export function BottleSheet({
  bottle,
  onClose,
  onOpen,
  onAdd,
  onEdit,
  onRemove,
}: {
  bottle: Bottle
  onClose: () => void
  onOpen: () => void
  onAdd: () => void
  onEdit: () => void
  onRemove: (count: number) => void
}) {
  const money = useMoney()
  const r = readiness(bottle)
  const gain = holdingValue(bottle) - costValue(bottle)
  const unit = bottle.format.toLowerCase()
  const units = plural(bottle.quantity, unit, `${unit}s`)

  const [mode, setMode] = useState<'idle' | 'removing'>('idle')
  const [count, setCount] = useState(1)

  useEffect(() => setMode('idle'), [bottle.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode === 'removing') setMode('idle')
        else onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, mode])

  const clamp = (n: number) => Math.max(1, Math.min(bottle.quantity, Math.round(n) || 1))

  return (
    <div className="sheet-scrim" onClick={onClose} role="presentation">
      <aside
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${bottle.producer} ${bottle.cuvee} ${bottle.vintage}`}
      >
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          <span />
          <span />
        </button>

        <div className="sheet-body">
          <p className="eyebrow">
            {bottle.vintage} · {bottle.region}
          </p>
          <h2 className="sheet-title">{bottle.producer}</h2>
          <p className="sheet-cuvee">{bottle.cuvee}</p>

          <div className="sheet-meta">
            <ReadinessPill r={r} />
            <span className="sheet-reason">{reason(bottle)}</span>
          </div>

          <div className="sheet-window">
            <WindowBar bottle={bottle} />
          </div>

          <p className="sheet-copy">{READINESS_COPY[r]}</p>

          <div className="sheet-figures">
            <div>
              <span className="fig-label">Per {unit}</span>
              <span className="fig-value">{money(bottle.marketValue)}</span>
            </div>
            <div>
              <span className="fig-label">Holding</span>
              <span className="fig-value">{money(holdingValue(bottle))}</span>
            </div>
            <div>
              <span className="fig-label">Cost</span>
              <span className="fig-value">{money(costValue(bottle))}</span>
            </div>
            <div>
              <span className="fig-label">Unrealised</span>
              <span className={`fig-value ${gain >= 0 ? 'pos' : 'neg'}`}>
                {gain >= 0 ? '+' : '−'}
                {money(Math.abs(gain))}
              </span>
            </div>
          </div>

          <dl className="sheet-list">
            <div>
              <dt>Stored at</dt>
              <dd>{bottle.location}</dd>
            </div>
            <div>
              <dt>Held</dt>
              <dd>
                {bottle.quantity} {units}
              </dd>
            </div>
            <div>
              <dt>Origin</dt>
              <dd>{bottle.country}</dd>
            </div>
          </dl>

          <div className="sheet-note">
            <span className="note-label">If you open it</span>
            <p>{bottle.serving}</p>
          </div>

          <div className="sheet-note sheet-note-quiet">
            <span className="note-label">From the cellar book</span>
            <p>{bottle.note}</p>
          </div>

          {mode === 'idle' ? (
            <>
              <div className="sheet-actions">
                <button
                  className="btn btn-primary"
                  onClick={onOpen}
                  disabled={bottle.quantity === 0}
                >
                  {bottle.quantity === 0 ? 'Cellar exhausted' : 'Open a bottle'}
                </button>
                <button className="btn btn-ghost" onClick={onAdd}>
                  Add one
                </button>
              </div>

              <div className="sheet-secondary">
                <button className="text-btn" onClick={onEdit} type="button">
                  <Icon name="edit" size={14} />
                  Edit details
                </button>
                <button
                  className="text-btn is-danger"
                  onClick={() => {
                    setCount(1)
                    setMode('removing')
                  }}
                  type="button"
                >
                  <Icon name="trash" size={14} />
                  Remove
                </button>
              </div>

              <p className="sheet-hint">
                Opening a bottle records it in your cellar book and adjusts the count. Removing takes
                bottles out of the register entirely.
              </p>
            </>
          ) : (
            <div className="remove-panel">
              <p className="eyebrow">Remove from the cellar</p>
              <p className="remove-copy">
                How many of the {bottle.quantity} {units}?
              </p>

              <div className="stepper">
                <button
                  type="button"
                  onClick={() => setCount(clamp(count - 1))}
                  aria-label="One fewer"
                >
                  −
                </button>
                <input
                  value={count}
                  onChange={(e) => setCount(clamp(Number(e.target.value)))}
                  inputMode="numeric"
                  aria-label="Bottles to remove"
                />
                <button
                  type="button"
                  onClick={() => setCount(clamp(count + 1))}
                  aria-label="One more"
                >
                  +
                </button>
              </div>

              <div className="row-actions">
                <button className="btn btn-danger" onClick={() => onRemove(count)}>
                  {count >= bottle.quantity
                    ? `Remove all ${bottle.quantity}`
                    : `Remove ${count} ${plural(count, unit, `${unit}s`)}`}
                </button>
                <button className="btn btn-ghost" onClick={() => setMode('idle')}>
                  Cancel
                </button>
              </div>

              <p className="sheet-hint">
                Removal leaves no entry in the cellar book. If the bottle was drunk, open it instead.
              </p>
            </div>
          )}

          <p className="sheet-disclaimer">
            Values are indicative market estimates for this demonstration, not an appraisal for
            insurance.
          </p>
        </div>
      </aside>
    </div>
  )
}
