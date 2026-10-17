import { useMemo, useState } from 'react'
import type { Pour } from '../types'
import { Empty, PageHeader, Panel, Stat } from '../ui'
import { useMoney } from '../privacy'
import { Icon } from '../icons'

export function Book({
  log,
  onNote,
}: {
  log: Pour[]
  onNote: (id: string, note: string) => void
}) {
  const money = useMoney()
  const opened = useMemo(() => log.reduce((s, p) => s + p.value, 0), [log])
  const noted = useMemo(() => log.filter((p) => p.note.trim().length > 0).length, [log])

  return (
    <>
      <PageHeader
        eyebrow="The record"
        title="Cellar book"
        description="Written the moment a bottle leaves the cellar. A line of your own is optional — but it is the part you will reread."
      />

      <div className="stat-grid">
        <Stat label="Bottles opened" value={String(log.length)} detail="in this cellar book" />
        <Stat label="Value consumed" value={money(opened)} detail="at opening-day estimates" />
        <Stat
          label="Notes written"
          value={String(noted)}
          detail={log.length === 0 ? 'nothing opened yet' : `${log.length - noted} still blank`}
          tone="gold"
        />
        <Stat
          label="Last opened"
          value={log.length > 0 ? new Date(log[0].at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
          detail={log.length > 0 ? log[0].producer : 'open a bottle to begin'}
          tone="sage"
        />
      </div>

      <Panel title="Recent bottles" hint="One tap to add a note. It saves as you type.">
        {log.length === 0 ? (
          <Empty>
            Nothing opened yet. The first entry is one tap away — the cellar book writes itself.
          </Empty>
        ) : (
          <ul className="log">
            {log.map((p) => (
              <LogEntry key={p.id} pour={p} onNote={(note) => onNote(p.id, note)} />
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}

function LogEntry({ pour, onNote }: { pour: Pour; onNote: (note: string) => void }) {
  const money = useMoney()
  const [editing, setEditing] = useState(pour.note === '')
  const [value, setValue] = useState(pour.note)

  const date = new Date(pour.at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  function commit() {
    onNote(value.trim())
    setEditing(false)
  }

  return (
    <li className="log-row">
      <span className="log-year">{pour.vintage}</span>
      <span className="log-main">
        <span className="log-name">
          {pour.producer} <span className="log-cuvee">{pour.cuvee}</span>
        </span>
        {editing ? (
          <span className="log-edit">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="How was it?"
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') setEditing(false)
              }}
              autoFocus
            />
            <button className="btn btn-ghost btn-tiny" onClick={commit} type="button">
              <Icon name="check" size={13} />
              Save
            </button>
          </span>
        ) : (
          <span className="log-note" onClick={() => setEditing(true)} role="presentation">
            {pour.note || 'Add a note'}
          </span>
        )}
      </span>
      <span className="log-date">{date}</span>
      <span className="log-value">{money(pour.value)}</span>
    </li>
  )
}
