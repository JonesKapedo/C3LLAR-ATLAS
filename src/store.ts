import type { Bottle, Pour } from './types'
import type { EncryptedBlob } from './crypto'
import { decryptValue, encryptValue } from './crypto'

export interface CellarData {
  bottles: Bottle[]
  log: Pour[]
}

const DATA_KEY = 'cellar-atlas:v2'
const LEGACY_KEY = 'cellar-atlas:v1'
const PREFS_KEY = 'cellar-atlas:prefs'

export type LoadResult =
  | { kind: 'empty' }
  | { kind: 'plain'; data: CellarData }
  | { kind: 'encrypted'; blob: EncryptedBlob }

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeRaw(key: string, value: string): void {
  localStorage.setItem(key, value)
}

/**
 * Reads the local record. A plaintext store is only ever produced by a cellar
 * with no passcode; a passcode-protected cellar exposes nothing but ciphertext.
 */
export function loadCellar(): LoadResult {
  const raw = readRaw(DATA_KEY) ?? readRaw(LEGACY_KEY)
  if (!raw) return { kind: 'empty' }
  try {
    const parsed = JSON.parse(raw) as Partial<CellarData> & Partial<EncryptedBlob>
    if (parsed.enc === true && typeof parsed.data === 'string') {
      return { kind: 'encrypted', blob: parsed as EncryptedBlob }
    }
    if (Array.isArray(parsed.bottles)) {
      return {
        kind: 'plain',
        data: { bottles: parsed.bottles, log: Array.isArray(parsed.log) ? parsed.log : [] },
      }
    }
  } catch {
    /* fall through to empty */
  }
  return { kind: 'empty' }
}

export async function saveCellar(data: CellarData, passcode: string | null): Promise<void> {
  try {
    if (passcode) {
      const blob = await encryptValue(passcode, data)
      writeRaw(DATA_KEY, JSON.stringify(blob))
      localStorage.removeItem(LEGACY_KEY)
    } else {
      writeRaw(DATA_KEY, JSON.stringify(data))
      localStorage.removeItem(LEGACY_KEY)
    }
  } catch {
    // Storage full, blocked, or private mode: the session still works in memory.
  }
}

export async function unlockCellar(passcode: string, blob: EncryptedBlob): Promise<CellarData> {
  return decryptValue<CellarData>(passcode, blob)
}

export function eraseCellar(): void {
  try {
    localStorage.removeItem(DATA_KEY)
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    /* nothing to do */
  }
}

/* ---------- preferences (non-sensitive) ---------- */

export interface Prefs {
  discreet: boolean
  autoLockMinutes: number
  /** Has the owner been taken through the welcome? */
  onboarded: boolean
  /** A private register number, minted once on this device. */
  registerNo: number
  /** The day the register was opened, ISO date. */
  openedOn: string
}

function mintRegister(): { registerNo: number; openedOn: string } {
  return {
    registerNo: 1 + Math.floor(Math.random() * 9000),
    openedOn: new Date().toISOString().slice(0, 10),
  }
}

const DEFAULT_PREFS: Prefs = {
  discreet: false,
  autoLockMinutes: 15,
  onboarded: false,
  ...mintRegister(),
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<Prefs>
    return {
      discreet: Boolean(parsed.discreet),
      autoLockMinutes:
        typeof parsed.autoLockMinutes === 'number' ? parsed.autoLockMinutes : 15,
      onboarded: Boolean(parsed.onboarded),
      registerNo:
        typeof parsed.registerNo === 'number' && parsed.registerNo > 0
          ? parsed.registerNo
          : 1 + Math.floor(Math.random() * 9000),
      openedOn:
        typeof parsed.openedOn === 'string' && parsed.openedOn.length === 10
          ? parsed.openedOn
          : new Date().toISOString().slice(0, 10),
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
}

/* ---------- exports ---------- */

function csvCell(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function download(filename: string, mime: string, body: string): void {
  const blob = new Blob([body], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const stamp = () => new Date().toISOString().slice(0, 10)

/** A schedule an insurer or broker can actually read. */
export function exportCsv(data: CellarData): void {
  const head = [
    'Producer',
    'Cuvee',
    'Vintage',
    'Region',
    'Country',
    'Format',
    'Quantity',
    'Market value per unit (USD)',
    'Holding value (USD)',
    'Cost per unit (USD)',
    'First drink',
    'Peak from',
    'Peak to',
    'Last call',
    'Location',
  ]
  const rows = data.bottles
    .filter((b) => b.quantity > 0)
    .map((b) =>
      [
        b.producer,
        b.cuvee,
        b.vintage,
        b.region,
        b.country,
        b.format,
        b.quantity,
        b.marketValue,
        b.marketValue * b.quantity,
        b.cost,
        b.firstDrink,
        b.peakFrom,
        b.peakTo,
        b.lastDrink,
        b.location,
      ]
        .map(csvCell)
        .join(','),
    )
  download(`cellar-atlas-${stamp()}.csv`, 'text/csv;charset=utf-8', [head.join(','), ...rows].join('\n'))
}

/** A complete, passcode-free copy for the owner's own backup. */
export function exportJson(data: CellarData): void {
  download(
    `cellar-atlas-${stamp()}.json`,
    'application/json',
    JSON.stringify({ exported: new Date().toISOString(), ...data }, null, 2),
  )
}
