import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import { Alert, Loader } from './Header'
import { ActionCard } from './ActionCard'
import type { Locale, CharityAction } from '../types'
import '../styles/ExplorePage.css'

interface ExplorePageProps {
  locale: Locale
  userId?: number
  onActionSelect?: (action: CharityAction) => void
}

export function ExplorePage({ locale, userId, onActionSelect }: ExplorePageProps) {
  const t = I18N[locale]
  const { call, error, isLoading, setError } = useApi()

  const [actions, setActions] = useState<CharityAction[]>([])
  const [category, setCategory] = useState('')
  const [popular, setPopular] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadActions()
  }, [category, loadActions, popular])

  async function loadActions() {
    try {
      const query = new URLSearchParams()
      if (category) query.append('category', category)
      if (popular) query.append('popular', 'true')

      const data = await call<CharityAction[]>(
        `/charity-actions?${query.toString()}`,
      )
      setActions(data)
    } catch {
      // Erreur déjà définie
    }
  }

  async function loadRecommended() {
    if (!userId) {
      setError('Utilisateur non identifié')
      return
    }

    try {
      const data = await call<CharityAction[]>(`/charity-actions/recommended/${userId}`)
      setActions(data)
    } catch {
      // Erreur déjà définie
    }
  }

  return (
    <div className="explore-page py-5">
      <div className="container">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <div className="explore-filters">
          <h2>{t.explore}</h2>

          <div className="row mb-3">
            <div className="col-md-3">
              <div className="mb-3">
                <label htmlFor="category" className="form-label">{t.category}</label>
                <select
                  id="category"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Toutes</option>
                  <option value="education">Éducation</option>
                  <option value="sante">Santé</option>
                  <option value="environnement">Environnement</option>
                </select>
              </div>
            </div>

            <div className="col-md-3">
              <div className="filter-check">
                <div className="form-check">
                  <input
                    type="checkbox"
                    id="popular"
                    className="form-check-input"
                    checked={popular}
                    onChange={(e) => setPopular(e.target.checked)}
                  />
                  <label htmlFor="popular" className="form-check-label">
                    {t.popular}
                  </label>
                </div>
              </div>
            </div>

            <div className="col-md-6 text-end">
              <button 
                onClick={() => void loadRecommended()}
                className="btn btn-outline-primary btn-sm"
              >
                {t.recommendations}
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <Loader message={t.loading} />
        ) : (
          <div className="row g-4">
            {actions.map((action) => (
              <div key={action.id} className="col-md-4 col-sm-6 col-xs-12">
                <ActionCard
                  action={action}
                  locale={locale}
                  onSelect={(a) => onActionSelect?.(a)}
                />
              </div>
            ))}
          </div>
        )}

        {!isLoading && actions.length === 0 && (
          <div className="no-actions">
            <p>{t.noActions}</p>
          </div>
        )}
      </div>
    </div>
  )
}
