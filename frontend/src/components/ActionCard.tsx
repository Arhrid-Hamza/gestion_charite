import type { CharityAction, Locale } from '../types'
import { I18N } from '../types/i18n'
import '../styles/ActionCard_new.css'

interface ActionCardProps {
  action: CharityAction
  locale: Locale
  onSelect?: (action: CharityAction) => void
  onViewDetails?: (actionId: number) => void
}

const CATEGORY_IMAGES: Record<string, string> = {
  vocational:  '/images/vocational.jpg',
  emergency:   '/images/emergency.jpg',
  environment: '/images/environment.jpg',
  women:       '/images/women.jpg',
  health:      '/images/health.jpg',
  water:       '/images/water.jpg',
  shelter:     '/images/shelter.jpg',
  youth:       '/images/youth.jpg',
  education:   '/images/education.jpg',
  default:     '/images/education.jpg',
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  vocational:  'linear-gradient(135deg,#3b1f6e,#6a3ea1)',
  emergency:   'linear-gradient(135deg,#7b1c1c,#b71c1c)',
  environment: 'linear-gradient(135deg,#1a4731,#2e7d32)',
  women:       'linear-gradient(135deg,#6b1f3e,#a13e6a)',
  health:      'linear-gradient(135deg,#145a32,#0a7a4b)',
  water:       'linear-gradient(135deg,#0d3b6e,#1a7fc1)',
  shelter:     'linear-gradient(135deg,#3e2a1a,#8a5a2a)',
  youth:       'linear-gradient(135deg,#1a3a6e,#3e6aa1)',
  education:   'linear-gradient(135deg,#1e3a5f,#0c7a8a)',
  default:     'linear-gradient(135deg,#0a5f72,#0c7a8a)',
}

// Ordre muhim: most specific f l-awwel
// TITLE + DESCRIPTION fقط — backend category ma katsta3mlhach
const KEYWORD_MAP: Array<{ key: string; words: string[] }> = [
  {
    key: 'vocational',
    words: ['vocational', 'trade', 'it skill', 'skill training', 'unemployed', 'chomeur', 'metier', 'apprentissage', 'formation pro', 'workshop', 'atelier', 'carpent', 'plumb', 'electric'],
  },
  {
    key: 'emergency',
    words: ['emergency', 'urgence', 'disaster', 'relief', 'catastrophe', 'crisis', 'crise', 'flood', 'inondation', 'seisme', 'séisme', 'earthquake'],
  },
  {
    key: 'environment',
    words: ['environment', 'environnement', 'reforestation', 'ecology', 'climate', 'deforestation', 'pollution', 'forest', 'foret', 'solar', 'renewable', 'green energy'],
  },
  {
    key: 'women',
    words: ['maternal', 'prenatal', 'maternite', 'obstetric', 'women empowerment', 'fistula', 'midwife', 'sage-femme', 'accouchement', 'pregnant', 'enceinte'],
  },
  {
    key: 'health',
    words: ['medical', 'clinic', 'health', 'sante', 'hopital', 'hospital', 'doctor', 'nurse', 'vaccination', 'vaccine', 'surgery', 'chirurgie', 'medicine', 'hygiene'],
  },
  {
    key: 'water',
    words: ['water', 'eau', 'well', 'puit', 'sanitation', 'drinking', 'assainissement', 'borehole', 'pump'],
  },
  {
    key: 'shelter',
    words: ['shelter', 'housing', 'logement', 'abri', 'construction', 'refugee', 'sans-abri', 'homeless', 'toit', 'roof', 'building'],
  },
  {
    key: 'youth',
    words: ['youth', 'jeune', 'jeunesse', 'sport', 'teenager', 'adolescent', 'child', 'children', 'enfant', 'kids', 'playground'],
  },
  {
    key: 'education',
    words: ['school', 'education', 'learn', 'student', 'classe', 'ecole', 'enseignement', 'supplies', 'fournitures', 'notebook', 'book', 'literacy', 'alphabetisation', 'teacher', 'classroom'],
  },
]

function detectImageKey(title: string, description: string): string {
  // ONLY title + description — backend category completely ignored
  const text = `${title} ${description}`.toLowerCase()
  const match = KEYWORD_MAP.find(({ words }) => words.some((w) => text.includes(w)))
  return match?.key ?? 'default'
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

  // Image detected from title + description only
  const imageKey = detectImageKey(action.title, action.description || '')
  const backImage = CATEGORY_IMAGES[imageKey]
  const fallbackGradient = CATEGORY_GRADIENTS[imageKey]

  return (
    <div
      className="action-card"
      onClick={() => onSelect && onSelect(action)}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onSelect) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(action)
        }
      }}
      style={onSelect ? { cursor: 'pointer' } : undefined}
    >
      <div className="flip-3d">
        <div className="flip-inner">

          {/* ── FRONT — sans image ── */}
          <div className="flip-front">
            <div className="action-card-body">
              <div className="action-header">
                <h5 className="action-title">{action.title}</h5>
                <span
                  className={`badge bg-${
                    status === 'OPEN'
                      ? 'success'
                      : status === 'CLOSED'
                      ? 'warning'
                      : 'danger'
                  }`}
                >
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
                  <div
                    className="progress"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <progress
                      className="progress-bar"
                      value={progress}
                      max={100}
                      aria-hidden="true"
                    />
                    {progress > 10 && (
                      <span className="progress-text">{progress}%</span>
                    )}
                  </div>
                </div>
              )}

              <div className="action-buttons">
                {onSelect && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(action)
                    }}
                  >
                    {t.donate}
                  </button>
                )}
                {onViewDetails && (
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewDetails(action.id)
                    }}
                  >
                    {t.details}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── BACK — image full-bleed ── */}
          <div className="flip-back" style={{ background: fallbackGradient }}>
            <img
              src={backImage}
              alt={`${action.title} cover`}
              className="action-back-image"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="back-overlay">
              <h5 className="action-title">{action.title}</h5>
              <p className="action-desc">{action.description}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}