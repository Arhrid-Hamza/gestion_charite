/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react'
import type { Locale, User } from '../types'
import { I18N } from '../types/i18n'
import '../styles/Layout.css'

interface LayoutProps {
  locale: Locale
  user?: User
  onLocaleChange: (locale: Locale) => void
  onNavigate: (page: PageType) => void
  currentPage: PageType
  onLogout: () => void
  children: React.ReactNode
}

type PageType = 'auth' | 'dashboard' | 'explore' | 'donate' | 'profile' | 'participate' | 'organization' | 'admin' | 'org-dashboard'

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
  const isOrganizerSession = user?.role === 'ORGANIZER'

  function getPageLabel(page: PageType) {
    const labels: Record<PageType, string> = {
      auth: (t.auth as string) || 'Auth',
      dashboard: (t.dashboardDesc as string) || 'Dashboard',
      explore: (t.explore as string) || 'Explore',
      donate: (t.donate as string) || 'Donate',
      profile: (t.profile as string) || 'Profile',
      participate: (t.participate as string) || 'Participate',
      organization: (t.organization as string) || 'Organization',
      admin: (t.admin as string) || 'Admin',
      'org-dashboard': 'Organization Dashboard',
    }

    return labels[page] ?? String(page)
  }

  function getPageSlug(page: PageType) {
    const slugs: Record<PageType, string> = {
      auth: 'auth',
      dashboard: 'dashboard',
      explore: 'explore',
      donate: 'donate',
      profile: 'profile',
      participate: 'participate',
      organization: 'organization',
      admin: 'admin',
      'org-dashboard': 'org-dashboard',
    }

    return slugs[page] ?? String(page)
  }

  useEffect(() => {
    try {
      const host = window.location.hostname || 'localhost'
      const port = window.location.port || '5173'
      const slug = getPageSlug(currentPage)

      let label = ''
      switch (currentPage) {
        case 'auth':
          label = (t.auth as string) || 'Auth'
          break
        case 'dashboard':
          label = (t.dashboardDesc as string) || 'Dashboard'
          break
        case 'explore':
          label = (t.explore as string) || 'Explore'
          break
        case 'donate':
          label = (t.donate as string) || 'Donate'
          break
        case 'profile':
          label = (t.profile as string) || 'Profile'
          break
        case 'participate':
          label = (t.participate as string) || 'Participate'
          break
        case 'organization':
          label = (t.organization as string) || 'Organization'
          break
        case 'admin':
          label = (t.admin as string) || 'Admin'
          break
        case 'org-dashboard':
          label = 'Organization Dashboard'
          break
        default:
          label = String(currentPage)
      }

      document.title = `${label} — ${host}:${port}/${slug}`
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [currentPage, locale, t])

  function isActive(page: PageType) {
    return currentPage === page
  }

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
            onClick={() => handleNavigate(isOrganizerSession ? 'org-dashboard' : 'dashboard')}
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
                isOrganizerSession ? (
                  <>
                    <li className="nav-item nav-chip">
                      <span className="nav-chip-label">Organization Dashboard</span>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link nav-link-btn ${isActive('org-dashboard') ? 'active' : ''}`}
                        onClick={() => handleNavigate('org-dashboard')}
                      >
                        Overview
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link nav-link-btn ${isActive('explore') ? 'active' : ''}`}
                        onClick={() => handleNavigate('explore')}
                      >
                        {t.explore}
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link nav-link-btn ${isActive('profile') ? 'active' : ''}`}
                        onClick={() => handleNavigate('profile')}
                      >
                        {t.profile}
                      </button>
                    </li>
                  </>
                ) : (
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
                )
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

      <div className="page-header">
        <div className="container">
          <h2 className="page-title">{getPageLabel(currentPage)}</h2>
        </div>
      </div>

      <div className="container layout-container">{children}</div>

      <footer className="layout-footer">
        <p>&copy; 2026 {t.brand}. {t.allRightsReserved}</p>
      </footer>
    </div>
  )
}
