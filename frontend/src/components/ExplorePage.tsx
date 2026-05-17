import { useState, useEffect, useCallback } from 'react'
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

  const loadActions = useCallback(async () => {
    try {
      const query = new URLSearchParams()
      if (category) query.append('category', category)
      if (popular) query.append('popular', 'true')

      const queryString = query.toString()
      const data = await call<CharityAction[]>(
        queryString ? `/charity-actions?${queryString}` : '/charity-actions',
      )
      setActions(data)
    } catch {
      // Erreur déjà définie
    }
  }, [call, category, popular])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadActions()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadActions])

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
    <div className="explore-page">
      <div className="container">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Hero banner */}
        <div className="explore-hero">
          <h2>🔍 {t.explore}</h2>
          <p>Découvrez des actions caritatives et trouvez la cause qui vous correspond</p>
        </div>

        {/* Filter bar */}
        <div className="explore-filters">
          <div className="explore-filters-row">

            {/* Category select */}
            <div className="filter-group">
              <span className="filter-label">{t.category}</span>
              <select
                id="category"
                className="filter-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Toutes les catégories</option>
                <option value="education">Éducation</option>
                <option value="sante">Santé</option>
                <option value="environnement">Environnement</option>
              </select>
            </div>

            {/* Popular toggle */}
            <div className="filter-group">
              <span className="filter-label">&nbsp;</span>
              <div
                className={`toggle-pill${popular ? ' active' : ''}`}
                onClick={() => setPopular((p) => !p)}
              >
                <div className="check-box">{popular ? '✓' : ''}</div>
                {t.popular}
              </div>
            </div>

            {/* Recommendations */}
            <button
              className="btn-recommend"
              onClick={() => void loadRecommended()}
            >
              ✨ {t.recommendations}
            </button>
          </div>
        </div>

        {/* Section header */}
        {!isLoading && (
          <div className="section-header">
            <h3>Actions disponibles</h3>
            <span className="result-count">{actions.length} résultat{actions.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <Loader message={t.loading} />
        ) : (
          <>
            {actions.length > 0 ? (
              <div className="actions-grid">
                {actions.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    locale={locale}
                    onSelect={(a) => onActionSelect?.(a)}
                  />
                ))}
              </div>
            ) : (
              <div className="no-actions">
                <div className="no-actions-icon">🔍</div>
                <p>{t.noActions}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}