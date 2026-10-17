import type { Bottle, Readiness } from './types'

export const CURRENT_YEAR = new Date().getFullYear()

export const READINESS_LABEL: Record<Readiness, string> = {
  peak: 'At peak',
  approaching: 'Approaching',
  hold: 'Hold',
  fading: 'Past peak',
  past: 'Past its best',
}

export const READINESS_COPY: Record<Readiness, string> = {
  peak: 'Drinking at its best right now.',
  approaching: 'Almost there. Worth a look, better in a year or two.',
  hold: 'Still improving. Opening now spends the years you paid for.',
  fading: 'Still very good, but no longer getting better.',
  past: 'Beyond its best years. Value is falling faster than the wine.',
}

export interface WindowFields {
  firstDrink: number
  peakFrom: number
  peakTo: number
  lastDrink: number
}

/** Shared by cellar bottles and catalogue wines. */
export function readinessOf(b: WindowFields, year: number = CURRENT_YEAR): Readiness {
  if (year > b.lastDrink) return 'past'
  if (year > b.peakTo) return 'fading'
  if (year >= b.peakFrom) return 'peak'
  if (b.peakFrom - year <= 3) return 'approaching'
  return 'hold'
}

export function readiness(b: Bottle, year: number = CURRENT_YEAR): Readiness {
  return readinessOf(b, year)
}

/** 0–100: how urgently this bottle wants to be opened. */
export function urgency(b: WindowFields, year: number = CURRENT_YEAR): number {
  const r = readinessOf(b, year)
  if (r === 'past') return 98
  if (r === 'fading') {
    const span = Math.max(1, b.lastDrink - b.peakTo)
    const late = Math.min(1, (year - b.peakTo) / span)
    return 88 + late * 6
  }
  if (r === 'peak') {
    const span = Math.max(1, b.peakTo - b.peakFrom)
    return 60 + Math.min(1, (year - b.peakFrom) / span) * 28
  }
  if (r === 'approaching') return 34
  return 8
}

/** A short, plain-English reason for the recommendation. */
export function reason(b: WindowFields, year: number = CURRENT_YEAR): string {
  const r = readinessOf(b, year)
  const years = (n: number) => (n === 1 ? '1 year' : `${n} years`)
  switch (r) {
    case 'peak': {
      const left = b.peakTo - year
      if (left <= 0) return 'In its final peak year'
      return `At peak · ${years(left)} of peak left`
    }
    case 'fading':
      return `In decline · ${years(Math.max(1, b.lastDrink - year))} left to drink`
    case 'past':
      return `Past its best · open or write it off`
    case 'approaching':
      return `Enters peak in ${years(Math.max(1, b.peakFrom - year))}`
    case 'hold':
      return `Holds until ${b.peakFrom}`
  }
}

export function holdingValue(b: Bottle): number {
  return b.quantity * b.marketValue
}

