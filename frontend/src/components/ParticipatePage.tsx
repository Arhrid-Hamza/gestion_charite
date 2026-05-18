import { useState, useEffect } from 'react'
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
  { value: 'VOLUNTEER', label: 'Bénévole',    icon: '🤝', activeClass: 'active-volunteer' },
  { value: 'ORGANIZER', label: 'Organisateur', icon: '📋', activeClass: 'active-organizer' },
  { value: 'SUPPORTER', label: 'Supporteur',   icon: '💙', activeClass: 'active-supporter' },
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
  } catch {
    return dateStr
  }
}

export function ParticipatePage({ locale, userId, onSuccess }: ParticipatePageProps) {
  const t = I18N[locale]
  const { call, error, isLoading, setError } = useApi()

  const [actionId, setActionId] = useState(0)
  const [role, setRole]         = useState('VOLUNTEER')
  const [participations, setParticipations] = useState<Participation[]>([])
  const [success, setSuccess]   = useState('')

  useEffect(() => {
    if (userId) {
      const id = window.setTimeout(() => {
        void call<Participation[]>(`/participations/user/${userId}`).then(setParticipations)
      }, 0)
      return () => window.clearTimeout(id)
    }
  }, [call, userId])

  async function handleRegister() {
    if (!userId || !actionId) { setError('Utilisateur ou action non défini'); return }
    setSuccess('')
    try {
      const payload = await call<Participation>('/participations', {
        method: 'POST',
        body: JSON.stringify({ charityActionId: actionId, participantUserId: userId, roleInAction: role }),
      })
      setSuccess("Inscription à l'événement réussie!")
      setActionId(0)
      onSuccess?.(payload)
      await call<Participation[]>(`/participations/user/${userId}`).then(setParticipations)
    } catch { /* handled by useApi */ }
  }

  return (
    <div className="participate-page">
      <div className="container">

        {/* Alerts */}
        {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} />}

        {/* Header */}
        <div className="participate-header">
          <span className="page-eyebrow">🎗️ Charité</span>
          <h1>S'engager & <em>participer</em></h1>
          <p>Rejoignez une action caritative et faites la différence</p>
        </div>

        {/* ── Single unified card ── */}
        <div className="card participate-card">
          <div className="card-body">

            {/* ── Section 1 : Registration ── */}
            <section className="participate-section">
              <h2>
                <span className="card-title-icon">✨</span>
                {t.participate}
              </h2>

              <div className="form-row">
                {/* Action ID */}
                <div className="mb-3">
                  <label htmlFor="action-id" className="form-label">{t.charityAction}</label>
                  <input
                    id="action-id"
                    type="number"
                    className="form-control"
                    value={actionId || ''}
                    onChange={(e) => setActionId(parseInt(e.target.value) || 0)}
                    placeholder="ID de l'action caritative"
                    min={1}
                  />
                </div>

                {/* Role pills */}
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
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => void handleRegister()}
                disabled={isLoading || !actionId}
                className="btn btn-primary w-100"
              >
                {isLoading ? '...' : `${t.register} →`}
              </button>
            </section>

            {/* ── Divider ── */}
            <div className="section-divider" />

            {/* ── Section 2 : History ── */}
            <section className="participate-section">
              <h3>
                <span className="card-title-icon">📜</span>
                {t.myParticipations}
              </h3>

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
                        <span className="participation-action">Action #{p.charityActionId}</span>
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

      </div>
    </div>
  )
}