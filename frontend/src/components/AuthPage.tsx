import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import type { Locale, User } from '../types'
import { Alert } from './Header'
import '../styles/AuthPage.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

interface AuthPageProps {
  locale: Locale
  onAuthSuccess: (user: User) => void
}

export function AuthPage({ locale, onAuthSuccess }: AuthPageProps) {
  const t = I18N[locale]
  const { call, error, isLoading, setError } = useApi()

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [interests, setInterests] = useState('education,sante')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const googleSub = params.get('google_sub')
    const googleEmail = params.get('google_email')
    const googleName = params.get('google_name')
    const googleError = params.get('google_error')

    if (googleError) {
      setError(`Google login failed: ${googleError}`)
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
          role: 'DONOR',
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

              <button 
                type="submit" 
                disabled={isLoading} 
                className="btn btn-primary btn-block"
              >
                {isLoading ? 'Loading...' : t.register}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p>Charity Management Platform © 2024</p>
        </div>
      </div>
    </div>
  )
}
