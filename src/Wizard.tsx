import { useEffect, useRef, useState } from 'react'
import { ALL_NAV } from './routes'
import type { Bottle } from './types'
import { WindowBar } from './ui'
import { Icon } from './icons'

export const WIZARD_STEPS = 6

/** The content of a single step, kept separate from the navigation state. */
export function WizardStepView({
  step,
  registerNo,
  openedOn,
  bottleCount,
  sample,
}: {
  step: number
  registerNo: number
  openedOn: string
  bottleCount: number
  sample?: Bottle
}) {
  switch (step) {
    case 0:
      return (
        <section className="wizard-step">
          <p className="eyebrow">Admitted · {openedOn}</p>
          <h1 className="wizard-title">
            A cellar like yours deserves better than <em>memory.</em>
          </h1>
          <p className="wizard-lede">
            Cellar Atlas is not a catalogue, a marketplace or a social network. It is one
            instrument, built for one question — the question you answer every evening without
            quite enough information.
          </p>
          <p className="wizard-lede quiet">
            Nothing here is public. There is no account, no feed, and no one else’s cellar to compare
            yours against.
          </p>
        </section>
      )

    case 1:
      return (
        <section className="wizard-step">
          <p className="eyebrow">The problem</p>
          <h1 className="wizard-title">Two ways to waste a great bottle.</h1>
          <div className="wizard-pair">
            <div className="wizard-pair-item">
              <span className="wizard-pair-num">i</span>
              <h3>Opened too early</h3>
              <p>
                You spend the years you paid for. A grand cru at eight years old is an expensive
                lesson in patience.
              </p>
            </div>
            <div className="wizard-pair-item">
              <span className="wizard-pair-num">ii</span>
              <h3>Opened too late</h3>
              <p>
                The wine is still sound and the money is gone. Past its peak, a bottle is worth a
                little less every month it stays shut.
              </p>
            </div>
          </div>
          <p className="wizard-lede quiet">
            Both mistakes are invisible until someone puts the calendar in front of you.
          </p>
        </section>
      )

    case 2:
      return (
        <section className="wizard-step">
          <p className="eyebrow">What it does</p>
          <h1 className="wizard-title">So it answers one thing, every evening.</h1>
          <p className="wizard-lede">
            Every bottle carries four years: first pour, the peak, the end of the peak, and the last
            call. Cellar Atlas holds all of them at once — then tells you what is ready tonight,
            where it is sleeping, and what waiting would cost.
          </p>

          {sample && (
            <div className="wizard-demo">
              <div className="wizard-demo-head">
                <span className="eyebrow">Open tonight</span>
                <span className="pill pill-peak">At peak</span>
              </div>
              <p className="wizard-demo-vintage">{sample.vintage}</p>
              <p className="wizard-demo-name">{sample.producer}</p>
              <p className="wizard-demo-meta">
                {sample.cuvee} · {sample.location}
              </p>
              <WindowBar bottle={sample} />
              <p className="wizard-demo-why">
                At peak · one tap records the bottle in your cellar book
              </p>
            </div>
          )}

          <p className="wizard-lede quiet">
            No forms. No data entry. The record writes itself as you drink.
          </p>
        </section>
      )

    case 3:
      return (
        <section className="wizard-step">
          <p className="eyebrow">The rooms</p>
          <h1 className="wizard-title">Seven rooms. No more.</h1>
          <p className="wizard-lede">
            You will spend almost all of your time in the first one. The rest are there for the
            evenings when you want the whole picture.
          </p>
          <ul className="wizard-rooms">
            {ALL_NAV.map((item) => (
              <li key={item.route}>
                <span className="wizard-room-icon">
                  <Icon name={item.icon} size={16} />
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <em>{item.blurb}</em>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )

    case 4:
      return (
        <section className="wizard-step">
          <p className="eyebrow">Discretion</p>
          <h1 className="wizard-title">Yours alone, by design.</h1>
          <p className="wizard-lede">
            A list of what you own and where you keep it is a security document. It never leaves this
            device.
          </p>
          <ul className="wizard-assure">
            <li>
              <Icon name="shieldCheck" size={16} />
              <span>
                <strong>No account, no server.</strong> Nothing is uploaded, synced or shared.
              </span>
            </li>
            <li>
              <Icon name="key" size={16} />
              <span>
                <strong>A passcode seals the record</strong> with AES-256 encryption at rest. Without
                it, the file is unreadable.
              </span>
            </li>
            <li>
              <Icon name="eye-off" size={16} />
              <span>
                <strong>Discretion mode</strong> dots out every figure for a screen someone else can
                see.
              </span>
            </li>
          </ul>
          <p className="wizard-lede quiet">
            Set a passcode whenever you are ready, from Privacy &amp; security.
          </p>
        </section>
      )

    default:
      return (
        <section className="wizard-step">
          <p className="eyebrow">The register is open</p>
          <h1 className="wizard-title">
            Your cellar is already <em>stocked.</em>
          </h1>
          <p className="wizard-lede">
            {bottleCount} bottles of benchmark wine are here so you can see the thing working.
            Replace them with your own at any time — the cellar is yours, not a demo you have to
            clear out first.
          </p>
          <ul className="wizard-next">
            <li>
              <span>01</span> Look at Tonight. Open a bottle. Watch the count change.
            </li>
            <li>
              <span>02</span> Remove a wine you would never buy, then add one you would.
            </li>
            <li>
              <span>03</span> Set a passcode before you put anything real in here.
            </li>
          </ul>
          <p className="wizard-lede quiet">
            Register № {String(registerNo).padStart(4, '0')} · opened {openedOn}
          </p>
        </section>
      )
  }
}

export function Wizard({
  registerNo,
  openedOn,
  bottleCount,
  sample,
  onFinish,
  onAddFirst,
}: {
  registerNo: number
  openedOn: string
  bottleCount: number
  sample?: Bottle
  onFinish: () => void
  onAddFirst: () => void
}) {
  const [step, setStep] = useState(0)
  const shell = useRef<HTMLDivElement>(null)
  const total = WIZARD_STEPS

  const opened = new Date(`${openedOn}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  useEffect(() => {
    shell.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFinish()
      if (e.key === 'ArrowRight' && step < total - 1) setStep((s) => s + 1)
      if (e.key === 'ArrowLeft' && step > 0) setStep((s) => s - 1)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onFinish, step, total])

  return (
    <div className="wizard" role="dialog" aria-modal="true" aria-label="Welcome to Cellar Atlas">
      <div className="wizard-shell" ref={shell} tabIndex={-1}>
        <header className="wizard-top">
          <div className="wizard-brand">
            <span className="monogram">
              <Icon name="cellar" size={18} />
            </span>
            <span className="wizard-brand-text">
              Cellar Atlas
              <em>Private register № {String(registerNo).padStart(4, '0')}</em>
            </span>
          </div>
          <button className="wizard-skip" onClick={onFinish} type="button">
            Skip the introduction
          </button>
        </header>

        <div className="wizard-stage">
          <div className="wizard-dots" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={i === step ? 'is-on' : i < step ? 'is-past' : ''} />
            ))}
          </div>

          <WizardStepView
            step={step}
            registerNo={registerNo}
            openedOn={opened}
            bottleCount={bottleCount}
            sample={sample}
          />
        </div>

        <footer className="wizard-foot">
          <div className="wizard-foot-left">
            <span className="wizard-count">
              {step + 1} / {total}
            </span>
            {step > 0 ? (
              <button className="btn btn-ghost btn-small" onClick={() => setStep((s) => s - 1)}>
                Back
              </button>
            ) : null}
          </div>

          <div className="wizard-foot-right">
            {step === total - 1 ? (
              <>
                <button className="btn btn-ghost btn-small" onClick={onAddFirst}>
                  Add my first bottle
                </button>
                <button className="btn btn-primary" onClick={onFinish}>
                  Enter the cellar
                  <Icon name="arrow" size={15} />
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
                Continue
                <Icon name="arrow" size={15} />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
