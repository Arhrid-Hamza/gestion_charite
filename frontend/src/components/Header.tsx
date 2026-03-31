import type { ReactNode } from 'react'
import type { Locale } from '../types'
import { I18N } from '../types/i18n'
import './Header.css'

interface HeaderProps {
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  userName?: string
}

export function Header({ locale, onLocaleChange, userName }: HeaderProps) {
  const t = I18N[locale]

  return (
    <header className="header-hero">
      <div className="header-content">
        <div className="header-branding">
          <div className="logo-icon">🎗️</div>
          <div>
            <p className="header-kicker">{t.brand}</p>
            <h1>CharityHub</h1>
          </div>
        </div>
        <div className="header-actions">
          {userName && (
            <div className="user-badge">
              <span className="user-avatar">👤</span>
              <span className="user-name">{userName}</span>
            </div>
          )}
          <select 
            value={locale} 
            onChange={(e) => onLocaleChange(e.target.value as Locale)} 
            className="lang-select"
            title="Select language"
          >
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>
    </header>
  )
}

interface AlertProps {
  type: 'error' | 'success' | 'info'
  message: string
  onClose?: () => void
}

export function Alert({ type, message, onClose }: AlertProps) {
  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  )
}

interface FormGroupProps {
  label: string
  children: ReactNode
  error?: string
}

export function FormGroup({ label, children, error }: FormGroupProps) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      {children}
      {error && <small className="form-error">{error}</small>}
    </div>
  )
}

interface LoaderProps {
  message?: string
}

export function Loader({ message = 'Chargement...' }: LoaderProps) {
  return (
    <div className="loader">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  )
}
