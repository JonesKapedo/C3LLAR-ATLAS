import { useEffect } from 'react'
import type { CatalogWine } from './catalog'
import { readinessOfWine } from './catalog'
import { reason } from './logic'
import { ReadinessPill, WindowBar } from './ui'
import { useMoney } from './privacy'

export function WineDetail({
  wine,
  onClose,
  onAdd,
}: {
  wine: CatalogWine
  onClose: () => void
  onAdd: () => void
}) {
  const money = useMoney()

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

  return (
    <div className="sheet-scrim" onClick={onClose} role="presentation">
      <aside
        className="sheet wine-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${wine.producer} ${wine.cuvee} ${wine.vintage}`}
      >
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          <span />
          <span />
        </button>

        <div className="wine-hero">
          <img src={wine.image} alt={`${wine.producer} ${wine.cuvee} ${wine.vintage} label`} />
        </div>

        <div className="sheet-body">
          <p className="eyebrow">
            {wine.type} · {wine.country}
          </p>
          <h2 className="sheet-title">{wine.producer}</h2>
          <p className="sheet-cuvee">
            {wine.cuvee} · {wine.vintage}
          </p>

          <div className="sheet-meta">
            <ReadinessPill r={readinessOfWine(wine)} />
            <span className="sheet-reason">{reason(wine)}</span>
          </div>

          <div className="sheet-window">
            <WindowBar bottle={wine} />
          </div>

          <p className="sheet-copy">{wine.notes}</p>

          <div className="wine-facts">
            <div>
              <span className="fig-label">Grapes</span>
              <span>{wine.grapes.join(', ')}</span>
            </div>
            <div>
              <span className="fig-label">Classification</span>
              <span>{wine.classification}</span>
            </div>
            <div>
              <span className="fig-label">Appellation</span>
              <span>
                {wine.appellation}, {wine.region}
              </span>
            </div>
            <div>
              <span className="fig-label">Alcohol</span>
              <span>{wine.abv}%</span>
            </div>
            <div>
              <span className="fig-label">Indicative value</span>
              <span className="wine-value">{money(wine.value)}</span>
            </div>
            <div>
              <span className="fig-label">Case of twelve</span>
              <span>{money(wine.caseValue)}</span>
            </div>
          </div>

          <div className="sheet-note">
            <span className="note-label">At the table</span>
            <p>{wine.pairing}</p>
          </div>

          <div className="sheet-actions">
            <button className="btn btn-primary" onClick={onAdd}>
              Add to my cellar
            </button>
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>

          <p className="sheet-hint">
            Adds one bottle at your usual storage location. Change the quantity or the location
            afterwards with Edit details.
          </p>

          <p className="sheet-disclaimer">
            Indicative value from a reference model applied to the release price, not a market quote
            or an appraisal for insurance.
          </p>
        </div>
      </aside>
    </div>
  )
}
