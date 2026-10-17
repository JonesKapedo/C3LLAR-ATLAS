import { useMemo, useState } from 'react'
import type { Bottle } from '../types'
import { CURRENT_YEAR, readiness, reason, windowPulse, cellarStats } from '../logic'
import { Empty, PageHeader, Stat } from '../ui'
import { useMoney } from '../privacy'
import { Icon } from '../icons'

const START = CURRENT_YEAR - 2
const END = CURRENT_YEAR + 28
const SPAN = END - START

const clamp = (y: number) => Math.min(END, Math.max(START, y))
const pos = (y: number) => ((clamp(y) - START) / SPAN) * 100
const seg = (from: number, to: number) => ({
  left: `${pos(from)}%`,
  width: `${Math.max(0, pos(to) - pos(from))}%`,
})

type Filter = 'all' | 'peak' | 'entering' | 'leaving' | 'risk'

const FILTERS: Array<[Filter, string]> = [
  ['all', 'All'],
  ['peak', 'At peak'],
  ['entering', 'Entering peak'],
  ['leaving', 'Leaving peak'],
  ['risk', 'Past peak'],
]

const TICKS = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR + i * 5)

export function Windows({
  bottles,
  onSelect,
}: {
  bottles: Bottle[]
  onSelect: (b: Bottle) => void
}) {
  const money = useMoney()
  const [filter, setFilter] = useState<Filter>('all')

  const pulse = useMemo(() => windowPulse(bottles), [bottles])
  const stats = useMemo(() => cellarStats(bottles), [bottles])

  const rows = useMemo(() => {
    const live = bottles.filter((b) => b.quantity > 0)
    const test = (b: Bottle) => {
      const r = readiness(b)
      if (filter === 'peak') return r === 'peak'
      if (filter === 'risk') return r === 'fading' || r === 'past'
      if (filter === 'entering') return b.peakFrom > CURRENT_YEAR && b.peakFrom <= CURRENT_YEAR + 1
      if (filter === 'leaving') return b.peakTo >= CURRENT_YEAR && b.peakTo < CURRENT_YEAR + 1
      return true
    }
    return live.filter(test).sort((a, b) => a.peakFrom - b.peakFrom || a.peakTo - b.peakTo)
  }, [bottles, filter])

  return (
    <>
      <PageHeader
        eyebrow="Timing"
        title="Drinking windows"
        description="Every wine on one calendar. Gold is the peak; the red tail is what patience costs."
        actions={
          <span className="panel-aside">
            <Icon name="windows" size={14} /> {START}–{END}
          </span>
        }
      />

      <div className="stat-grid">
        <Stat
          label="At peak now"
          value={String(pulse.peakBottles)}
          detail={`bottles from ${pulse.peakWines} wines`}
          tone="gold"
        />
        <Stat
          label="Entering peak"
          value={String(pulse.enteringBottles)}
          detail={`bottles over the next 12 months`}
        />
        <Stat
          label="Leaving peak"
          value={String(pulse.leavingBottles)}
          detail={`bottles need opening soon`}
          tone="wine"
        />
        <Stat
          label="Still holding"
          value={String(stats.bottles - pulse.peakBottles)}
          detail="bottles improving or in decline"
          tone="sage"
        />
      </div>

      <div className="chips">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            className={`chip${filter === key ? ' is-active' : ''}`}
            onClick={() => setFilter(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="timeline">
        <div className="tl-head">
          <span className="tl-gutter tl-gutter-head">Wine</span>
          <div className="tl-axis">
            {TICKS.map((y) => (
              <span key={y} className="tl-tick" style={{ left: `${pos(y)}%` }}>
                {y}
              </span>
            ))}
          </div>
        </div>

        {rows.map((b) => (
          <button key={b.id} className="tl-row" onClick={() => onSelect(b)} type="button">
            <span className="tl-gutter">
              <span className="tl-name">
                {b.producer}
                <span className="tl-vintage">{b.vintage}</span>
              </span>
              <span className="tl-meta">
                {b.quantity} bt · {b.location}
              </span>
            </span>
            <span className="tl-track" title={reason(b)}>
              <span className="tl-seg tl-improve" style={seg(b.firstDrink, b.peakFrom)} />
              <span className="tl-seg tl-peak" style={seg(b.peakFrom, b.peakTo)} />
              <span className="tl-seg tl-decline" style={seg(b.peakTo, b.lastDrink)} />
              <span className="tl-now" style={{ left: `${pos(CURRENT_YEAR)}%` }} />
            </span>
          </button>
        ))}

        {rows.length === 0 && <Empty>No wine in that category.</Empty>}
      </div>

      <div className="tl-legend">
        <span>
          <i className="sw sw-improve" /> Improving
        </span>
        <span>
          <i className="sw sw-peak" /> At peak
        </span>
        <span>
          <i className="sw sw-decline" /> In decline
        </span>
        <span>
          <i className="sw sw-now" /> Today
        </span>
        <span className="tl-legend-note">
          {rows.length} wines shown · {money(stats.value)} cellar
        </span>
      </div>
    </>
  )
}
