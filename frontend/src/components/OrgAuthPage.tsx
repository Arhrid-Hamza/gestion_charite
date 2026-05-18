import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { Alert } from './Header'
import type { Locale, Organization, User } from '../types'
import '../styles/OrgAuthPage.css'  // ✅ correct CSS import

interface OrgAuthPageProps {
  locale: Locale
  onOrgLogin?: (org: Organization, user: User) => void
}

export function OrgAuthPage({ locale, onOrgLogin }: OrgAuthPageProps) {
  const { call, error, isLoading, setError } = useApi()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [success, setSuccess]   = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setSuccess('')
    try {
      const result = await call<{ organization: Organization; user: User }>(
        '/organizations/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
      )
      setSuccess(
        locale === 'fr'
          ? `Connecté en tant que ${result.organization.name}`
          : `تم الدخول بصفة ${result.organization.name}`,
      )
      onOrgLogin?.(result.organization, result.user)
    } catch { /* error already set */ }
  }

  return (
    <div className="org-auth-page">
      <div className="org-auth-container">
        <div className="org-auth-card">
          <div className="org-auth-header">
            <h1 className="org-auth-title">
              {locale === 'fr' ? 'Connexion Organisation' : 'دخول المنظمة'}
            </h1>
            <p className="org-auth-subtitle">
              {locale === 'fr'
                ? 'Accédez au tableau de bord de votre organisation.'
                : 'ادخل إلى لوحة تحكم منظمتك.'}
            </p>
          </div>

          {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
          {success && <Alert type="success" message={success} />}

          <form className="org-auth-form" onSubmit={(e) => void handleLogin(e)}>
            <div className="form-group">
              <label htmlFor="org-email" className="form-label">
                {locale === 'fr' ? 'Email de contact' : 'البريد الإلكتروني'}
              </label>
              <input
                id="org-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@organisation.org"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="org-pwd" className="form-label">
                {locale === 'fr' ? 'Mot de passe' : 'كلمة المرور'}
              </label>
              <input
                id="org-pwd"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-block"
            >
              {isLoading
                ? (locale === 'fr' ? 'Connexion…' : 'جارٍ التسجيل…')
                : (locale === 'fr' ? 'Se connecter' : 'دخول')}
            </button>
          </form>

          <div className="org-auth-footer">
            <p>
              {locale === 'fr'
                ? 'Votre organisation doit être approuvée par un administrateur.'
                : 'يجب أن تكون منظمتك معتمدة من قِبل المسؤول.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}