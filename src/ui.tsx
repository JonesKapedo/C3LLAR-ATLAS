import type { ReactNode } from 'react'
import type { Bottle, Readiness } from './types'
import {
  CURRENT_YEAR,
  READINESS_LABEL,
  holdingValue,
  plural,
  readiness,
  reason,
  type WindowFields,
} from './logic'
import { useMoney } from './privacy'

export function ReadinessPill({ r }: { r: Readiness }) {
  return <span className={`pill pill-${r}`}>{READINESS_LABEL[r]}</span>
}

/** The drinking window drawn to scale, with a marker for today. */
export function WindowBar({
  bottle,
  compact = false,
}: {
  bottle: WindowFields
  compact?: boolean
}) {
  const start = bottle.firstDrink
  const end = Math.max(bottle.lastDrink, start + 1)
  const span = end - start
  const pct = (y: number) => Math.min(100, Math.max(0, ((y - start) / span) * 100))

  const peakStart = pct(bottle.peakFrom)
  const peakEnd = pct(bottle.peakTo)
  const now = pct(CURRENT_YEAR)
  const nowInside = CURRENT_YEAR >= start && CURRENT_YEAR <= end

  return (
    <div className={`wbar${compact ? ' wbar-compact' : ''}`}>
      <div className="wbar-track" aria-hidden="true">
        <div className="wbar-early" style={{ left: 0, width: `${peakStart}%` }} />
        <div className="wbar-peak" style={{ left: `${peakStart}%`, width: `${peakEnd - peakStart}%` }} />
        <div className="wbar-late" style={{ left: `${peakEnd}%`, width: `${100 - peakEnd}%` }} />
        {nowInside && <div className="wbar-now" style={{ left: `${now}%` }} />}
      </div>
      {!compact && (
        <div className="wbar-legend">
          <span>
            First pour <b>{bottle.firstDrink}</b>
          </span>
          <span className="wbar-mid">
            Peak <b>{bottle.peakFrom}–{bottle.peakTo}</b>
          </span>
          <span>
            Last call <b>{bottle.lastDrink}</b>
          </span>
        </div>
      )}
    </div>
  )
}

export function Stat({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string
  value: string
  detail: string
  tone?: 'default' | 'gold' | 'wine' | 'sage'
}) {
  return (
    <div className={`stat stat-${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-detail">{detail}</span>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="view-head">
      <div className="view-head-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="view-title">{title}</h1>
        {description && <p className="view-desc">{description}</p>}
      </div>
      {actions && <div className="view-actions">{actions}</div>}
    </header>
  )
}

export function Panel({
  title,
  hint,
  actions,
  children,
  flush = false,
}: {
  title?: string
  hint?: string
  actions?: ReactNode
  children: ReactNode
  flush?: boolean
}) {
  return (
    <section className={`panel${flush ? ' panel-flush' : ''}`}>
      {(title || actions) && (
        <div className="panel-head">
          <div>
            {title && <h2 className="panel-title">{title}</h2>}
            {hint && <p className="panel-hint">{hint}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </section>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>
}

export function BottleRow({ bottle, onSelect }: { bottle: Bottle; onSelect: () => void }) {
  const money = useMoney()
  const r = readiness(bottle)
  const unit = bottle.format.toLowerCase()
  return (
    <button className="brow" onClick={onSelect} type="button">
      <span className="brow-main">
        <span className="brow-title">
          {bottle.producer}
          <span className="brow-vintage">{bottle.vintage}</span>
        </span>
        <span className="brow-sub">{bottle.cuvee}</span>
        <span className="brow-place">
          {bottle.region} · {bottle.location}
        </span>
      </span>
      <span className="brow-window">
        <WindowBar bottle={bottle} compact />
        <span className="brow-reason">{reason(bottle)}</span>
      </span>
      <span className="brow-status">
        <ReadinessPill r={r} />
      </span>
      <span className="brow-value">
        <span className="brow-money">{money(holdingValue(bottle))}</span>
        <span className="brow-units">
          {bottle.quantity} {plural(bottle.quantity, unit, `${unit}s`)}
        </span>
      </span>
    </button>
  )
}

export function PickCard({
  bottle,
  rank,
  onSelect,
}: {
  bottle: Bottle
  rank: number
  onSelect: () => void
}) {
  const money = useMoney()
  return (
    <button className="pick" onClick={onSelect} type="button">
      <span className="pick-top">
        <span className="pick-rank">{String(rank).padStart(2, '0')}</span>
        <ReadinessPill r={readiness(bottle)} />
      </span>
      <span className="pick-name">{bottle.producer}</span>
      <span className="pick-cuvee">{bottle.cuvee}</span>
      <span className="pick-vintage">{bottle.vintage}</span>
      <span className="pick-window">
        <WindowBar bottle={bottle} compact />
      </span>
      <span className="pick-foot">
        <span className="pick-why">{reason(bottle)}</span>
        <span className="pick-price">{money(bottle.marketValue)}</span>
      </span>
    </button>
  )
}
