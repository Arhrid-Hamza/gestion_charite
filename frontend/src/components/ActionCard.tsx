import type { CharityAction, Locale } from '../types'
import { I18N } from '../types/i18n'
import './ActionCard.css'

interface ActionCardProps {
  action: CharityAction
  locale: Locale
  onSelect?: (action: CharityAction) => void
  onViewDetails?: (actionId: number) => void
}

export function ActionCard({
  action,
  locale,
  onSelect,
  onViewDetails,
}: ActionCardProps) {
  const t = I18N[locale]
  const progress = action.targetAmount
    ? Math.ceil((action.collectedAmount / action.targetAmount) * 100)
    : 0

  const category = action.category || action.categoryName || 'Sans categorie'
  const status = action.status as string

  return (
    <div className="action-card">
      {action.mediaUrls && action.mediaUrls.length > 0 && (
        <img 
          src={Array.isArray(action.mediaUrls) ? action.mediaUrls[0] : action.mediaUrls} 
          alt={action.title} 
          className="action-card-image"
        />
      )}
      <div className="action-card-body">
        <div className="action-header">
          <h5 className="action-title">{action.title}</h5>
          <span className={`badge bg-${status === 'OPEN' ? 'success' : status === 'CLOSED' ? 'warning' : 'danger'}`}>
            {status}
          </span>
        </div>

        <p className="action-desc">{action.description}</p>

        <div className="action-meta">
          <span className="meta-item">📍 {action.location || 'N/A'}</span>
          <span className="meta-item">🏷️ {category}</span>
        </div>

        {action.targetAmount && (
          <div className="action-progress">
            <div className="progress-labels">
              <span>${action.collectedAmount}</span>
              <span>${action.targetAmount}</span>
            </div>
            <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <progress className="progress-bar" value={progress} max={100} aria-hidden="true" />
              {progress > 10 && <span className="progress-text">{progress}%</span>}
            </div>
          </div>
        )}

        <div className="action-buttons">
          {onSelect && (
            <button className="btn btn-primary btn-sm" onClick={() => onSelect(action)}>
              {t.donate}
            </button>
          )}
          {onViewDetails && (
            <button className="btn btn-outline-secondary btn-sm" onClick={() => onViewDetails(action.id)}>
              {t.details}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
