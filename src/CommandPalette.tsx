import { useEffect, useMemo, useState } from 'react'
import type { Bottle } from './types'
import { ALL_NAV, type Route } from './routes'
import { holdingValue } from './logic'
import { useMoney } from './privacy'
import { Icon } from './icons'

interface Item {
  key: string
  group: 'Pages' | 'Wines' | 'Actions'
  label: string
  hint: string
  icon: string
  run: () => void
}

/**
 * Empty query offers the rooms and the actions; a query searches everything.
 * Kept pure so the ranking behaviour can be tested without a browser.
 */
export function filterItems<T extends { group: string; label: string; hint: string }>(
  items: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return items.filter((i) => i.group !== 'Wines')
  return items.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(q)).slice(0, 9)
}

export function CommandPalette({
  bottles,
  hasPasscode,
  onClose,
  onSelect,
  onGo,
  onAdd,
  onTour,
  onLock,
}: {
  bottles: Bottle[]
  hasPasscode: boolean
  onClose: () => void
  onSelect: (b: Bottle) => void
  onGo: (r: Route) => void
  onAdd: () => void
  onTour: () => void
  onLock: () => void
}) {
  const money = useMoney()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const items = useMemo<Item[]>(() => {
    const pages: Item[] = ALL_NAV.map((n) => ({
      key: `page:${n.route}`,
      group: 'Pages',
      label: n.label,
      hint: n.blurb,
      icon: n.icon,
      run: () => {
        onClose()
        onGo(n.route)
      },
    }))

    const wines: Item[] = bottles
      .filter((b) => b.quantity > 0)
      .map((b) => ({
        key: `wine:${b.id}`,
        group: 'Wines',
        label: `${b.producer} ${b.vintage}`,
        hint: `${b.cuvee} · ${b.quantity} bt · ${b.location} · ${money(holdingValue(b))}`,
        icon: 'cellar',
        run: () => {
          onClose()
          onSelect(b)
        },
      }))

    const actions: Item[] = [
      {
        key: 'action:add',
        group: 'Actions',
        label: 'Add a bottle',
        hint: 'Enter a new wine and set its drinking window',
        icon: 'plus',
        run: () => {
          onClose()
          onAdd()
        },
      },
      {
        key: 'action:tour',
        group: 'Actions',
        label: 'Take the introduction',
        hint: 'The six-step tour of what this is and how to use it',
        icon: 'tonight',
        run: () => {
          onClose()
          onTour()
        },
      },
    ]

    if (hasPasscode) {
      actions.push({
        key: 'action:lock',
        group: 'Actions',
        label: 'Lock the cellar',
        hint: 'Seal the record until the passcode is entered again',
        icon: 'lock',
        run: () => {
          onClose()
          onLock()
        },
      })
    }

    return [...pages, ...wines, ...actions]
  }, [bottles, hasPasscode, money, onAdd, onClose, onGo, onLock, onSelect, onTour])

  const filtered = useMemo(() => filterItems(items, query), [items, query])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(i + 1, filtered.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && filtered[active]) {
        e.preventDefault()
        filtered[active].run()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [filtered, active, onClose])

  let lastGroup = ''

  return (
    <div className="palette-scrim" onClick={onClose} role="presentation">
      <div
        className="palette"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search the cellar"
      >
        <div className="palette-input">
          <Icon name="search" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search wines, rooms or actions"
            aria-label="Search wines, rooms or actions"
            autoFocus
          />
          <kbd>esc</kbd>
        </div>

        <div className="palette-list">
          {filtered.length === 0 && (
            <p className="palette-empty">Nothing by that name in the register.</p>
          )}

          {filtered.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : ''
            lastGroup = item.group
            return (
              <div key={item.key}>
                {header && <p className="palette-group">{header}</p>}
                <button
                  className={`palette-item${index === active ? ' is-active' : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={item.run}
                  type="button"
                >
                  <span className="palette-icon">
                    <Icon name={item.icon} size={15} />
                  </span>
                  <span className="palette-text">
                    <strong>{item.label}</strong>
                    <em>{item.hint}</em>
                  </span>
                  {index === active && <Icon name="arrow" size={14} />}
                </button>
              </div>
            )
          })}
        </div>

        <div className="palette-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> to move
          </span>
          <span>
            <kbd>↵</kbd> to open
          </span>
          <span className="palette-count">{filtered.length} results</span>
        </div>
      </div>
    </div>
  )
}
