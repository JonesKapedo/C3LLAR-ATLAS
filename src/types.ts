export type Readiness = 'hold' | 'approaching' | 'peak' | 'fading' | 'past'

export interface Bottle {
  id: string
  producer: string
  cuvee: string
  vintage: number
  region: string
  country: string
  quantity: number
  format: 'Bottle' | 'Magnum' | 'Half-bottle' | 'Double-magnum'
  /** Indicative market value per unit, USD */
  marketValue: number
  /** Cost per unit, USD */
  cost: number
  /** First year it is worth opening */
  firstDrink: number
  /** Start of peak drinking */
  peakFrom: number
  /** End of peak drinking */
  peakTo: number
  /** After this year it is in sharp decline */
  lastDrink: number
  location: string
  /** Short serving guidance shown when the bottle is opened */
  serving: string
  /** One line of provenance or character */
  note: string
}

export interface Pour {
  id: string
  bottleId: string
  producer: string
  cuvee: string
  vintage: number
  at: number
  note: string
  value: number
}
