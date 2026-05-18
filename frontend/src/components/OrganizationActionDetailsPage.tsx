import type { CharityAction, Locale } from '../types'
import { I18N } from '../types/i18n'

interface OrganizationActionDetailsPageProps {
  locale: Locale
  action: CharityAction
  onBack: () => void
  onEdit: (action: CharityAction) => void
}

function mediaList(value?: string | string[]) {
  if (!value) return []
  if (Array.isArray(value)) return value
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function OrganizationActionDetailsPage({ locale, action, onBack, onEdit }: OrganizationActionDetailsPageProps) {
  const t = I18N[locale]
  const progress = Math.min(
    100,
    (Number(action.collectedAmount || 0) / Math.max(Number(action.targetAmount || 0), 1)) * 100,
  )
  const media = mediaList(action.mediaUrls)

  return (
    <div className="org-dashboard">
      <div className="dashboard-container">
        <div className="org-overview-card">
          <div className="org-overview-header">
            <div className="org-info">
              <h2 className="org-name">{action.title}</h2>
              <p className="org-status">
                Status:{' '}
                <span className={`status-badge status-${(action.status || 'active').toLowerCase()}`}>
                  {action.status || 'ACTIVE'}
                </span>
              </p>
            </div>
            <div className="action-actions">
              <button className="btn btn-secondary" onClick={onBack}>
                {t.back}
              </button>
              <button className="btn btn-primary" onClick={() => onEdit(action)}>
                {t.edit}
              </button>
            </div>
          </div>

          <div className="org-details-view">
            <div className="detail-row full-width">
              <label>{t.description}:</label>
              <span>{action.description}</span>
            </div>
            <div className="detail-row">
              <label>{t.category}:</label>
              <span>{action.categoryName || action.category || '-'}</span>
            </div>
            <div className="detail-row">
              <label>{t.location}:</label>
              <span>{action.location || '-'}</span>
            </div>
            <div className="detail-row">
              <label>{t.startDate}:</label>
              <span>{action.startDate || '-'}</span>
            </div>
            <div className="detail-row">
              <label>{t.endDate}:</label>
              <span>{action.endDate || '-'}</span>
            </div>
            <div className="detail-row">
              <label>{t.raised}:</label>
              <span>${Number(action.collectedAmount || 0).toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <label>{t.targetAmountStr}:</label>
              <span>${Number(action.targetAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="org-progress-panel" style={{ marginTop: '1rem' }}>
            <h3>{t.fundingOverview}</h3>
            <div className="org-progress-ring">
              <span>{progress.toFixed(0)}%</span>
            </div>
          </div>

          {media.length > 0 && (
            <div className="detail-row full-width" style={{ marginTop: '1rem' }}>
              <label>{t.mediaUrls}:</label>
              <span>
                {media.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
