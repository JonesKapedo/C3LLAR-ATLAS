import { useMemo, useState } from 'react'
import type { Bottle, Readiness } from '../types'
import { atRisk, cellarStats, holdingValue, readiness, urgency } from '../logic'
import { BottleRow, Empty, PageHeader } from '../ui'
import { useMoney } from '../privacy'
import { Icon } from '../icons'

type Filter = 'all' | 'peak' | 'approaching' | 'hold' | 'risk'
type Sort = 'urgency' | 'value' | 'vintage' | 'name'

const FILTERS: Array<[Filter, string]> = [
  ['all', 'All'],
  ['peak', 'At peak'],
  ['approaching', 'Approaching'],
  ['hold', 'Holding'],
  ['risk', 'Past peak'],
]

export function Cellar({
  bottles,
  onSelect,
  onAdd,
  onRestoreDemo,
}: {
  bottles: Bottle[]
  onSelect: (b: Bottle) => void
  onAdd: () => void
  onRestoreDemo: () => void
}) {
  const money = useMoney()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('urgency')

  const stats = useMemo(() => cellarStats(bottles), [bottles])
  const live = useMemo(() => bottles.filter((b) => b.quantity > 0), [bottles])

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, peak: 0, approaching: 0, hold: 0, risk: 0 }
    for (const b of live) {
      c.all += 1
      const r = readiness(b)
      if (r === 'peak') c.peak += 1
      if (r === 'approaching') c.approaching += 1
      if (r === 'hold') c.hold += 1
      if (r === 'fading' || r === 'past') c.risk += 1
    }
    return c
  }, [live])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (r: Readiness) => {
      if (filter === 'all') return true
      if (filter === 'risk') return r === 'fading' || r === 'past'
      return r === filter
    }
    return live
      .filter((b) => {
        if (!matches(readiness(b))) return false
        if (!q) return true
        return `${b.producer} ${b.cuvee} ${b.vintage} ${b.region} ${b.location} ${b.country}`
          .toLowerCase()
          .includes(q)
      })
      .sort((a, b) => {
        if (sort === 'value') return holdingValue(b) - holdingValue(a)
        if (sort === 'vintage') return a.vintage - b.vintage
        if (sort === 'name') return a.producer.localeCompare(b.producer)
        return urgency(b) - urgency(a) || holdingValue(b) - holdingValue(a)
      })
  }, [live, filter, sort, query])

  const atRiskWines = atRisk(bottles)

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="The cellar"
        description={
          <>
            {stats.wines} wines · {stats.bottles} bottles · {money(stats.value)} at today’s
            estimates
          </>
        }
        actions={
          <button className="btn btn-primary" onClick={onAdd}>
            <Icon name="plus" size={15} />
            Add a bottle
          </button>
        }
      />

      <div className="toolbar">
        <label className="search">
          <Icon name="search" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search producer, region or location"
            aria-label="Search the cellar"
          />
        </label>
        <label className="sort">
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="urgency">Urgency</option>
            <option value="value">Value</option>
            <option value="vintage">Vintage</option>
            <option value="name">Producer</option>
          </select>
        </label>
      </div>

      <div className="chips" role="group" aria-label="Filter by readiness">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            className={`chip${filter === key ? ' is-active' : ''}`}
            onClick={() => setFilter(key)}
            type="button"
          >
            {label}
            <span className="chip-count">{counts[key]}</span>
          </button>
        ))}
        {atRiskWines.length > 0 && (
          <span className="chip-note">
            <Icon name="alert" size={13} />
            {money(atRiskWines.reduce((s, b) => s + holdingValue(b), 0))} declining
          </span>
        )}
      </div>

      <div className="brow-head" aria-hidden="true">
        <span>Wine</span>
        <span>Drinking window</span>
        <span>Status</span>
        <span className="brow-head-right">Holding</span>
      </div>

      <div className="brows">
        {visible.map((b) => (
          <BottleRow key={b.id} bottle={b} onSelect={() => onSelect(b)} />
        ))}
        {visible.length === 0 &&
          (query || filter !== 'all' ? (
            <Empty>Nothing matches that. Try a broader search.</Empty>
          ) : (
            <div className="empty-block">
              <Empty>The cellar is empty.</Empty>
              <div className="row-actions">
                <button className="btn btn-primary btn-small" onClick={onAdd}>
                  Add a bottle
                </button>
                <button className="btn btn-ghost btn-small" onClick={onRestoreDemo}>
                  Load the sample cellar
                </button>
              </div>
            </div>
          ))}
      </div>

      <p className="table-foot">
        Showing {visible.length} of {live.length} wines. Values are indicative market estimates, not
        appraisals for insurance.
      </p>
    </>
  )
}
