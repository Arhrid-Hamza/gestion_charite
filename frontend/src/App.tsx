import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { I18N } from './types/i18n'
import type { Locale, User, CharityAction, Organization, Donation, Participation } from './types'
import { Layout } from './components/Layout'
import { Header, Alert } from './components/Header'
import { AuthPage } from './components/AuthPage'
import { ExplorePage } from './components/ExplorePage'
import { DonatePage } from './components/DonatePage'
import { ProfilePage } from './components/ProfilePage'
import ErrorBoundary from './components/ErrorBoundary'
import { ParticipatePage } from './components/ParticipatePage'
import { OrganizationPage } from './components/OrganizationPage'
import { OrganizationDashboard } from './components/OrganizationDashboard'
import { OrganizationActionDetailsPage } from './components/OrganizationActionDetailsPage'
import { AdminPage } from './components/AdminPage'
import { useApi } from './hooks/useApi'
import './App.css'

type PageType = 'auth' | 'dashboard' | 'explore' | 'donate' | 'profile' | 'participate' | 'organization' | 'admin' | 'org-dashboard' | 'org-action-details'

interface DashboardState {
  user: User | null
  locale: Locale
  currentPage: PageType
  selectedAction: CharityAction | null
  selectedOrg: Organization | null
  dashboardRefresh: number
  donationAlert?: string | null
  profileRefresh: number
}

function DashboardContent({ user, t, onNavigate }: { user: User, t: Record<string, string>, onNavigate: (page: PageType) => void }) {
  const { call } = useApi()
  const [donations, setDonations] = useState<Donation[]>([])
  const [participations, setParticipations] = useState<Participation[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])

  useEffect(() => {
    if (!user?.id) return

    const load = async () => {
      try {
        // Load donations, participations and organizations. For missing endpoints (404)
        // we silently fall back to an empty list to avoid noisy console errors.
        let dona: Donation[] = []
        try {
          dona = await call<Donation[]>(`/donations/user/${user.id}`)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          if (!/404|Not Found/i.test(msg)) console.error('Failed to load donations:', e)
          dona = []
        }

        let partic: Participation[] = []
        try {
          partic = await call<Participation[]>(`/participations/user/${user.id}`)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          if (!/404|Not Found/i.test(msg)) console.error('Failed to load participations:', e)
          partic = []
        }

        let orgs: Organization[] = []
        try {
          const allOrgs = await call<Organization[]>('/organizations')
          orgs = (allOrgs || []).filter((org) =>
            org.adminUserId === user.id ||
            org.primaryContactEmail?.toLowerCase() === user.email?.toLowerCase()
          )
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          if (!/404|Not Found/i.test(msg)) console.error('Failed to load organizations:', e)
          orgs = []
        }

        setDonations(dona || [])
        setParticipations(partic || [])
        setOrganizations(orgs || [])
      } catch (e) {
        console.error('Failed to load dashboard data:', e)
        setDonations([])
        setParticipations([])
        setOrganizations([])
      }
    }
    void load()
  }, [user?.id, call])

  const totalDonated = donations.reduce((sum, d) => sum + (typeof d.amount === 'number' ? d.amount : 0), 0)

  return (
    <div className="dashboard-hero">
            <h1>{t.welcome}, {user?.fullName || ''}!</h1>
      <p>{t.dashboardDesc}</p>

      <div className="quick-stats">
        <div className="stat-box">
          <span className="stat-icon">🤝</span>
          <div>
            <h4>{t.organization}</h4>
            <p>{organizations.length} {t.active}</p>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon">💰</span>
          <div>
            <h4>{t.totalDonated}</h4>
            <p>${totalDonated.toFixed(2)}</p>
          </div>
        </div>
        <div className="stat-box">
          <span className="stat-icon">🎉</span>
          <div>
            <h4>{t.participate}</h4>
            <p>{participations.length} {t.events}</p>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn-action" onClick={() => onNavigate('explore')}>
          🔍 {t.explore}
        </button>
        <button className="btn-action" onClick={() => onNavigate('donate')}>
          💳 {t.donate}
        </button>
        <button className="btn-action" onClick={() => onNavigate('organization')}>
          🏢 Voir organisations
        </button>
      </div>
    </div>
  )
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
  if (user.role === 'ORGANIZER') {
    return 'org-dashboard'
  }
  return 'dashboard'
}

