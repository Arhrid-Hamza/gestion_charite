import type { FormEvent } from 'react'
import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import type { Locale, Organization } from '../types'
import { Alert } from './Header'
import '../styles/OrgAuthPage.css'

interface OrgAuthPageProps {
  locale: Locale
  onAuthSuccess: (org: Organization) => void
  onSwitchToUserAuth: () => void
}

export function OrgAuthPage({ locale: _locale, onAuthSuccess, onSwitchToUserAuth }: OrgAuthPageProps) {
  const { call, error, isLoading, setError } = useApi()

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [legalAddress, setLegalAddress] = useState('')
  const [taxId, setTaxId] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [description, setDescription] = useState('')
  const [mission, setMission] = useState('')
  const [success, setSuccess] = useState('')

  async function handleOrgLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccess('')

    try {
      const org = await call<Organization>('/organizations/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      })

      setSuccess('Organization login successful!')
      onAuthSuccess(org)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  async function handleOrgRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccess('')

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
      onAuthSuccess(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <div className="org-auth-page">
      <div className="org-auth-container">
        <div className="org-auth-card">
          {/* Header */}
          <div className="org-auth-header">
            <h1 className="org-auth-title">🏢 Organization Portal</h1>
            <p className="org-auth-subtitle">Manage your charity organization</p>
          </div>

          {/* User Auth Switch */}
          <div className="auth-type-switcher">
            <button 
              type="button" 
              className="switch-btn user-switch"
              onClick={onSwitchToUserAuth}
              title="Switch to User Authentication"
            >
              👤 User Login
            </button>
            <span className="switch-divider">|</span>
            <button 
              type="button" 
              className="switch-btn org-switch active"
              title="Organization Authentication"
            >
              🏢 Organization
            </button>
          </div>

          {error && <Alert type="error" message={error} onClose={() => setError('')} />}
          {success && <Alert type="success" message={success} />}

          {/* Tab Navigation */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={(e) => void handleOrgLogin(e)} className="org-auth-form">
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

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={(e) => void handleOrgRegister(e)} className="org-auth-form">
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
                <label htmlFor="org-password" className="form-label">Password</label>
                <input
                  id="org-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  className="form-input form-textarea"
                  placeholder="Brief description of your organization..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="org-mission" className="form-label">Mission Statement</label>
                <textarea
                  id="org-mission"
                  className="form-input form-textarea"
                  placeholder="Your organization's mission..."
                  rows={3}
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
                Your organization will need to be approved by an administrator before you can access the dashboard.
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="org-auth-footer">
          <p>Charity Management Platform © 2026</p>
        </div>
      </div>
    </div>
  )
}
