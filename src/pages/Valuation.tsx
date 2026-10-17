import { useMemo } from 'react'
import type { Bottle } from '../types'
import {
  atRisk,
  byLocation,
  cellarStats,
  costValue,
  formatSigned,
  holdingValue,
  reason,
} from '../logic'
import { Empty, PageHeader, Panel, Stat } from '../ui'
import { useMoney } from '../privacy'
import { Icon } from '../icons'

export function Valuation({
  bottles,
  onSelect,
  onExportCsv,
}: {
  bottles: Bottle[]
  onSelect: (b: Bottle) => void
  onExportCsv: () => void
}) {
  const money = useMoney()
  const stats = useMemo(() => cellarStats(bottles), [bottles])
  const places = useMemo(() => byLocation(bottles), [bottles])
  const declining = useMemo(() => atRisk(bottles), [bottles])
  const largest = useMemo(
    () =>
      bottles
        .filter((b) => b.quantity > 0)
        .sort((a, b) => holdingValue(b) - holdingValue(a))
        .slice(0, 6),
    [bottles],
  )
  const top = places[0]?.value ?? 1

  return (
    <>
      <PageHeader
        eyebrow="Estate"
        title="Valuation"
        description="What the cellar is worth today, where it is held, and what is quietly slipping."
        actions={
          <button className="btn btn-outline" onClick={onExportCsv}>
            <Icon name="download" size={15} />
            Export schedule
          </button>
        }
      />

      <div className="stat-grid">
        <Stat
          label="Total value"
          value={money(stats.value)}
          detail={`${stats.bottles} bottles · ${stats.wines} wines`}
          tone="gold"
        />
        <Stat
          label="Cost basis"
          value={money(stats.cost)}
          detail="what the cellar was bought for"
        />
        <Stat
          label="Unrealised gain"
          value={stats.gain >= 0 ? formatSigned(stats.gain) : money(stats.gain)}
          detail={`${(stats.gainPct * 100).toFixed(0)}% above cost`}
          tone="sage"
        />
        <Stat
          label="At risk"
          value={money(stats.atRiskValue)}
          detail={`${stats.atRiskBottles} bottles past their peak`}
          tone="wine"
        />
      </div>

      <Panel
        title="By location"
        hint="A cellar is only as useful as its geography. This is what sits where."
      >
        <table className="ltable">
          <thead>
            <tr>
              <th>Location</th>
              <th className="num">Wines</th>
              <th className="num">Bottles</th>
              <th className="num">Value</th>
              <th className="share-col">Share</th>
            </tr>
          </thead>
          <tbody>
            {places.map((p) => (
              <tr key={p.location}>
                <td>{p.location}</td>
                <td className="num">{p.wines}</td>
                <td className="num">{p.bottles}</td>
                <td className="num money">{money(p.value)}</td>
                <td className="share-col">
                  <span className="share">
                    <span className="share-fill" style={{ width: `${(p.value / top) * 100}%` }} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Largest holdings" hint="Concentration matters as much as total.">
        <table className="ltable">
          <thead>
            <tr>
              <th>Wine</th>
              <th>Readiness</th>
              <th className="num">Bottles</th>
              <th className="num">Value</th>
            </tr>
          </thead>
          <tbody>
            {largest.map((b) => (
              <tr key={b.id} className="ltable-row" onClick={() => onSelect(b)}>
                <td>
                  <span className="cell-wine">
                    {b.producer} <span className="cell-vintage">{b.vintage}</span>
                  </span>
                </td>
                <td className="cell-status">{reason(b)}</td>
                <td className="num">{b.quantity}</td>
                <td className="num money">{money(holdingValue(b))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel
        title="Declining holdings"
        hint="Still drinkable, no longer improving. This is the number to act on."
        actions={<span className="panel-aside">{money(stats.atRiskValue)}</span>}
      >
        {declining.length === 0 ? (
          <Empty>Nothing is past its peak. Rare, and worth enjoying.</Empty>
        ) : (
          <table className="ltable">
            <thead>
              <tr>
                <th>Wine</th>
                <th>Status</th>
                <th className="num">Bottles</th>
                <th className="num">Value</th>
                <th className="num">Cost</th>
              </tr>
            </thead>
            <tbody>
              {declining.map((b) => (
                <tr key={b.id} className="ltable-row" onClick={() => onSelect(b)}>
                  <td>
                    <span className="cell-wine">
                      {b.producer} <span className="cell-vintage">{b.vintage}</span>
                    </span>
                  </td>
                  <td className="cell-status">{reason(b)}</td>
                  <td className="num">{b.quantity}</td>
                  <td className="num money">{money(holdingValue(b))}</td>
                  <td className="num muted">{money(costValue(b))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <p className="fineprint">
        Figures are indicative market estimates for this demonstration. They are not an appraisal, a
        survey or a statement of insurable value. For cover, an underwriter will want a professional
        valuation, proof of purchase and photographs — the exported schedule is a starting document,
        not a substitute.
      </p>
    </>
  )
}
