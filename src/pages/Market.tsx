import { useEffect, useMemo, useState } from 'react'
import type { Catalog, CatalogWine, MarketSort, PriceBand, WineType } from '../catalog'
import {
  PRICE_BANDS,
  filterWines,
  loadCatalog,
  marketStats,
  readinessOfWine,
} from '../catalog'
import { Empty, PageHeader, ReadinessPill, Stat } from '../ui'
import { useMoney } from '../privacy'
import { Icon } from '../icons'

const PAGE = 24

export function Market({
  onOpenWine,
  catalog: injected,
}: {
  onOpenWine: (w: CatalogWine) => void
  /** Optional pre-loaded catalogue, so the page can be rendered without a fetch. */
  catalog?: Catalog | null
}) {
  const money = useMoney()
  const [catalog, setCatalog] = useState<Catalog | null>(injected ?? null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState<WineType | 'all'>('all')
  const [country, setCountry] = useState('all')
  const [band, setBand] = useState<PriceBand>('any')
  const [sort, setSort] = useState<MarketSort>('value-desc')
  const [limit, setLimit] = useState(PAGE)

  useEffect(() => {
    if (injected) return
    let alive = true
    loadCatalog()
      .then((c) => {
        if (alive) setCatalog(c)
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : 'The catalogue could not be loaded.')
      })
    return () => {
      alive = false
    }
  }, [injected])

  const wines = catalog?.wines ?? []
  const stats = useMemo(() => marketStats(wines), [wines])
  const types = useMemo(() => catalog?.counts.types ?? [], [catalog])
  const countries = useMemo(() => catalog?.counts.countries ?? [], [catalog])

  const results = useMemo(
    () => filterWines(wines, { query, type, country, band, sort }),
    [wines, query, type, country, band, sort],
  )

  useEffect(() => {
    setLimit(PAGE)
  }, [query, type, country, band, sort])

  const shown = results.slice(0, limit)
  const generated = catalog?.generatedAt
    ? new Date(catalog.generatedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <>
      <PageHeader
        eyebrow="The market"
        title="Every wine, and what it is worth."
        description={
          catalog ? (
            <>
              {stats.wines} wines from {stats.estates} estates across {stats.countries} countries,
              with drinking windows and an indicative value for each. Select any bottle for the
              detail behind it.
              <span className="view-meta">Catalogue generated {generated}</span>
            </>
          ) : (
            'Loading the catalogue…'
          )
        }
      />

      {error && (
        <Empty>
          {error}. Run <code>npm run catalog</code> to regenerate the catalogue file.
        </Empty>
      )}

      {!error && !catalog && <div className="market-loading">Opening the market…</div>}

      {catalog && (
        <>
          <div className="stat-grid">
            <Stat
              label="Bottles listed"
              value={String(stats.wines)}
              detail={`${stats.estates} estates · ${stats.types} wine types`}
            />
            <Stat
              label="Countries"
              value={String(stats.countries)}
              detail="from Bordeaux to Kakheti"
            />
            <Stat
              label="Median bottle"
              value={money(stats.median)}
              detail={`range ${money(stats.cheapest)} – ${money(stats.dearest)}`}
              tone="gold"
            />
            <Stat
              label="Catalogue value"
              value={money(stats.total)}
              detail="one bottle of every listed wine"
              tone="sage"
            />
          </div>

          <div className="toolbar market-toolbar">
            <label className="search">
              <Icon name="search" size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a wine, grape, region or estate"
                aria-label="Search the catalogue"
              />
            </label>

            <div className="market-selects">
              <label className="sort">
                <span>Country</span>
                <select value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="all">All countries</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="sort">
                <span>Value</span>
                <select value={band} onChange={(e) => setBand(e.target.value as PriceBand)}>
                  {PRICE_BANDS.map((b) => (
                    <option key={b.key} value={b.key}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="sort">
                <span>Order</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as MarketSort)}>
                  <option value="value-desc">Value, high to low</option>
                  <option value="value-asc">Value, low to high</option>
                  <option value="vintage">Vintage</option>
                  <option value="producer">Estate A–Z</option>
                </select>
              </label>
            </div>
          </div>

          <div className="chips">
            <button
              className={`chip${type === 'all' ? ' is-active' : ''}`}
              onClick={() => setType('all')}
              type="button"
            >
              All types
              <span className="chip-count">{wines.length}</span>
            </button>
            {types.map((t) => (
              <button
                key={t}
                className={`chip${type === t ? ' is-active' : ''}`}
                onClick={() => setType(t)}
                type="button"
              >
                {t}
                <span className="chip-count">{wines.filter((w) => w.type === t).length}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <Empty>Nothing in the catalogue matches that. Try a broader search.</Empty>
          ) : (
            <div className="wine-grid">
              {shown.map((wine) => (
                <button
                  key={wine.id}
                  className="wine-card"
                  onClick={() => onOpenWine(wine)}
                  type="button"
                >
                  <span className="wine-card-art">
                    <img src={wine.image} alt={`${wine.producer} ${wine.cuvee} ${wine.vintage} label`} loading="lazy" />
                  </span>
                  <span className="wine-card-body">
                    <span className="wine-card-type">
                      {wine.type} · {wine.appellation}
                    </span>
                    <span className="wine-card-name">{wine.producer}</span>
                    <span className="wine-card-vintage">{wine.vintage}</span>
                    <span className="wine-card-foot">
                      <span className="wine-card-value">{money(wine.value)}</span>
                      <ReadinessPill r={readinessOfWine(wine)} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {results.length > shown.length && (
            <div className="market-more">
              <button className="btn btn-outline" onClick={() => setLimit((l) => l + PAGE)}>
                Show more
                <span className="market-count">
                  {shown.length} of {results.length}
                </span>
              </button>
            </div>
          )}

          <p className="fineprint">
            Values are derived from a published reference model — release value multiplied by an age
            factor — and rounded. They are indicative only: not a market quote, not a valuation, and
            not a statement of insurable value. {catalog.model.note}
          </p>
        </>
      )}
    </>
  )
}
