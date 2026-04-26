import { useState, useEffect } from 'react'
import { I18N } from './types/i18n'
import type { Locale, User, CharityAction, Organization } from './types'
import { Layout } from './components/Layout'
import { Header } from './components/Header'
import { AuthPage } from './components/AuthPage'
import { ExplorePage } from './components/ExplorePage'
import { DonatePage } from './components/DonatePage'
import { ProfilePage } from './components/ProfilePage'
import { ParticipatePage } from './components/ParticipatePage'
import { OrganizationPage } from './components/OrganizationPage'
import { OrganizationDashboard } from './components/OrganizationDashboard'
import { AdminPage } from './components/AdminPage'
import './App.css'

type PageType = 'auth' | 'dashboard' | 'explore' | 'donate' | 'profile' | 'participate' | 'organization' | 'admin' | 'org-dashboard'

interface DashboardState {
  user: User | null
  locale: Locale
  currentPage: PageType
  selectedAction: CharityAction | null
  selectedOrg: Organization | null
}

function loadSavedUser(): User | null {
  const raw = localStorage.getItem('user')
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as User
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

function defaultPageForUser(user: User | null): PageType {
  if (!user) {
    return 'auth'
  }
  return user.role === 'ORGANIZER' ? 'org-dashboard' : 'dashboard'
}

export function App() {
  const savedUser = loadSavedUser()

  const [state, setState] = useState<DashboardState>({
    user: savedUser,
    locale: (localStorage.getItem('locale') as Locale) || 'fr',
    currentPage: defaultPageForUser(savedUser),
    selectedAction: null,
    selectedOrg: null,
  })

  useEffect(() => {
    localStorage.setItem('locale', state.locale)
  }, [state.locale])

  useEffect(() => {
    if (state.user) {
      localStorage.setItem('user', JSON.stringify(state.user))
      return
    }

    localStorage.removeItem('user')
  }, [state.user])

  const t = I18N[state.locale]

  function handleLocaleChange(locale: Locale) {
    setState((prev) => ({ ...prev, locale }))
  }

  function handleNavigate(page: PageType) {
    setState((prev) => {
      if (!prev.user && page !== 'auth') {
        return prev
      }

      let resolvedPage = page
      if (prev.user?.role === 'ORGANIZER' && page === 'dashboard') {
        resolvedPage = 'org-dashboard'
      }

      return { ...prev, currentPage: resolvedPage, selectedAction: null }
    })
  }

  function handleAuthSuccess(user: User) {
    setState((prev) => ({
      ...prev,
      user,
      currentPage: 'dashboard',
    }))
  }

  function handleOrgAuthSuccess(user: User) {
    setState((prev) => ({
      ...prev,
      user,
      currentPage: 'org-dashboard',
    }))
  }

  function handleLogout() {
    setState((prev) => ({
      ...prev,
      user: null,
      currentPage: 'auth',
    }))
  }

  function handleProfileUpdate(user: User) {
    setState((prev) => ({ ...prev, user }))
  }

  function handleActionSelect(action: CharityAction) {
    setState((prev) => ({
      ...prev,
      selectedAction: action,
      currentPage: 'donate',
    }))
  }

  function handleOrgCreated(org: Organization) {
    setState((prev) => ({
      ...prev,
      selectedOrg: org,
    }))
  }

  // Auth Page
  if (!state.user) {
    return (
      <div className="app">
        <Header
          locale={state.locale}
          onLocaleChange={handleLocaleChange}
        />
        <AuthPage 
          locale={state.locale} 
          onAuthSuccess={handleAuthSuccess}
          onOrgAuthSuccess={handleOrgAuthSuccess}
        />
      </div>
    )
  }

  // Main Dashboard with Navigation
  return (
    <div className="app">
      <Layout
        locale={state.locale}
        user={state.user}
        onLocaleChange={handleLocaleChange}
        onNavigate={handleNavigate}
        currentPage={state.currentPage}
        onLogout={handleLogout}
      >
        {state.currentPage === 'dashboard' && (
          <div className="dashboard-hero">
            <h1>{t.welcome}, {state.user.fullName}!</h1>
            <p>{t.dashboardDesc}</p>

            <div className="quick-stats">
              <div className="stat-box">
                <span className="stat-icon">🤝</span>
                <div>
                  <h4>{t.organization}</h4>
                  <p>0 {t.active}</p>
                </div>
              </div>
              <div className="stat-box">
                <span className="stat-icon">💰</span>
                <div>
                  <h4>{t.totalDonated}</h4>
                  <p>$0.00</p>
                </div>
              </div>
              <div className="stat-box">
                <span className="stat-icon">🎉</span>
                <div>
                  <h4>{t.participate}</h4>
                  <p>0 {t.events}</p>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn-action" onClick={() => handleNavigate('explore')}>
                🔍 {t.explore}
              </button>
              <button className="btn-action" onClick={() => handleNavigate('donate')}>
                💳 {t.donate}
              </button>
              <button className="btn-action" onClick={() => handleNavigate('organization')}>
                🏢 {t.createOrganization}
              </button>
            </div>
          </div>
        )}

        {state.currentPage === 'explore' && (
          <ExplorePage locale={state.locale} userId={state.user.id} onActionSelect={handleActionSelect} />
        )}

        {state.currentPage === 'donate' && (
          <DonatePage
            locale={state.locale}
            userId={state.user.id}
            selectedAction={state.selectedAction || undefined}
          />
        )}

        {state.currentPage === 'profile' && (
          <ProfilePage
            locale={state.locale}
            user={state.user}
            onUpdate={handleProfileUpdate}
          />
        )}

        {state.currentPage === 'participate' && (
          <ParticipatePage locale={state.locale} userId={state.user.id} />
        )}

        {state.currentPage === 'org-dashboard' && state.user.role === 'ORGANIZER' && (
          <OrganizationDashboard 
            locale={state.locale} 
            user={state.user} 
            onNavigate={handleNavigate}
          />
        )}

        {state.currentPage === 'organization' && (
          <OrganizationPage
            locale={state.locale}
            userId={state.user.id}
            userRole={state.user.role}
            currentUser={state.user}
            onOrgCreated={handleOrgCreated}
            onUserUpdated={handleProfileUpdate}
          />
        )}

        {state.currentPage === 'admin' && state.user.role === 'SUPER_ADMIN' && (
          <AdminPage locale={state.locale} />
        )}
      </Layout>
    </div>
  )
}

export default App
