import { useState } from 'react'
import type { Locale, User } from '../types'
import { I18N } from '../types/i18n'
import './Layout.css'

interface LayoutProps {
  locale: Locale
  user?: User
  onLocaleChange: (locale: Locale) => void
  onNavigate: (page: PageType) => void
  currentPage: PageType
  onLogout: () => void
  children: React.ReactNode
}

type PageType = 'auth' | 'dashboard' | 'explore' | 'donate' | 'profile' | 'participate' | 'organization' | 'admin'

export function Layout({
  locale,
  user,
  onLocaleChange,
  onNavigate,
  currentPage,
  onLogout,
  children,
}: LayoutProps) {
  const t = I18N[locale]
  const [menuOpen, setMenuOpen] = useState(false)

  function handleNavigate(page: PageType) {
    onNavigate(page)
    setMenuOpen(false)
  }

  return (
    <div className="layout">
      <nav className="navbar navbar-custom navbar-expand-lg navbar-dark">
        <div className="container">
          <button 
            className="navbar-brand brand-button" 
            onClick={() => handleNavigate('dashboard')}
          >
            🤝 {t.brand}
          </button>
          <button
            className="navbar-toggler"
            type="button"
            aria-controls="navbarNav"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav ms-auto nav-links">
              {user ? (
                <>
                  <li className="nav-item">
                    <button
                      className={`nav-link nav-link-btn ${currentPage === 'explore' ? 'active' : ''}`}
                      onClick={() => handleNavigate('explore')}
                    >
                      {t.explore}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link nav-link-btn ${currentPage === 'donate' ? 'active' : ''}`}
                      onClick={() => handleNavigate('donate')}
                    >
                      {t.donate}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link nav-link-btn ${currentPage === 'participate' ? 'active' : ''}`}
                      onClick={() => handleNavigate('participate')}
                    >
                      {t.participate}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link nav-link-btn ${currentPage === 'organization' ? 'active' : ''}`}
                      onClick={() => handleNavigate('organization')}
                    >
                      {t.organization}
                    </button>
                  </li>
                  {user.role === 'SUPER_ADMIN' && (
                    <li className="nav-item">
                      <button
                        className={`nav-link nav-link-btn ${currentPage === 'admin' ? 'active' : ''}`}
                        onClick={() => handleNavigate('admin')}
                      >
                        {t.admin}
                      </button>
                    </li>
                  )}
                  <li className="nav-item">
                    <button
                      className={`nav-link nav-link-btn ${currentPage === 'profile' ? 'active' : ''}`}
                      onClick={() => handleNavigate('profile')}
                    >
                      {t.profile}
                    </button>
                  </li>
                </>
              ) : null}

              <li className="nav-divider"></li>

              <li className="nav-item lang-selector">
                <select 
                  value={locale} 
                  onChange={(e) => onLocaleChange(e.target.value as Locale)}
                  className="form-select form-select-sm lang-select-control"
                >
                  <option value="fr">FR</option>
                  <option value="ar">AR</option>
                </select>
              </li>

              {user ? (
                <li className="nav-item">
                  <button
                    onClick={onLogout}
                    className="nav-link nav-link-btn logout-link"
                  >
                    {t.logout}
                  </button>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </nav>

      <div className="container layout-container">{children}</div>

      <footer className="layout-footer">
        <p>&copy; 2024 {t.brand}. {t.allRightsReserved}</p>
      </footer>
    </div>
  )
}
