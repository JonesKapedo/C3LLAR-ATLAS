import { useState } from 'react'
import type { Prefs } from '../store'
import { strengthOf } from '../crypto'
import { PageHeader, Panel } from '../ui'
import { Icon } from '../icons'

export function Security({
  passcode,
  hasCrypto,
  prefs,
  bottleCount,
  onEnable,
  onDisable,
  onLock,
  onDiscreet,
  onAutoLock,
  onExportCsv,
  onExportJson,
  onErase,
}: {
  passcode: string | null
  hasCrypto: boolean
  prefs: Prefs
  bottleCount: number
  onEnable: (passcode: string) => Promise<void>
  onDisable: () => void
  onLock: () => void
  onDiscreet: (value: boolean) => void
  onAutoLock: (minutes: number) => void
  onExportCsv: () => void
  onExportJson: () => void
  onErase: () => void
}) {
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const strength = strengthOf(pass)
  const encrypted = Boolean(passcode)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasCrypto) {
      setError('This browser cannot encrypt local data. Use a current browser over HTTPS.')
      return
    }
    if (pass.length < 8) {
      setError('Use at least eight characters. A short phrase you will remember beats a scramble you will not.')
      return
    }
    if (pass !== confirm) {
      setError('The two passcodes do not match.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onEnable(pass)
      setPass('')
      setConfirm('')
    } catch {
      setError('The cellar could not be encrypted. Nothing has been changed.')
    } finally {
      setBusy(false)
    }
  }

  function erase() {
    const ok = window.confirm(
      `Erase this cellar? ${bottleCount} bottles, every note and every drinking window will be deleted from this device. This cannot be undone.`,
    )
    if (ok) onErase()
  }

  return (
    <>
      <PageHeader
        eyebrow="Estate"
        title="Privacy & security"
        description="A list of what you own, and where you keep it, is a security document. It should never leave your device — and here it does not."
      />

      <div className="assure">
        <div className="assure-item">
          <Icon name="user" size={20} />
          <h3>No account</h3>
          <p>
            There is no sign-up, no email and no profile. Nothing identifies you, because nothing is
            ever sent.
          </p>
        </div>
        <div className="assure-item">
          <Icon name="shieldCheck" size={20} />
          <h3>No server</h3>
          <p>
            The cellar lives in this browser’s storage. With no server, there is no database to
            breach and no backup to leak.
          </p>
        </div>
        <div className="assure-item">
          <Icon name="key" size={20} />
          <h3>Encrypted at rest</h3>
          <p>
            With a passcode set, the record is sealed with AES-256-GCM. Without it, the stored file
            is unreadable ciphertext.
          </p>
        </div>
        <div className="assure-item">
          <Icon name="eye-off" size={20} />
          <h3>No third-party requests</h3>
          <p>
            Typefaces, scripts and styles all load from this site. No analytics, no telemetry, no
            font CDN watching the door.
          </p>
        </div>
      </div>

      <Panel
        title="Passcode protection"
        hint="Your passcode derives the key locally. It is never stored and never transmitted."
      >
        {!hasCrypto && (
          <p className="notice notice-warn">
            <Icon name="alert" size={15} />
            This browser does not expose the Web Crypto API, so encryption is unavailable. The
            cellar still stays on this device, unencrypted.
          </p>
        )}

        {encrypted ? (
          <div className="secure-state">
            <div className="secure-badge">
              <Icon name="shieldCheck" size={18} />
              <div>
                <strong>Encryption is on</strong>
                <span>AES-256-GCM · PBKDF2 · 210,000 iterations</span>
              </div>
            </div>
            <div className="row-actions">
              <button className="btn btn-outline btn-small" onClick={onLock}>
                <Icon name="lock" size={14} />
                Lock now
              </button>
              <button className="btn btn-ghost btn-small" onClick={onDisable}>
                Turn off passcode
              </button>
            </div>
          </div>
        ) : (
          <form className="pass-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="pass">Passcode</label>
              <div className="pass-wrap">
                <input
                  id="pass"
                  type={reveal ? 'text' : 'password'}
                  value={pass}
                  onChange={(e) => {
                    setPass(e.target.value)
                    setError('')
                  }}
                  autoComplete="new-password"
                  placeholder="At least eight characters"
                />
                <button
                  type="button"
                  className="pass-reveal"
                  onClick={() => setReveal((r) => !r)}
                  aria-label={reveal ? 'Hide passcode' : 'Show passcode'}
                >
                  <Icon name={reveal ? 'eye-off' : 'eye'} size={15} />
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="pass2">Confirm</label>
              <input
                id="pass2"
                type={reveal ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value)
                  setError('')
                }}
                autoComplete="new-password"
                placeholder="Once more"
              />
            </div>

            <div className="strength">
              <div className="strength-bars" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className={i < strength.score ? 'is-on' : ''} />
                ))}
              </div>
              <span className="strength-label">
                {pass.length === 0 ? 'Strength' : strength.label}
              </span>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="row-actions">
              <button className="btn btn-primary" type="submit" disabled={busy || !hasCrypto}>
                {busy ? 'Encrypting…' : 'Turn on encryption'}
              </button>
            </div>

            <p className="form-hint">
              If you forget this passcode, the cellar cannot be recovered — there is no reset link
              and nobody holding a copy. Keep the exported backup somewhere safe.
            </p>
          </form>
        )}
      </Panel>

      <Panel title="Discretion" hint="For a screen someone else can see.">
        <div className="setting">
          <div>
            <strong>Hide every value</strong>
            <p>
              Replaces all monetary figures with dots across the whole application. Bottle counts and
              windows stay visible, so the tool still works.
            </p>
          </div>
          <button
            className={`switch${prefs.discreet ? ' is-on' : ''}`}
            onClick={() => onDiscreet(!prefs.discreet)}
            role="switch"
            aria-checked={prefs.discreet}
            type="button"
          >
            <span />
          </button>
        </div>

        <div className="setting">
          <div>
            <strong>Auto-lock</strong>
            <p>
              Locks the cellar after a period without activity. Requires a passcode.
              {!encrypted && ' Not available until encryption is on.'}
            </p>
          </div>
          <select
            className="inline-select"
            value={prefs.autoLockMinutes}
            onChange={(e) => onAutoLock(Number(e.target.value))}
            disabled={!encrypted}
          >
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={0}>Never</option>
          </select>
        </div>
      </Panel>

      <Panel title="Your data" hint="Yours to take, and yours to destroy.">
        <div className="data-actions">
          <button className="data-action" onClick={onExportCsv} type="button">
            <Icon name="download" size={17} />
            <span>
              <strong>Export a schedule</strong>
              <em>CSV for your broker or insurer</em>
            </span>
          </button>
          <button className="data-action" onClick={onExportJson} type="button">
            <Icon name="download" size={17} />
            <span>
              <strong>Export a backup</strong>
              <em>Complete JSON, unencrypted</em>
            </span>
          </button>
          <button className="data-action data-danger" onClick={erase} type="button">
            <Icon name="trash" size={17} />
            <span>
              <strong>Erase everything</strong>
              <em>Delete this device’s record</em>
            </span>
          </button>
        </div>
        <p className="fineprint">
          Exports are written straight to your downloads. A JSON backup is plain text — treat it like
          the cellar key.
        </p>
      </Panel>

      <Panel title="What this does and does not protect">
        <div className="limits">
          <div>
            <h4>
              <Icon name="check" size={14} /> Protects against
            </h4>
            <ul>
              <li>Anyone reading the stored record without your passcode</li>
              <li>Shoulder-surfing and screenshots, with discretion mode on</li>
              <li>A lost or stolen device that is locked at the operating-system level</li>
              <li>Third-party collection, because nothing is ever transmitted</li>
            </ul>
          </div>
          <div>
            <h4>
              <Icon name="alert" size={14} /> Does not protect against
            </h4>
            <ul>
              <li>Malware, a hostile browser extension, or someone watching you type</li>
              <li>A device left unlocked and unattended with the cellar open</li>
              <li>Clearing browser data — which erases the cellar permanently</li>
              <li>Losing the passcode, for which there is deliberately no recovery</li>
            </ul>
          </div>
        </div>
      </Panel>
    </>
  )
}
