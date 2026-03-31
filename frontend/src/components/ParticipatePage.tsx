import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import { Alert, Loader } from './Header'
import type { Locale, Participation } from '../types'
import '../styles/ParticipatePage.css'

interface ParticipatePageProps {
  locale: Locale
  userId?: number
  onSuccess?: (participation: Participation) => void
}

export function ParticipatePage({ locale, userId, onSuccess }: ParticipatePageProps) {
  const t = I18N[locale]
  const { call, error, isLoading, setError } = useApi()

  const [actionId, setActionId] = useState(0)
  const [role, setRole] = useState('VOLUNTEER')
  const [participations, setParticipations] = useState<Participation[]>([])
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (userId) {
      void call<Participation[]>(`/participations/user/${userId}`).then(setParticipations)
    }
  }, [userId])

  async function handleRegister() {
    if (!userId || !actionId) {
      setError('Utilisateur ou action non défini')
      return
    }

    setSuccess('')

    try {
      const payload = await call<Participation>('/participations', {
        method: 'POST',
        body: JSON.stringify({
          charityActionId: actionId,
          participantUserId: userId,
          roleInAction: role,
        }),
      })

      setSuccess('Inscription à l\'événement réussie!')
      setActionId(0)
      onSuccess?.(payload)
      await call<Participation[]>(`/participations/user/${userId}`).then(setParticipations)
    } catch {
      // Erreur déjà définie
    }
  }

  return (
    <div className="participate-page py-5">
      <div className="container">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} />}

        <div className="row">
          <div className="col-md-6">
            <div className="card registration-card">
              <div className="card-body">
                <h2>{t.participate}</h2>

                <div className="mb-3">
                  <label htmlFor="action-id" className="form-label">{t.charityAction}</label>
                  <input
                    id="action-id"
                    type="number"
                    className="form-control"
                    value={actionId}
                    onChange={(e) => setActionId(parseInt(e.target.value))}
                    placeholder="ID de l'action"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="role" className="form-label">{t.role}</label>
                  <select 
                    id="role"
                    className="form-select" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="VOLUNTEER">Bénévole</option>
                    <option value="ORGANIZER">Organisateur</option>
                    <option value="SUPPORTER">Supporteur</option>
                  </select>
                </div>

                <button
                  onClick={() => void handleRegister()}
                  disabled={isLoading || !actionId}
                  className="btn btn-primary btn-lg w-100"
                >
                  {t.register}
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card history-card">
              <div className="card-body">
                <h3>{t.myParticipations}</h3>

                {isLoading ? (
                  <Loader message={t.loading} />
                ) : participations.length === 0 ? (
                  <p className="no-participations">{t.noParticipations}</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {participations.map((p) => (
                      <div key={p.id} className="list-group-item participation-item">
                        <div className="participation-info">
                          <span className="participation-action">Action #{p.charityActionId}</span>
                          <span className="badge bg-info">{p.roleInAction}</span>
                        </div>
                        <small className="participation-date">{p.createdAt}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
