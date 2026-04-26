import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import type { Locale, User, Organization } from '../types'
import { Alert } from './Header'
import '../styles/AuthPage.css'

function normalizeApiBaseUrl(rawValue: string | undefined) {
  const base = (rawValue ?? 'http://localhost:8080/api').trim().replace(/\/+$/, '')
  return /\/api$/i.test(base) ? base : `${base}/api`
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)

function mapGoogleErrorToMessage(errorCode: string) {
  switch (errorCode) {
    case 'access_denied':
      return 'Google login was cancelled.'
    case 'oauth_not_configured':
      return 'Google login is not configured on the backend yet.'
    case 'oauth_invalid_client':
      return 'Google client credentials are invalid.'
    case 'oauth_redirect_mismatch':
      return 'Google redirect URI mismatch. Check Google Cloud OAuth settings.'
    case 'oauth_invalid_grant':
      return 'Google authorization code expired or was already used.'
    case 'missing_code':
      return 'Google did not return an authorization code.'
    case 'missing_access_token':
      return 'Google token exchange failed (no access token).'
    case 'invalid_profile':
      return 'Google profile data is incomplete (missing email or subject).'
    default:
      return `Google login failed: ${errorCode}`
  }
}

interface AuthPageProps {
  locale: Locale
  onAuthSuccess: (user: User) => void
  onOrgAuthSuccess?: (user: User) => void
}

