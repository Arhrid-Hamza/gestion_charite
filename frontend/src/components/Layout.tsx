/* eslint-disable react-hooks/static-components */
import { useState, useRef, useEffect } from 'react'
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

type PageType =
  | 'auth'
  | 'dashboard'
  | 'explore'
  | 'donate'
  | 'profile'
  | 'participate'
  | 'organization'
  | 'admin'
  | 'org-dashboard'

/** Nav icon mapping per page */
const NAV_ICONS: Record<string, string> = {
  explore:      'ti-compass',
  donate:       'ti-heart',
  participate:  'ti-users',
  organization: 'ti-building',
  profile:      'ti-user-circle',
  admin:        'ti-shield',
  'org-dashboard': 'ti-layout-dashboard',
}

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
  const navbarRef = useRef<HTMLDivElement>(null)
  const isOrganizerSession = user?.role === 'ORGANIZER'

  function isActive(page: PageType) {
    return currentPage === page
  }

  function handleNavigate(page: PageType) {
    // Close overlay immediately, so clicks on the navbar never get blocked.
    setMenuOpen(false)
    onNavigate(page)
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (navbarRef.current && !navbarRef.current.contains(target) && menuOpen) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [menuOpen])

  function NavBtn({
    page,
    label,
    icon,
  }: {
    page: PageType
    label: string
    icon: string
  }) {
    return (
      <li className="nav-item">
        <button
          className={`nav-link nav-link-btn ${isActive(page) ? 'active' : ''}`}
          onClick={() => handleNavigate(page)}
        >
          <i className={`ti ${icon}`} aria-hidden="true" />
          {label}
        </button>
      </li>
    )
  }

  const brandParts = t.brand.split(' ')
  const brandFirst = brandParts[0]
  const brandRest  = brandParts.slice(1).join(' ')

  return (
    <div className="layout">
      {/* ── Navbar ───────────────────────────── */}
      <nav className="navbar-custom" ref={navbarRef}>
        <div className="container">
          {/* Brand */}
          <button
            className="brand-button"
            onClick={() =>
              handleNavigate(isOrganizerSession ? 'org-dashboard' : 'dashboard')
            }
            aria-label="Accueil"
          >
            <span className="brand-logo-wrap">
              🎗️
            </span>
            <span className="brand-name">
              {brandFirst} <span>{brandRest}</span>
            </span>
          </button>

          {/* Hamburger */}
          <button
            className="navbar-toggler"
            type="button"
            aria-controls="navbarNav"
            aria-expanded={menuOpen}
            aria-label="Ouvrir le menu"
            onClick={() => setMenuOpen((p) => !p)}
          >
            <span className="navbar-toggler-icon">
              <span />
              <span />
              <span />
            </span>
          </button>

          {/* Links */}
          <div
            className={`navbar-collapse ${menuOpen ? 'show' : ''}`}
            id="navbarNav"
          >
            <ul className="navbar-nav ms-auto nav-links">
              {user ? (
                isOrganizerSession ? (
                  <>
                    <li className="nav-item nav-chip">
                      <span className="nav-chip-label">Organisation</span>
                    </li>
                    <NavBtn page="org-dashboard" label="Aperçu"    icon={NAV_ICONS['org-dashboard']} />
                    <NavBtn page="explore"       label={t.explore} icon={NAV_ICONS.explore} />
                    <NavBtn page="profile"       label={t.profile} icon={NAV_ICONS.profile} />
                  </>
                ) : (
                  <>
                    <NavBtn page="explore"      label={t.explore}      icon={NAV_ICONS.explore} />
                    <NavBtn page="donate"        label={t.donate}       icon={NAV_ICONS.donate} />
                    <NavBtn page="participate"   label={t.participate}  icon={NAV_ICONS.participate} />
                    <NavBtn page="organization"  label={t.organization} icon={NAV_ICONS.organization} />
                    {user.role === 'SUPER_ADMIN' && (
                      <NavBtn page="admin"  label={t.admin}   icon={NAV_ICONS.admin} />
                    )}
                    <NavBtn page="profile" label={t.profile} icon={NAV_ICONS.profile} />
                  </>
                )
              ) : null}

              <li className="nav-divider" aria-hidden="true" />

              <li className="nav-item lang-selector">
                <select
                  value={locale}
                  onChange={(e) => onLocaleChange(e.target.value as Locale)}
                  aria-label="Langue"
                >
                  <option value="fr">FR</option>
                  <option value="ar">AR</option>
                </select>
              </li>

              {user && (
                <li className="nav-item">
                  <button
                    onClick={onLogout}
                    className="nav-link nav-link-btn logout-link"
                  >
                    <i className="ti ti-logout" aria-hidden="true" />
                    {t.logout}
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* ── Page content ─────────────────────── */}
      <div className="container layout-container">{children}</div>

      {/* ── Mobile menu backdrop ─────────────── */}
      {menuOpen && (
        <div
          className="navbar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Footer ───────────────────────────── */}
      <footer className="layout-footer">
        <div className="container">
          <div className="footer-brand-row">
            <span className="logo-emoji">🎗️</span>
            <span className="footer-brand">
              {brandFirst} <span>{brandRest}</span>
            </span>
          </div>
          <p className="footer-copy">© 2026 {t.brand}. {t.allRightsReserved}</p>
        </div>
      </footer>
    </div>
  )
}