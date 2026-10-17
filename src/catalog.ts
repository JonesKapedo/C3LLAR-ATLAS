import type { Bottle, Readiness } from './types'
import { readinessOf } from './logic'

export type WineType = 'Red' | 'White' | 'Rosé' | 'Sparkling' | 'Fortified' | 'Dessert' | 'Orange'

export const WINE_TYPES: WineType[] = [
  'Red',
  'White',
  'Rosé',
  'Sparkling',
  'Fortified',
  'Dessert',
  'Orange',
]

export interface CatalogWine {
  id: string
  estateId: string
  producer: string
  cuvee: string
  vintage: number
  type: WineType
  country: string
  region: string
  appellation: string
  grapes: string[]
  classification: string
  abv: number
  releaseValue: number
  value: number
  caseValue: number
  firstDrink: number
  peakFrom: number
  peakTo: number
  lastDrink: number
  notes: string
  pairing: string
  image: string
}

export interface Catalog {
  schema: number
  generatedAt: string
  year: number
  currency: string
  model: { note: string; ageStep: number; ageCap: number; roundTo: number }
  counts: { wines: number; estates: number; types: WineType[]; countries: string[] }
  wines: CatalogWine[]
}

/**
 * The catalogue ships with the app as a generated file. Loading it at runtime
 * keeps every wine record out of the components — regenerate with `npm run
 * catalog` and the interface follows.
 */
let catalogPromise: Promise<Catalog> | null = null

export function loadCatalog(): Promise<Catalog> {
  if (!catalogPromise) {
    catalogPromise = fetch('/catalog.json').then((res) => {
      if (!res.ok) throw new Error(`Catalogue unavailable (${res.status})`)
      return res.json() as Promise<Catalog>
    })
    catalogPromise.catch(() => {
      catalogPromise = null
    })
  }
  return catalogPromise
}

export function resetCatalogCache(): void {
  catalogPromise = null
}

/** The demonstration cellar is generated too, never hardcoded. */
export function loadSeedCellar(): Promise<Bottle[]> {
  return fetch('/seed-cellar.json').then((res) => {
    if (!res.ok) throw new Error(`Seed cellar unavailable (${res.status})`)
    return res.json() as Promise<Bottle[]>
  })
}

export function readinessOfWine(wine: CatalogWine): Readiness {
  return readinessOf(wine)
}

/* ---------- market statistics ---------- */

export interface MarketStats {
  wines: number
  estates: number
  countries: number
  types: number
  median: number
  cheapest: number
  dearest: number
  total: number
}

export function marketStats(wines: CatalogWine[]): MarketStats {
  const values = wines.map((w) => w.value).sort((a, b) => a - b)
  const median =
    values.length === 0
      ? 0
      : values.length % 2 === 1
        ? values[(values.length - 1) / 2]
        : Math.round((values[values.length / 2 - 1] + values[values.length / 2]) / 2)
  return {
    wines: wines.length,
    estates: new Set(wines.map((w) => w.estateId)).size,
    countries: new Set(wines.map((w) => w.country)).size,
    types: new Set(wines.map((w) => w.type)).size,
    median,
    cheapest: values[0] ?? 0,
    dearest: values[values.length - 1] ?? 0,
    total: values.reduce((s, v) => s + v, 0),
  }
}

/* ---------- filtering ---------- */

export type PriceBand = 'any' | 'under100' | '100to500' | '500to2000' | 'over2000'

export const PRICE_BANDS: Array<{ key: PriceBand; label: string }> = [
  { key: 'any', label: 'Any value' },
  { key: 'under100', label: 'Under $100' },
  { key: '100to500', label: '$100 – $500' },
  { key: '500to2000', label: '$500 – $2,000' },
  { key: 'over2000', label: 'Over $2,000' },
]

export function inBand(value: number, band: PriceBand): boolean {
  switch (band) {
    case 'under100':
      return value < 100
    case '100to500':
      return value >= 100 && value < 500
    case '500to2000':
      return value >= 500 && value < 2000
    case 'over2000':
      return value >= 2000
    default:
      return true
  }
}

export type MarketSort = 'value-desc' | 'value-asc' | 'vintage' | 'producer'

export function filterWines(
  wines: CatalogWine[],
  opts: { query: string; type: WineType | 'all'; country: string; band: PriceBand; sort: MarketSort },
): CatalogWine[] {
  const q = opts.query.trim().toLowerCase()
  return wines
    .filter((w) => {
      if (opts.type !== 'all' && w.type !== opts.type) return false
      if (opts.country !== 'all' && w.country !== opts.country) return false
      if (!inBand(w.value, opts.band)) return false
      if (!q) return true
      return `${w.producer} ${w.cuvee} ${w.vintage} ${w.region} ${w.appellation} ${w.country} ${w.type} ${w.grapes.join(' ')} ${w.classification}`
        .toLowerCase()
        .includes(q)
    })
    .sort((a, b) => {
      if (opts.sort === 'value-asc') return a.value - b.value
      if (opts.sort === 'vintage') return a.vintage - b.vintage
      if (opts.sort === 'producer') return a.producer.localeCompare(b.producer)
      return b.value - a.value
    })
}

/* ---------- to the cellar ---------- */

export function toCellarBottle(wine: CatalogWine, location: string): Bottle {
  return {
    id: `cat-${wine.id}-${Date.now().toString(36)}`,
    producer: wine.producer,
    cuvee: wine.cuvee,
    vintage: wine.vintage,
    region: wine.appellation || wine.region,
    country: `${wine.region}, ${wine.country}`,
    quantity: 1,
    format: 'Bottle',
    marketValue: wine.value,
    cost: wine.releaseValue,
    firstDrink: wine.firstDrink,
    peakFrom: wine.peakFrom,
    peakTo: wine.peakTo,
    lastDrink: wine.lastDrink,
    location,
    serving: wine.pairing,
    note: wine.notes,
  }
}
