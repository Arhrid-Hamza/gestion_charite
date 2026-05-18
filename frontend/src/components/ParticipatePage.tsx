import { useState, useEffect, useRef } from 'react'
import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import { Alert } from './Header'
import type { Locale, Participation } from '../types'
import '../styles/ParticipatePage.css'

interface ParticipatePageProps {
  locale: Locale
  userId?: number
  onSuccess?: (participation: Participation) => void
}

const ROLES = [
  { value: 'VOLUNTEER', activeClass: 'active-volunteer', icon: '🤝' },
  { value: 'ORGANIZER', activeClass: 'active-organizer', icon: '📋' },
  { value: 'SUPPORTER', activeClass: 'active-supporter', icon: '💙' },
]

function getRoleBadgeClass(role: string) {
  if (role === 'VOLUNTEER') return 'badge badge-volunteer'
  if (role === 'ORGANIZER') return 'badge badge-organizer'
  if (role === 'SUPPORTER') return 'badge badge-supporter'
  return 'badge bg-info'
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return dateStr }
}

type Panel = 'form' | 'exit-form' | 'history' | 'exit-history'

export function ParticipatePage({ locale, userId, onSuccess }: ParticipatePageProps) {
  const t = I18N[locale]
  const { call, error, isLoading, setError } = useApi()

  const [actionId, setActionId]   = useState(0)
  const [role, setRole]           = useState('VOLUNTEER')
  const [participations, setParticipations] = useState<Participation[]>([])
  const [panel, setPanel]         = useState<Panel>('form')
  const [caretFired, setCaretFired] = useState(false)
  const [shakeField, setShakeField] = useState(false)

  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (userId) {
      const id = window.setTimeout(() => {
        void call<Participation[]>(`/participations/user/${userId}`).then(setParticipations)
      }, 0)
      return () => window.clearTimeout(id)
    }
  }, [call, userId])

  async function handleRegister() {
    if (!userId || !actionId) {
      setError(t.userOrActionNotDefined)
      setShakeField(true)
      setTimeout(() => setShakeField(false), 600)
      return
    }
    setError('')

    // Step 1 — fire the caret from button edge
    setCaretFired(true)

    // Step 2 — start sliding the form panel out after caret hits the edge
    setTimeout(() => setPanel('exit-form'), 380)

    // Step 3 — API call (in parallel)
    try {
      const payload = await call<Participation>('/participations', {
        method: 'POST',
        body: JSON.stringify({ charityActionId: actionId, participantUserId: userId, roleInAction: role }),
      })
      onSuccess?.(payload)
      await call<Participation[]>(`/participations/user/${userId}`).then(setParticipations)
    } catch { /* useApi handles */ }

    // Step 4 — show history panel sliding in
    setTimeout(() => {
      setPanel('history')
      setCaretFired(false)
      setActionId(0)
    }, 750)
  }

  function handleBack() {
    setPanel('exit-history')
    setTimeout(() => setPanel('form'), 420)
  }

  const formVisible    = panel === 'form'
  const formExiting    = panel === 'exit-form'
  const historyVisible = panel === 'history'
  const historyExiting = panel === 'exit-history'

  return (
    <div className="participate-page">
      <div className="container">

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <div className="participate-header">
          <span className="page-eyebrow">🎗️ Charité</span>
          <h1>{t.engageAndParticipate}</h1>
          <p>{t.joinActionAndMakeDifference}</p>
        </div>

        {/* ── Single unified card ── */}
        <div className="card participate-card">
          <div className="card-panels">

            {/* ══ Panel A — Form ══ */}
            <div
              className={[
                'pp-panel',
                formVisible    ? 'pp-panel--visible'      : '',
                formExiting    ? 'pp-panel--exit-left'    : '',
                historyVisible ? 'pp-panel--hidden-left'  : '',
                historyExiting ? 'pp-panel--enter-left'   : '',
              ].join(' ').trim()}
              aria-hidden={!formVisible && !formExiting}
            >
              <div className="card-body">
                <section className="participate-section">
                  <h2><span className="card-title-icon">✨</span>{t.participate}</h2>

                  <div className="form-row">
                    <div className="mb-3">
                      <label htmlFor="action-id" className="form-label">{t.charityAction}</label>
                      <input
                        id="action-id"
                        type="number"
                        className={`form-control${shakeField ? ' form-control--shake' : ''}`}
                        value={actionId || ''}
                        onChange={(e) => setActionId(parseInt(e.target.value) || 0)}
                        placeholder={t.charityActionIdPlaceholder}
                        min={1}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t.role}</label>
                      <div className="role-pills">
                        {ROLES.map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            className={`role-pill ${role === r.value ? r.activeClass : ''}`}
                            onClick={() => setRole(r.value)}
                          >
                            <span className="role-icon">{r.icon}</span>
                            {r.value === 'VOLUNTEER' ? t.volunteer : r.value === 'ORGANIZER' ? t.organizerRole : t.supporter}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CTA with flying caret */}
                  <div className="caret-btn-wrap">
                    <button
                      ref={btnRef}
                      onClick={() => void handleRegister()}
                      disabled={isLoading || !actionId || !formVisible}
                      className={`btn btn-primary w-100${caretFired ? ' btn--fired' : ''}`}
                    >
                      {isLoading
                        ? <span className="btn-loader" />
                        : (
                          <>
                            {t.register}
                            <span className={`btn-caret-icon${caretFired ? ' btn-caret-icon--hide' : ''}`}>›</span>
                          </>
                        )
                      }
                    </button>

                    {/* The caret that flies off the right edge */}
                    {caretFired && (
                      <span className="flying-caret" aria-hidden="true">›</span>
                    )}
                  </div>
                </section>
              </div>
            </div>

            {/* ══ Panel B — History ══ */}
            <div
              className={[
                'pp-panel',
                historyVisible ? 'pp-panel--visible'      : '',
                historyExiting ? 'pp-panel--exit-right'   : '',
                formVisible    ? 'pp-panel--hidden-right' : '',
                formExiting    ? 'pp-panel--enter-right'  : '',
              ].join(' ').trim()}
              aria-hidden={!historyVisible && !historyExiting}
            >
              <div className="card-body">
                <section className="participate-section">
                  <div className="history-topbar">
                    <button className="btn-back-pill" onClick={handleBack}>
                      ‹ {t.back}
                    </button>
                    <h3><span className="card-title-icon">📜</span>{t.myParticipations}</h3>
                  </div>

                  {isLoading ? (
                    <div className="loader-wrap">
                      <div className="loader-spinner" />
                      <span>{t.loading}</span>
                    </div>
                  ) : participations.length === 0 ? (
                    <p className="no-participations">{t.noParticipations}</p>
                  ) : (
                    <div className="list-group">
                      {participations.map((p, i) => (
                        <div
                          key={p.id}
                          className="participation-item"
                          style={{ animationDelay: `${i * 0.07}s` }}
                        >
                          <div className="participation-info">
                            <span className="participation-action">{t.actionNumber}{p.charityActionId}</span>
                            <span className={getRoleBadgeClass(p.roleInAction)}>{p.roleInAction}</span>
                          </div>
                          <small className="participation-date">{formatDate(p.createdAt)}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>

          </div>{/* card-panels */}
        </div>{/* card */}

      </div>
    </div>
  )
}