export function AuthPage({ locale, onAuthSuccess, onOrgAuthSuccess }: AuthPageProps) {
  const t = I18N[locale]
  const { call, error, isLoading, setError } = useApi()

  const [authType, setAuthType] = useState<'user' | 'organization'>('user')
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [interests, setInterests] = useState('education,sante')
  const [role, setRole] = useState<'DONOR' | 'ORGANIZER'>('DONOR')
  const [success, setSuccess] = useState('')
  
  // Organization auth state
  const [orgName, setOrgName] = useState('')
  const [legalAddress, setLegalAddress] = useState('')
  const [taxId, setTaxId] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [description, setDescription] = useState('')
  const [mission, setMission] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const googleSub = params.get('google_sub')
    const googleEmail = params.get('google_email')
    const googleName = params.get('google_name')
    const googleError = params.get('google_error')

    if (googleError) {
      setError(mapGoogleErrorToMessage(googleError))
      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }

    if (!googleSub || !googleEmail) {
      return
    }

    async function completeGoogleLogin() {
      setSuccess('')
      try {
        const payload = await call<{ userId: number; email: string }>(`/auth/google`, {
          method: 'POST',
          body: JSON.stringify({
            googleSubject: googleSub,
            email: googleEmail,
            fullName: googleName || 'Google User',
          }),
        })

        const users = await call<User[]>('/users')
        const found = users.find((u) => u.id === payload.userId || u.email === payload.email)

        if (!found) {
          throw new Error('Compte Google non resolu')
        }

        setSuccess('Connexion Google reussie!')
        onAuthSuccess(found)
      } catch {
        // Erreur deja definie par useApi
      } finally {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }

    void completeGoogleLogin()
  }, [call, onAuthSuccess, setError])

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccess('')

    try {
      const payload = await call<User>(`/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
          fullName: name,
          email,
          password,
          phone,
          address,
          preferredLanguage: locale,
          interests,
          role,
        }),
      })

      setSuccess('Inscription réussie!')
      onAuthSuccess(payload)
    } catch {
      // Erreur déjà définie par useApi
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccess('')

    try {
      await call<{ userId: number }>(`/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      const users = await call<User[]>('/users')
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

      if (!found) throw new Error('Utilisateur introuvable')

      setSuccess('Connexion réussie!')
      onAuthSuccess(found)
    } catch {
      // Erreur déjà définie
    }
  }

  function handleGoogleLogin(event: FormEvent<HTMLButtonElement>) {
    event.preventDefault()
    window.location.href = `${API_BASE_URL}/auth/google/start`
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} />}

        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <h1 className="auth-title">CharityHub</h1>
            <p className="auth-subtitle">{t.auth}</p>
          </div>

          {/* Auth Type Switcher */}
          <div className="auth-type-switcher">
            <button 
              type="button" 
              className={`switch-btn ${authType === 'user' ? 'active' : ''}`}
              onClick={() => setAuthType('user')}
            >
              👤 User
            </button>
            <span className="switch-divider">|</span>
            <button 
              type="button" 
              className={`switch-btn ${authType === 'organization' ? 'active' : ''}`}
              onClick={() => setAuthType('organization')}
            >
              🏢 Organization
            </button>
          </div>

          {/* 
          {/* Tab Navigation */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              {t.login}
            </button>
            <button
              type="button"
              className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              {t.register}
            </button>
          </div>

          {/* User Authentication Forms */}
          {authType === 'user' && (
            <>
              {/* Login Form */}
              {activeTab === 'login' && (
                <form onSubmit={(e) => void handleLogin(e)} className="auth-form">
              <div className="form-group">
                <label htmlFor="login-email" className="form-label">{t.email}</label>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password" className="form-label">{t.password}</label>
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className="btn btn-primary btn-block"
              >
                {isLoading ? 'Loading...' : t.login}
              </button>

              <div className="auth-divider">{t.or}</div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="btn btn-social btn-block"
                aria-label="Continue with Google"
              >
                <span className="google-logo-wrap" aria-hidden="true">
                  <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </span>
                <span className="google-btn-text">Continue with Google</span>
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={(e) => void handleRegister(e)} className="auth-form">
              <div className="form-group">
                <label htmlFor="reg-name" className="form-label">{t.name}</label>
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email" className="form-label">{t.email}</label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password" className="form-label">{t.password}</label>
                <input
                  id="reg-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-phone" className="form-label">{t.phone}</label>
                <input 
                  id="reg-phone" 
                  type="tel" 
                  className="form-input" 
                  placeholder="+1 (555) 000-0000"
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-address" className="form-label">{t.address}</label>
                <input 
                  id="reg-address" 
                  type="text" 
                  className="form-input" 
                  placeholder="123 Main St, City"
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-interests" className="form-label">{t.interests}</label>
                <input 
                  id="reg-interests" 
                  type="text" 
                  className="form-input" 
                  placeholder="education, health, environment..."
                  value={interests} 
                  onChange={(e) => setInterests(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-role" className="form-label">Account Type</label>
                <select
                  id="reg-role"
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'DONOR' | 'ORGANIZER')}
                  required
                >
                  <option value="DONOR">Donor - Support Charities</option>
                  <option value="ORGANIZER">Organizer - Manage Charity Actions</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className="btn btn-primary btn-block"
              >
                {isLoading ? 'Loading...' : t.register}
              </button>
            </form>
              )}
            </>
          )}

          {/* Organization Authentication Forms */}
          {authType === 'organization' && (
            <>
              {/* Organization Login Form */}
              {activeTab === 'login' && (
                <form onSubmit={(e) => void handleOrgLogin(e)} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="org-login-email" className="form-label">Contact Email</label>
                    <input
                      id="org-login-email"
                      type="email"
                      className="form-input"
                      placeholder="contact@organization.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-login-password" className="form-label">Password</label>
                    <input
                      id="org-login-password"
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="btn btn-primary btn-block"
                  >
                    {isLoading ? 'Loading...' : 'Login'}
                  </button>
                </form>
              )}

              {/* Organization Register Form */}
              {activeTab === 'register' && (
                <form onSubmit={(e) => void handleOrgRegister(e)} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="org-name" className="form-label">Organization Name</label>
                    <input
                      id="org-name"
                      type="text"
                      className="form-input"
                      placeholder="Your Organization Name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-password" className="form-label">Organization Password</label>
                    <input
                      id="org-password"
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <small className="form-help-text">This password will be used to sign in as the organization.</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-tax-id" className="form-label">Tax ID (SIRET/NIF)</label>
                    <input
                      id="org-tax-id"
                      type="text"
                      className="form-input"
                      placeholder="123456789"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-legal-address" className="form-label">Legal Address</label>
                    <input
                      id="org-legal-address"
                      type="text"
                      className="form-input"
                      placeholder="123 Main St, City, Country"
                      value={legalAddress}
                      onChange={(e) => setLegalAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-contact-name" className="form-label">Contact Person Name</label>
                    <input
                      id="org-contact-name"
                      type="text"
                      className="form-input"
                      placeholder="Full Name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-contact-email" className="form-label">Contact Email</label>
                    <input
                      id="org-contact-email"
                      type="email"
                      className="form-input"
                      placeholder="contact@organization.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-contact-phone" className="form-label">Contact Phone</label>
                    <input
                      id="org-contact-phone"
                      type="tel"
                      className="form-input"
                      placeholder="+1 (555) 000-0000"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-description" className="form-label">Description</label>
                    <textarea
                      id="org-description"
                      className="form-input"
                      placeholder="Brief description of your organization..."
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-mission" className="form-label">Mission Statement</label>
                    <textarea
                      id="org-mission"
                      className="form-input"
                      placeholder="Your organization's mission..."
                      rows={2}
                      value={mission}
                      onChange={(e) => setMission(e.target.value)}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="btn btn-primary btn-block"
                  >
                    {isLoading ? 'Loading...' : 'Register Organization'}
                  </button>

                  <p className="registration-note">
                    Your organization will need to be approved by an administrator.
                  </p>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p>Charity Management Platform © 2026</p>
        </div>
      </div>
    </div>
  )

  // Handler for organization login
  async function handleOrgLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccess('')

    if (!email?.trim() || !password?.trim()) {
      setError('Organization email and password are required')
      return
    }

    try {
      const org = await call<Organization>('/organizations/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      setSuccess('Organization login successful!')
      // For now, we'll just convert org to a user object
      const orgUser: User = {
        id: org.adminUserId ?? org.id,
        fullName: org.name,
        email: org.primaryContactEmail,
        role: 'ORGANIZER',
        preferredLanguage: locale,
        phone: org.primaryContactPhone,
      }
      // Call org-specific callback if provided
      if (onOrgAuthSuccess) {
        onOrgAuthSuccess(orgUser)
      } else {
        onAuthSuccess(orgUser)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  // Handler for organization registration
  async function handleOrgRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccess('')

    // Validate required fields
    if (!orgName?.trim()) {
      setError('Organization name is required')
      return
    }
    if (!taxId?.trim()) {
      setError('Tax ID (SIRET/NIF) is required')
      return
    }
    if (!legalAddress?.trim()) {
      setError('Legal address is required')
      return
    }
    if (!contactName?.trim()) {
      setError('Contact person name is required')
      return
    }
    if (!contactEmail?.trim()) {
      setError('Contact email is required')
      return
    }
    if (!password?.trim()) {
      setError('Organization password is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      const payload = await call<Organization>('/organizations', {
        method: 'POST',
        body: JSON.stringify({
          name: orgName,
          legalAddress,
          taxIdentificationNumber: taxId,
          primaryContactName: contactName,
          primaryContactEmail: contactEmail,
          primaryContactPhone: contactPhone,
          password,
          description,
          mission,
          status: 'PENDING',
        }),
      })

      setSuccess('Organization registered successfully! Pending approval.')
      const orgUser: User = {
        id: payload.id,
        fullName: payload.name,
        email: payload.primaryContactEmail,
        role: 'ORGANIZER',
        preferredLanguage: locale,
        phone: payload.primaryContactPhone,
      }
      // Call org-specific callback if provided
      if (onOrgAuthSuccess) {
        onOrgAuthSuccess(orgUser)
      } else {
        onAuthSuccess(orgUser)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }
}
