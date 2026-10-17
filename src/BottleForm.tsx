import { useEffect, useState } from 'react'
import type { Bottle } from './types'
import { CURRENT_YEAR, suggestWindow } from './logic'

const FORMATS: Bottle['format'][] = ['Bottle', 'Magnum', 'Half-bottle', 'Double-magnum']

export function BottleForm({
  locations,
  initial,
  onClose,
  onSave,
}: {
  locations: string[]
  initial?: Bottle
  onClose: () => void
  onSave: (b: Bottle) => void
}) {
  const year = CURRENT_YEAR
  const editing = Boolean(initial)

  const [producer, setProducer] = useState(initial?.producer ?? '')
  const [cuvee, setCuvee] = useState(initial?.cuvee ?? '')
  const [vintage, setVintage] = useState(String(initial?.vintage ?? year - 8))
  const [region, setRegion] = useState(initial?.region ?? '')
  const [country, setCountry] = useState(initial?.country ?? '')
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 6))
  const [format, setFormat] = useState<Bottle['format']>(initial?.format ?? 'Bottle')
  const [marketValue, setMarketValue] = useState(
    initial ? String(initial.marketValue) : '',
  )
  const [cost, setCost] = useState(initial ? String(initial.cost) : '')
  const [location, setLocation] = useState(initial?.location ?? locations[0] ?? 'Home, Dining Room')
  const [serving, setServing] = useState(initial?.serving ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [firstDrink, setFirstDrink] = useState(String(initial?.firstDrink ?? year))
  const [peakFrom, setPeakFrom] = useState(String(initial?.peakFrom ?? year + 2))
  const [peakTo, setPeakTo] = useState(String(initial?.peakTo ?? year + 15))
  const [lastDrink, setLastDrink] = useState(String(initial?.lastDrink ?? year + 22))
  const [suggested, setSuggested] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  function suggest() {
    const v = Number(vintage)
    if (!v || v < 1800) {
      setError('Enter a vintage first — the window is calculated from it.')
      return
    }
    const w = suggestWindow(`${region} ${country} ${cuvee} ${producer}`, v)
    setFirstDrink(String(w.firstDrink))
    setPeakFrom(String(w.peakFrom))
    setPeakTo(String(w.peakTo))
    setLastDrink(String(w.lastDrink))
    setSuggested(true)
    setError('')
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!producer.trim()) {
      setError('A producer is required.')
      return
    }
    const v = Number(vintage)
    if (!Number.isFinite(v) || v < 1800 || v > year + 1) {
      setError('That vintage looks wrong.')
      return
    }
    if (Number(peakFrom) > Number(peakTo)) {
      setError('Peak start must come before peak end.')
      return
    }
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      producer: producer.trim(),
      cuvee: cuvee.trim() || 'Cuvée',
      vintage: v,
      region: region.trim() || 'Unspecified',
      country: country.trim() || 'Unspecified',
      quantity: Math.max(1, Number(quantity) || 1),
      format,
      marketValue: Math.max(0, Number(marketValue) || 0),
      cost: Math.max(0, Number(cost) || 0),
      firstDrink: Number(firstDrink) || v,
      peakFrom: Number(peakFrom) || v + 2,
      peakTo: Number(peakTo) || v + 15,
      lastDrink: Number(lastDrink) || v + 22,
      location: location.trim() || 'Home, Dining Room',
      serving: serving.trim() || 'Decant and serve at cellar temperature.',
      note: note.trim() || (initial ? '' : 'Added to the cellar by hand.'),
    })
  }

  return (
    <div className="modal-scrim" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Edit this wine' : 'Add a bottle'}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">{editing ? 'Amend the record' : 'New entry'}</p>
            <h2 className="modal-title">{editing ? 'Edit this wine' : 'Add a bottle'}</h2>
            {editing && <p className="modal-sub">{initial?.producer}</p>}
          </div>
          <button className="sheet-close" onClick={onClose} aria-label="Close">
            <span />
            <span />
          </button>
        </div>

        <form onSubmit={submit} className="form">
          <div className="field field-wide">
            <label htmlFor="f-producer">Producer</label>
            <input
              id="f-producer"
              value={producer}
              onChange={(e) => setProducer(e.target.value)}
              placeholder="Producer or estate"
              autoFocus
            />
          </div>

          <div className="field field-wide">
            <label htmlFor="f-cuvee">Cuvée</label>
            <input
              id="f-cuvee"
              value={cuvee}
              onChange={(e) => setCuvee(e.target.value)}
              placeholder="Premier Grand Cru Classé"
            />
          </div>

          <div className="field">
            <label htmlFor="f-vintage">Vintage</label>
            <input
              id="f-vintage"
              value={vintage}
              onChange={(e) => setVintage(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="field">
            <label htmlFor="f-region">Region</label>
            <input
              id="f-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Region"
            />
          </div>

          <div className="field">
            <label htmlFor="f-country">Appellation / country</label>
            <input
              id="f-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Appellation, country"
            />
          </div>

          <div className="field">
            <label htmlFor="f-qty">Quantity in the cellar</label>
            <input
              id="f-qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="field">
            <label htmlFor="f-format">Format</label>
            <select
              id="f-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as Bottle['format'])}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="f-market">Market value / unit</label>
            <input
              id="f-market"
              value={marketValue}
              onChange={(e) => setMarketValue(e.target.value)}
              inputMode="numeric"
              placeholder="950"
            />
          </div>

          <div className="field">
            <label htmlFor="f-cost">Cost / unit</label>
            <input
              id="f-cost"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              inputMode="numeric"
              placeholder="650"
            />
          </div>

          <div className="field">
            <label htmlFor="f-location">Location</label>
            <input
              id="f-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              list="locations"
            />
            <datalist id="locations">
              {locations.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>

          <div className="window-head field-wide">
            <div>
              <p className="eyebrow">Drinking window</p>
              <p className="window-copy">Four years: first pour, peak, peak end, last call.</p>
            </div>
            <button type="button" className="btn btn-ghost btn-small" onClick={suggest}>
              Suggest from region
            </button>
          </div>

          <div className="field">
            <label htmlFor="f-first">First pour</label>
            <input
              id="f-first"
              value={firstDrink}
              onChange={(e) => setFirstDrink(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div className="field">
            <label htmlFor="f-pf">Peak from</label>
            <input
              id="f-pf"
              value={peakFrom}
              onChange={(e) => setPeakFrom(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div className="field">
            <label htmlFor="f-pt">Peak to</label>
            <input
              id="f-pt"
              value={peakTo}
              onChange={(e) => setPeakTo(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div className="field">
            <label htmlFor="f-ld">Last call</label>
            <input
              id="f-ld"
              value={lastDrink}
              onChange={(e) => setLastDrink(e.target.value)}
              inputMode="numeric"
            />
          </div>

          {suggested && (
            <p className="form-hint field-wide">
              Based on {region || 'the region'} and the {vintage} vintage. Adjust anything that looks
              wrong — this is a starting position, not a verdict.
            </p>
          )}

          <div className="field field-wide">
            <label htmlFor="f-serving">Serving note</label>
            <input
              id="f-serving"
              value={serving}
              onChange={(e) => setServing(e.target.value)}
              placeholder="Decant two hours. Rack of lamb."
            />
          </div>

          <div className="field field-wide">
            <label htmlFor="f-note">Provenance or note</label>
            <input
              id="f-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="In bond since release."
            />
          </div>

          {error && <p className="form-error field-wide">{error}</p>}

          <div className="modal-actions field-wide">
            <button type="submit" className="btn btn-primary">
              {editing ? 'Save changes' : 'Add to the cellar'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
