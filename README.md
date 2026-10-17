# Cellar Atlas

A one-problem product for private fine-wine collectors: **what should I open tonight, and am I already too late?** — with a full marketplace for browsing what exists.

## The problem

Serious private cellars are six-figure assets. Every bottle has a drinking window: open it early and you spend the years you paid for; open it late and the wine is still sound but the money is gone. Today that decision is made from memory, and the tools that exist are database-shaped.

## No hardcoded wine data

There is not a single wine record, price or image in `src/`. The catalogue is generated:

```
data/catalog.source.json     the registry you edit — estates, appellations, grapes,
                             classifications, release values, drinking-window offsets
        │
        │  npm run catalog
        ▼
public/catalog.json          193 wines across 55 estates and 17 countries
public/labels/*.svg          193 generated label illustrations
public/seed-cellar.json      the demonstration cellar, derived from the catalogue
```

`src/catalog.ts` loads the generated files at runtime. Change the registry, regenerate, and the interface follows — no component knows a single producer name.

Values are **derived, not asserted**: `value = release value × age multiplier`, rounded, with the model published in `catalog.json` and stated in the UI. They are indicative reference figures, not market quotes or insurance appraisals.

Label art is generated per wine from its own metadata — type, country, producer, cuvée, vintage, appellation — as a bottle-and-label SVG. That keeps every bottle illustrated, works offline, makes no third-party requests, and carries no image licensing to clear. Swap in photography later by changing one field in the registry.

## Pages

Hash-routed (`#/market`), so it deploys to any static host with no rewrite rules.

| Route | What it answers |
| --- | --- |
| `#/tonight` | What to open now, what to watch, what to rescue |
| `#/cellar` | Your inventory — search, filters, sorting |
| `#/market` | 193 wines with images, values and filters; click for the full record |
| `#/windows` | Every wine on one shared calendar axis |
| `#/book` | What was opened, with notes that save as you type |
| `#/valuation` | Value by location, concentration, declining holdings, CSV export |
| `#/security` | The trust model and its controls |

## What you can do

- **Browse the market** by type, country, value band, or free text across grapes and appellations.
- **Open any wine** for grapes, classification, appellation, alcohol, drinking window, indicative value, case value, tasting note and pairing — then add it to your cellar in one tap.
- **Open, add, edit or remove** bottles in your own cellar, with a quantity stepper on removal.
- **Hide every figure** with discretion mode; **lock the cellar** with a passcode (AES-256-GCM at rest).
- **Search everything** with `⌘K`.

## The trust model

A list of what you own, and where, is a security document. It never leaves the device: no account, no server, no analytics, no third-party requests — typefaces are self-hosted and the catalogue ships with the app. The security page states the limits plainly, including that a forgotten passcode is unrecoverable.

## Run

```bash
npm install
npm run catalog   # regenerate public/catalog.json and the label art
npm run dev       # http://localhost:3000
npm run build     # typecheck + production build
```
