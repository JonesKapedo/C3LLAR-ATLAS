#!/usr/bin/env node
/**
 * Builds the wine catalogue from data/catalog.source.json.
 *
 * Nothing here is invented inside the app: values are derived from the release
 * price and a documented age model, drinking windows come from per-estate
 * offsets, and every bottle gets generated label art. Run `npm run catalog`
 * after editing the source registry.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = JSON.parse(readFileSync(join(root, 'data/catalog.source.json'), 'utf8'))
const YEAR = new Date().getFullYear()

const roundTo = (n, step) => Math.round(n / step) * step

/* ---------- valuation ---------- */

function valueOf(estate, vintage) {
  const age = Math.max(0, YEAR - vintage)
  const multiplier = age <= 1 ? 1 : Math.min(source.model.ageCap, 1 + source.model.ageStep * age)
  return roundTo(estate.baseValue * multiplier, source.model.roundTo)
}

function windowOf(estate, vintage) {
  const [a, b, c, d] = estate.window
  return {
    firstDrink: vintage + a,
    peakFrom: vintage + b,
    peakTo: vintage + c,
    lastDrink: vintage + d,
  }
}

/* ---------- label art ---------- */

const PALETTE = {
  Red: { glass: '#2a1216', liquid: '#5c1c24', label: '#f2e7d3', ink: '#3a1d19', accent: '#8d2b33' },
  White: { glass: '#242620', liquid: '#c9b878', label: '#f6f0de', ink: '#3c382a', accent: '#a8904c' },
  Rosé: { glass: '#2b2124', liquid: '#d9908a', label: '#f8ede7', ink: '#5a3038', accent: '#c07a72' },
  Sparkling: { glass: '#22251f', liquid: '#d9c98d', label: '#f7f1df', ink: '#33301f', accent: '#b9a35f' },
  Fortified: { glass: '#1d100d', liquid: '#4d1c13', label: '#efe2cb', ink: '#3a231a', accent: '#7d3a20' },
  Dessert: { glass: '#282214', liquid: '#c99c36', label: '#f8f0d9', ink: '#4a3a1a', accent: '#a87b26' },
  Orange: { glass: '#282017', liquid: '#c07c2c', label: '#f5ebd7', ink: '#4a3218', accent: '#a8641f' },
}

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

function wrap(text, max) {
  const words = String(text).split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    if (!line.length) line = word
    else if (`${line} ${word}`.length <= max) line += ` ${word}`
    else {
      lines.push(line)
      line = word
    }
  }
  if (line.length) lines.push(line)
  return lines
}

function labelSvg(wine) {
  const p = PALETTE[wine.type] ?? PALETTE.Red
  const producer = wrap(wine.producer, 18).slice(0, 3)
  const cuvee = wrap(wine.cuvee, 26).slice(0, 2)
  const body = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800" role="img">`,
    `<title>${esc(`${wine.producer} ${wine.cuvee} ${wine.vintage}`)}</title>`,
    `<defs>`,
    `<linearGradient id="g" x1="0" y1="0" x2="1" y2="0">`,
    `<stop offset="0" stop-color="${p.glass}"/>`,
    `<stop offset="0.22" stop-color="${p.liquid}"/>`,
    `<stop offset="0.55" stop-color="${p.glass}"/>`,
    `<stop offset="0.8" stop-color="${p.liquid}" stop-opacity="0.55"/>`,
    `<stop offset="1" stop-color="${p.glass}"/>`,
    `</linearGradient>`,
    `<linearGradient id="l" x1="0" y1="0" x2="0" y2="1">`,
    `<stop offset="0" stop-color="${p.label}"/>`,
    `<stop offset="1" stop-color="${p.label}" stop-opacity="0.9"/>`,
    `</linearGradient>`,
    `</defs>`,
    `<ellipse cx="300" cy="760" rx="150" ry="16" fill="#000" opacity="0.35"/>`,
    `<path d="M270 40 h60 v110 c0 20 10 30 30 45 c30 22 50 48 50 100 v420 q0 20 -20 20 h-180 q-20 0 -20 -20 v-420 c0 -52 20 -78 50 -100 c20 -15 30 -25 30 -45 z" fill="url(#g)" stroke="#000" stroke-opacity="0.4" stroke-width="2"/>`,
    `<path d="M262 210 c-8 34 -12 70 -12 110 v400" stroke="#fff" stroke-opacity="0.10" stroke-width="10" fill="none" stroke-linecap="round"/>`,
    `<path d="M338 210 c8 34 12 70 12 110 v400" stroke="#000" stroke-opacity="0.28" stroke-width="10" fill="none" stroke-linecap="round"/>`,
    `<rect x="205" y="352" width="190" height="246" fill="url(#l)"/>`,
    `<rect x="205" y="352" width="190" height="246" fill="none" stroke="${p.accent}" stroke-width="1.5" opacity="0.65"/>`,
    `<rect x="213" y="360" width="174" height="230" fill="none" stroke="${p.accent}" stroke-width="0.6" opacity="0.4"/>`,
    `<text x="300" y="386" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="9" letter-spacing="3.4" fill="${p.accent}">${esc(wine.type.toUpperCase())} · ${esc(wine.country.toUpperCase())}</text>`,
  ]

  producer.forEach((line, i) => {
    body.push(
      `<text x="300" y="${418 + i * 21}" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="19" fill="${p.ink}">${esc(line)}</text>`,
    )
  })

  const cuveeTop = 418 + producer.length * 21 + 14
  cuvee.forEach((line, i) => {
    body.push(
      `<text x="300" y="${cuveeTop + i * 13}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="8.5" letter-spacing="1.1" fill="${p.accent}">${esc(line)}</text>`,
    )
  })

  body.push(
    `<line x1="252" y1="${cuveeTop + cuvee.length * 13 + 12}" x2="348" y2="${cuveeTop + cuvee.length * 13 + 12}" stroke="${p.accent}" stroke-width="0.8" opacity="0.5"/>`,
    `<text x="300" y="${cuveeTop + cuvee.length * 13 + 44}" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="40" letter-spacing="2" fill="${p.ink}">${wine.vintage}</text>`,
    `<text x="300" y="${cuveeTop + cuvee.length * 13 + 62}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="6.5" letter-spacing="2.4" fill="${p.accent}">${esc((wine.appellation || wine.region).toUpperCase())}</text>`,
    `</svg>`,
  )

  return body.join('')
}