export function App() {
  const savedUser = loadSavedUser()

  const [state, setState] = useState<DashboardState>({
    user: savedUser,
    locale: (localStorage.getItem('locale') as Locale) || 'fr',
    currentPage: defaultPageForUser(savedUser),
    selectedAction: null,
    selectedOrg: null,
    dashboardRefresh: 0,
    donationAlert: null,
    profileRefresh: 0,
  })

  const { call, setError } = useApi()

  // Global payment finalizer: handles provider redirects even when DonatePage isn't mounted.
  // It finalizes PayPal/Stripe payments and shows a top-level success alert.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentState = params.get('payment')
    if (!paymentState) return

    async function finalizePayment() {
      try {
        const PENDING_DONATION_KEY = 'pendingDonationPayment'
        if (paymentState === 'paypal-success') {
          const orderId = params.get('token')
          const rawPendingDonation = localStorage.getItem(PENDING_DONATION_KEY)
          if (!orderId || !rawPendingDonation) { setError('Paiement PayPal invalide ou expiré'); return }
          const pendingDonation = JSON.parse(rawPendingDonation)
          await call(`/payments/paypal/capture/${orderId}`, { method: 'POST', body: JSON.stringify(pendingDonation) })
          localStorage.removeItem(PENDING_DONATION_KEY)
          setState((prev) => ({ ...prev, donationAlert: 'Votre don a été enregistré', dashboardRefresh: prev.dashboardRefresh + 1, profileRefresh: (prev.profileRefresh || 0) + 1 }))
          handleNavigate('dashboard')
          return
        }

        if (paymentState === 'stripe-success') {
          const sessionId = params.get('session_id')
          if (!sessionId) { setError('Session Stripe manquante'); return }
          await call(`/payments/stripe/confirm-session?sessionId=${encodeURIComponent(sessionId)}`, { method: 'POST' })
          setState((prev) => ({ ...prev, donationAlert: 'Votre don a été enregistré', dashboardRefresh: prev.dashboardRefresh + 1, profileRefresh: (prev.profileRefresh || 0) + 1 }))
          handleNavigate('dashboard')
          return
        }

        if (paymentState === 'paypal-cancel' || paymentState === 'stripe-cancel') {
          setError('Paiement annulé')
        }
      } catch {
        // errors handled by useApi
      } finally {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }

    void finalizePayment()
  }, [])

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

  function handleNavigate(page: PageType, action?: CharityAction) {
    setState((prev) => {
      if (!prev.user && page !== 'auth') {
        return { ...prev, currentPage: 'auth', selectedAction: null, selectedOrg: null };
      }

      let resolvedPage = page
      if (prev.user?.role === 'ORGANIZER' && page === 'dashboard') {
        resolvedPage = 'org-dashboard'
      }

      return {
        ...prev,
        currentPage: resolvedPage,
        selectedAction: action ?? null,
        selectedOrg: null,
      }
    })
  }

  function getBackendBaseUrl(): string {
    const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)
    if (!apiUrl) return 'http://localhost:8080'
    return apiUrl.trim().replace(/\/+$/, '').replace(/\/api$/i, '')
  }

  function handleAuthSuccess(user: User) {
    if (user.role === 'SUPER_ADMIN') {
      localStorage.setItem('user', JSON.stringify(user))
      window.location.href = `${getBackendBaseUrl()}/admin`
      return
    }

    setState((prev) => ({
      ...prev,
      user,
      currentPage: defaultPageForUser(user),
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
    if (user.role === 'SUPER_ADMIN') {
      localStorage.setItem('user', JSON.stringify(user))
      setState((prev) => ({
        ...prev,
        user,
        currentPage: 'admin',
      }))
      window.location.href = `${getBackendBaseUrl()}/admin`
      return
    }

    setState((prev) => ({
      ...prev,
      user,
      currentPage: prev.currentPage,
    }))
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
        <Analytics />
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
        {state.donationAlert && (
          <div style={{ padding: '0 1rem' }}>
            <Alert type="success" message={state.donationAlert} onClose={() => setState((s) => ({ ...s, donationAlert: null }))} />
          </div>
        )}
        {state.currentPage === 'dashboard' && state.user && (
          <DashboardContent key={`dashboard-${state.dashboardRefresh}`} user={state.user} t={t} onNavigate={handleNavigate} />
        )}

        {/* Old dashboard UI replaced with component */}
        {/* legacy dashboard removed */}

        {state.currentPage === 'explore' && (
          <ExplorePage locale={state.locale} userId={state.user.id} onActionSelect={handleActionSelect} />
        )}

        {state.currentPage === 'donate' && (
          <DonatePage
            locale={state.locale}
            userId={state.user.id}
            selectedAction={state.selectedAction || undefined}
            onSuccess={() => {
              // Force dashboard and profile refresh so counts and lists update immediately when a donation is recorded.
              setState((prev) => ({ ...prev, dashboardRefresh: (prev.dashboardRefresh || 0) + 1, profileRefresh: (prev.profileRefresh || 0) + 1 }))
            }}
            onBack={() => {
              // Force dashboard and profile refresh and navigate home
              setState((prev) => ({ ...prev, dashboardRefresh: (prev.dashboardRefresh || 0) + 1, profileRefresh: (prev.profileRefresh || 0) + 1 }))
              handleNavigate('dashboard')
            }}
          />
        )}

        {state.currentPage === 'profile' && (
          <ErrorBoundary>
            <ProfilePage
              locale={state.locale}
              user={state.user}
              onUpdate={handleProfileUpdate}
            />
          </ErrorBoundary>
        )}

        {state.currentPage === 'participate' && (
          <ParticipatePage locale={state.locale} userId={state.user.id} />
        )}

        {state.currentPage === 'org-dashboard' && state.user.role === 'ORGANIZER' && (
          <OrganizationDashboard 
            locale={state.locale} 
            user={state.user} 
            onNavigate={handleNavigate}
            selectedAction={state.selectedAction || undefined}
          />
        )}

        {state.currentPage === 'org-action-details' && state.user.role === 'ORGANIZER' && state.selectedAction && (
          <OrganizationActionDetailsPage
            locale={state.locale}
            action={state.selectedAction}
            onBack={() => handleNavigate('org-dashboard')}
            onEdit={(action) => handleNavigate('org-dashboard', action)}
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
      <Analytics />
    </div>
  )
}

export default App