export function costValue(b: Bottle): number {
  return b.quantity * b.cost
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatSigned(n: number): string {
  const sign = n >= 0 ? '+' : '−'
  return `${sign}${formatMoney(Math.abs(n))}`
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many
}

export interface CellarStats {
  bottles: number
  wines: number
  value: number
  cost: number
  gain: number
  gainPct: number
  atPeakBottles: number
  atPeakWines: number
  atRiskValue: number
  atRiskWines: number
  atRiskBottles: number
  locations: number
}

export function cellarStats(bottles: Bottle[], year: number = CURRENT_YEAR): CellarStats {
  const live = bottles.filter((b) => b.quantity > 0)
  const value = live.reduce((s, b) => s + holdingValue(b), 0)
  const cost = live.reduce((s, b) => s + costValue(b), 0)
  const atPeak = live.filter((b) => readiness(b, year) === 'peak')
  const atRisk = live.filter((b) => {
    const r = readiness(b, year)
    return r === 'fading' || r === 'past'
  })
  return {
    bottles: live.reduce((s, b) => s + b.quantity, 0),
    wines: live.length,
    value,
    cost,
    gain: value - cost,
    gainPct: cost > 0 ? (value - cost) / cost : 0,
    atPeakBottles: atPeak.reduce((s, b) => s + b.quantity, 0),
    atPeakWines: atPeak.length,
    atRiskValue: atRisk.reduce((s, b) => s + holdingValue(b), 0),
    atRiskWines: atRisk.length,
    atRiskBottles: atRisk.reduce((s, b) => s + b.quantity, 0),
    locations: new Set(live.map((b) => b.location)).size,
  }
}

const RULES: Array<{ test: RegExp; offsets: [number, number, number, number] }> = [
  {
    // sweet / fortified — decades, not years
    test: /sauternes|barsac|yquem|tba|auslese|beerenauslese|tokaji|port|madeira|banyuls/i,
    offsets: [6, 18, 60, 78],
  },
  {
    // white Burgundy and other white wines — the shortest fuse in the cellar
    test: /blanc|chardonnay|chablis|meursault|puligny|chassagne|montrachet|corton|riesling|mosel|kabinett|spatlese/i,
    offsets: [4, 8, 18, 25],
  },
  { test: /champagne|reims|epernay|krug|salon|cristal|avize/i, offsets: [8, 12, 28, 40] },
  { test: /barolo|barbaresco|piedmont|monfortino|serralunga|nebbiolo/i, offsets: [8, 14, 34, 46] },
  { test: /brunello|montalcino|tuscany|bolgheri|sassicaia|chianti/i, offsets: [6, 10, 28, 38] },
  { test: /bordeaux|pauillac|margaux|pomerol|saint-est|saint-julien|graves|pessac|medoc/i, offsets: [12, 18, 38, 48] },
  { test: /rhone|rhône|chateauneuf|châteauneuf|rayas|hermitage|cote rotie|côte rôtie/i, offsets: [6, 10, 24, 32] },
  { test: /napa|sonoma|oakville|usa|california|opus|screaming eagle/i, offsets: [6, 10, 26, 34] },
  { test: /ribera|spain|vega sicilia|unico|único|priorat|rioja/i, offsets: [8, 12, 30, 40] },
  { test: /barossa|australia|grange|shiraz|mclaren/i, offsets: [8, 12, 30, 42] },
  { test: /burgundy|vosne|gevrey|chambolle|nuits|richebourg|echezeaux|échézeaux|pinot/i, offsets: [7, 12, 26, 34] },
]

export interface LocationValue {
  location: string
  bottles: number
  wines: number
  value: number
}

export function byLocation(bottles: Bottle[]): LocationValue[] {
  const map = new Map<string, LocationValue>()
  for (const b of bottles) {
    if (b.quantity === 0) continue
    const row = map.get(b.location) ?? { location: b.location, bottles: 0, wines: 0, value: 0 }
    row.bottles += b.quantity
    row.wines += 1
    row.value += holdingValue(b)
    map.set(b.location, row)
  }
  return [...map.values()].sort((a, b) => b.value - a.value)
}

export interface WindowPulse {
  enteringWines: number
  enteringBottles: number
  leavingWines: number
  leavingBottles: number
  peakWines: number
  peakBottles: number
}

/** What the next twelve months do to the cellar. */
export function windowPulse(bottles: Bottle[], year: number = CURRENT_YEAR): WindowPulse {
  const live = bottles.filter((b) => b.quantity > 0)
  const sum = (xs: Bottle[]) => xs.reduce((s, b) => s + b.quantity, 0)
  const entering = live.filter((b) => b.peakFrom > year && b.peakFrom <= year + 1)
  const leaving = live.filter((b) => b.peakTo >= year && b.peakTo < year + 1)
  const peak = live.filter((b) => readiness(b, year) === 'peak')
  return {
    enteringWines: entering.length,
    enteringBottles: sum(entering),
    leavingWines: leaving.length,
    leavingBottles: sum(leaving),
    peakWines: peak.length,
    peakBottles: sum(peak),
  }
}

export function atRisk(bottles: Bottle[], year: number = CURRENT_YEAR): Bottle[] {
  return bottles
    .filter((b) => b.quantity > 0)
    .filter((b) => {
      const r = readiness(b, year)
      return r === 'fading' || r === 'past'
    })
    .sort((a, b) => holdingValue(b) - holdingValue(a))
}

/**
 * One to open, one to watch, one to rescue. Editorial judgement rather than a
 * raw ranking: a list of three declining bottles is not a good evening.
 */
export function curatedTrio(bottles: Bottle[], excludeId?: string): Bottle[] {
  const pool = bottles.filter((b) => b.quantity > 0 && b.id !== excludeId)
  const pick = (test: (b: Bottle) => boolean, cmp: (a: Bottle, b: Bottle) => number) =>
    [...pool].sort(cmp).find(test)

  const chosen: Bottle[] = []
  const candidates = [
    pick((b) => readiness(b) === 'peak', (a, b) => holdingValue(b) - holdingValue(a)),
    pick((b) => readiness(b) === 'approaching', (a, b) => a.peakFrom - b.peakFrom),
    pick(
      (b) => readiness(b) === 'fading' || readiness(b) === 'past',
      (a, b) => urgency(b) - urgency(a),
    ),
  ]
  for (const b of candidates) if (b) chosen.push(b)

  if (chosen.length < 3) {
    const used = new Set(chosen.map((b) => b.id))
    for (const b of [...pool].sort((x, y) => urgency(y) - urgency(x))) {
      if (chosen.length >= 3) break
      if (!used.has(b.id)) {
        chosen.push(b)
        used.add(b.id)
      }
    }
  }
  return chosen.slice(0, 3)
}

/** The highest-value bottle that is drinking at its best right now. */
export function featuredBottle(bottles: Bottle[]): Bottle | undefined {
  const live = bottles.filter((b) => b.quantity > 0)
  const atPeak = live.filter((b) => readiness(b) === 'peak')
  const pool = atPeak.length > 0 ? atPeak : live
  return [...pool].sort((a, b) => holdingValue(b) - holdingValue(a))[0]
}

export interface WindowSuggestion {
  firstDrink: number
  peakFrom: number
  peakTo: number
  lastDrink: number
}

/**
 * A first-pass drinking window based on region and varietal conventions.
 * Deliberately conservative: the point is a defensible starting position the
 * owner can adjust, not a substitute for a critic's report.
 */
export function suggestWindow(input: string, vintage: number): WindowSuggestion {
  const rule = RULES.find((r) => r.test.test(input))
  const [a, b, c, d] = rule ? rule.offsets : [6, 10, 24, 32]
  return {
    firstDrink: vintage + a,
    peakFrom: vintage + b,
    peakTo: vintage + c,
    lastDrink: vintage + d,
  }
}