/* ---------- build ---------- */

const wines = []
for (const estate of source.estates) {
  for (const vintage of estate.vintages) {
    const value = valueOf(estate, vintage)
    const w = windowOf(estate, vintage)
    wines.push({
      id: `${estate.id}-${vintage}`,
      estateId: estate.id,
      producer: estate.producer,
      cuvee: estate.cuvee,
      vintage,
      type: estate.type,
      country: estate.country,
      region: estate.region,
      appellation: estate.appellation,
      grapes: estate.grapes,
      classification: estate.classification,
      abv: estate.abv,
      releaseValue: estate.baseValue,
      value,
      caseValue: value * 12,
      ...w,
      notes: estate.notes,
      pairing: estate.pairing,
      image: `/labels/${estate.id}-${vintage}.svg`,
    })
  }
}

wines.sort((a, b) => b.value - a.value)

const labelsDir = join(root, 'public/labels')
if (existsSync(labelsDir)) rmSync(labelsDir, { recursive: true })
mkdirSync(labelsDir, { recursive: true })

for (const wine of wines) {
  writeFileSync(join(labelsDir, `${wine.id}.svg`), labelSvg(wine))
}

const catalog = {
  schema: 1,
  generatedAt: new Date().toISOString(),
  year: YEAR,
  currency: source.currency,
  model: source.model,
  counts: {
    wines: wines.length,
    estates: source.estates.length,
    types: [...new Set(wines.map((w) => w.type))].sort(),
    countries: [...new Set(wines.map((w) => w.country))].sort(),
  },
  wines,
}

writeFileSync(join(root, 'public/catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`)

/* ---------- seed cellar, derived from the catalogue ---------- */

const byId = new Map(wines.map((w) => [w.id, w]))
const seed = []
for (const row of source.cellar) {
  const wine = byId.get(`${row.estate}-${row.vintage}`)
  if (!wine) {
    console.warn(`! cellar references unknown wine ${row.estate}-${row.vintage}`)
    continue
  }
  seed.push({
    id: wine.id,
    producer: wine.producer,
    cuvee: wine.cuvee,
    vintage: wine.vintage,
    region: wine.appellation || wine.region,
    country: `${wine.region}, ${wine.country}`,
    quantity: row.quantity,
    format: row.format || 'Bottle',
    marketValue: wine.value,
    cost: wine.releaseValue,
    firstDrink: wine.firstDrink,
    peakFrom: wine.peakFrom,
    peakTo: wine.peakTo,
    lastDrink: wine.lastDrink,
    location: row.location,
    serving: wine.pairing,
    note: wine.notes,
  })
}

writeFileSync(join(root, 'public/seed-cellar.json'), `${JSON.stringify(seed, null, 2)}\n`)

const total = seed.reduce((s, b) => s + b.quantity * b.marketValue, 0)
console.log(
  `catalogue: ${wines.length} wines across ${source.estates.length} estates, ${catalog.counts.countries.length} countries`,
)
console.log(`types: ${catalog.counts.types.join(', ')}`)
console.log(`labels: ${wines.length} svg written to public/labels`)
console.log(`seed cellar: ${seed.length} wines, $${total.toLocaleString('en-US')}`)
