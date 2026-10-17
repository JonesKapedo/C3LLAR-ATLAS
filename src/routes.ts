export const ROUTES = [
  'tonight',
  'cellar',
  'market',
  'windows',
  'book',
  'valuation',
  'security',
] as const

export type Route = (typeof ROUTES)[number]

export interface NavItem {
  route: Route
  label: string
  icon: string
  blurb: string
}

export const MAIN_NAV: NavItem[] = [
  {
    route: 'tonight',
    label: 'Tonight',
    icon: 'tonight',
    blurb: 'The bottle to open this evening, and the three that matter this week.',
  },
  {
    route: 'cellar',
    label: 'The cellar',
    icon: 'cellar',
    blurb: 'Everything you hold, searchable — with its window, its value and where it sleeps.',
  },
  {
    route: 'market',
    label: 'The market',
    icon: 'market',
    blurb: 'Every wine worth knowing, with its window and an indicative value.',
  },
  {
    route: 'windows',
    label: 'Drinking windows',
    icon: 'windows',
    blurb: 'Every wine on one calendar, so you can see what is arriving and what is leaving.',
  },
  {
    route: 'book',
    label: 'Cellar book',
    icon: 'book',
    blurb: 'The record of what was opened, and how it tasted.',
  },
]

export const ESTATE_NAV: NavItem[] = [
  {
    route: 'valuation',
    label: 'Valuation',
    icon: 'valuation',
    blurb: 'What the cellar is worth, where it is held, and what is quietly slipping.',
  },
  {
    route: 'security',
    label: 'Privacy & security',
    icon: 'security',
    blurb: 'Your passcode, your exports, and exactly what stays on this device.',
  },
]

export const ALL_NAV: NavItem[] = [...MAIN_NAV, ...ESTATE_NAV]

export const TITLES: Record<Route, string> = {
  tonight: 'Tonight',
  cellar: 'The cellar',
  market: 'The market',
  windows: 'Drinking windows',
  book: 'Cellar book',
  valuation: 'Valuation',
  security: 'Privacy & security',
}
