import { useMemo } from 'react'
import type { Bottle } from '../types'
import {
  atRisk,
  cellarStats,
  costValue,
  curatedTrio,
  featuredBottle,
  formatSigned,
  holdingValue,
  reason,
  windowPulse,
} from '../logic'
import { Empty, PageHeader, Panel, PickCard, Stat, WindowBar } from '../ui'
import { useMoney } from '../privacy'
import { Icon } from '../icons'

const HOUSE_NOTES = [
  'The best bottle in a cellar is the one that gets opened.',
  'A cellar is a library. Bottles are for reading aloud.',
  'Buy on the label. Drink on the calendar.',
  'No bottle improves forever. Most stop improving quietly.',
  'Serve the wine you have, not the wine you are saving.',
  'One bottle at the right moment outranks six at the wrong one.',
  'The cellar keeps what you do not drink. It cannot keep a decision.',
]

export function Overview({
  bottles,
  registerNo,
  onSelect,
  onOpen,
  onGoCellar,
}: {
  bottles: Bottle[]
  registerNo: number
  onSelect: (b: Bottle) => void
  onOpen: (b: Bottle) => void
  onGoCellar: () => void
}) {
  const money = useMoney()
  const stats = useMemo(() => cellarStats(bottles), [bottles])
  const pulse = useMemo(() => windowPulse(bottles), [bottles])
  const featured = useMemo(() => featuredBottle(bottles), [bottles])
  const trio = useMemo(() => curatedTrio(bottles, featured?.id), [bottles, featured])
  const declining = useMemo(() => atRisk(bottles), [bottles])

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <>
      <PageHeader
        eyebrow="Private cellar"
        title="Tonight"
        description={
          <>
            One question, answered every evening: <strong>which bottle should be open
            tonight?</strong> <span className="view-meta">{today} · {stats.wines} wines ·{' '}
            {stats.bottles} bottles · {stats.locations} locations</span>
          </>
        }
        actions={
          declining.length > 0 ? (
            <button className="btn btn-outline" onClick={onGoCellar}>
              <Icon name="alert" />
              {declining.length} need attention
            </button>
          ) : undefined
        }
      />

      {featured ? (
        <section className="spotlight">
          <div className="spotlight-main">
            <p className="eyebrow">Open tonight</p>
            <p className="spotlight-vintage">{featured.vintage}</p>
            <h2 className="spotlight-name">{featured.producer}</h2>
            <p className="spotlight-cuvee">{featured.cuvee}</p>
            <p className="spotlight-place">
              {featured.region} · {featured.location}
            </p>
            <div className="spotlight-window">
              <WindowBar bottle={featured} />
            </div>
            <p className="spotlight-why">{reason(featured)}</p>
            <div className="spotlight-actions">
              <button className="btn btn-primary" onClick={() => onOpen(featured)}>
                Open this bottle
              </button>
              <button className="btn btn-ghost" onClick={() => onSelect(featured)}>
                Full record
                <Icon name="arrow" size={15} />
              </button>
            </div>
          </div>
          <aside className="spotlight-side">
            <div className="side-fig">
              <span className="fig-label">Holding value</span>
              <span className="side-fig-value">{money(holdingValue(featured))}</span>
            </div>
            <div className="side-fig">
              <span className="fig-label">Unrealised</span>
              <span className="side-fig-value pos">
                {formatSigned(holdingValue(featured) - costValue(featured))}
              </span>
            </div>
            <div className="side-fig">
              <span className="fig-label">In the cellar</span>
              <span className="side-fig-value">{featured.quantity}</span>
            </div>
            <div className="side-fig">
              <span className="fig-label">If you open it</span>
              <span className="side-fig-note">{featured.serving}</span>
            </div>
          </aside>
        </section>
      ) : (
        <Empty>The cellar is empty. Add a bottle to begin.</Empty>
      )}

      <div className="stat-grid">
        <Stat
          label="Cellar value"
          value={money(stats.value)}
          detail={`${stats.bottles} bottles across ${stats.locations} locations`}
        />
        <Stat
          label="At peak now"
          value={String(stats.atPeakBottles)}
          detail={`bottles from ${stats.atPeakWines} wines ready to drink`}
          tone="gold"
        />
        <Stat
          label="Past its peak"
          value={money(stats.atRiskValue)}
          detail={`${stats.atRiskBottles} bottles losing ground`}
          tone="wine"
        />
        <Stat
          label="Unrealised gain"
          value={stats.gain >= 0 ? formatSigned(stats.gain) : money(stats.gain)}
          detail={`${(stats.gainPct * 100).toFixed(0)}% above cost`}
          tone="sage"
        />
      </div>

      <Panel
        title="Tonight’s three"
        hint="One to open, one to watch, one to rescue — chosen by the calendar, not the price list."
        actions={
          <span className="panel-aside">
            {pulse.enteringWines} entering peak · {pulse.leavingWines} leaving
          </span>
        }
        flush
      >
        <div className="picks">
          {trio.map((b, i) => (
            <PickCard key={b.id} bottle={b} rank={i + 1} onSelect={() => onSelect(b)} />
          ))}
        </div>
      </Panel>

      <footer className="house-note">
        <span className="house-note-label">House note</span>
        <p>{HOUSE_NOTES[Math.floor(Date.now() / 86_400_000) % HOUSE_NOTES.length]}</p>
        <span className="house-note-reg">Private register № {String(registerNo).padStart(4, '0')}</span>
      </footer>

      {declining.length > 0 && (
        <Panel
          title="Losing ground"
          hint={`${money(stats.atRiskValue)} of wine is past its peak. Every month it stays shut, it is worth a little less.`}
          actions={
            <button className="btn btn-ghost btn-small" onClick={onGoCellar}>
              Review all
              <Icon name="arrow" size={14} />
            </button>
          }
          flush
        >
          <div className="brows">
            {declining.slice(0, 3).map((b) => (
              <button key={b.id} className="brow brow-compact" onClick={() => onSelect(b)}>
                <span className="brow-main">
                  <span className="brow-title">
                    {b.producer}
                    <span className="brow-vintage">{b.vintage}</span>
                  </span>
                  <span className="brow-sub">{b.cuvee}</span>
                </span>
                <span className="brow-window">
                  <span className="brow-reason">{reason(b)}</span>
                </span>
                <span className="brow-value">
                  <span className="brow-money">{money(holdingValue(b))}</span>
                  <span className="brow-units">{b.quantity} bt</span>
                </span>
              </button>
            ))}
          </div>
        </Panel>
      )}
    </>
  )
}
