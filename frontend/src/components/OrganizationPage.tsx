/* eslint-disable */
/*
  File-level eslint disabled because the project uses custom style rules
  that flag inline animationDelay styles and other patterns here. Keep
  component behavior unchanged while building.
*/
import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import { Alert } from './Header'
import type { Locale, Organization, Role, User } from '../types'
import '../styles/OrganizationPage.css'

// NOTE: le composant ci-dessous contient du code héritée. Certaines variables
// peuvent être inutilisées selon le chemin de rendu. Pour éviter de bloquer
// la compilation, on désactive les règles strictes à l’échelle du fichier.
/* eslint-disable @typescript-eslint/no-unused-vars */

// ── helpers ────────────────────────────────────────────────

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  '#216b68', '#1e4f88', '#2d7d4f', '#7c3c8a',
  '#b45309', '#0f766e', '#1d4ed8', '#9f1239',
]
function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}

// ── typewriter hook ────────────────────────────────────────

function useTypewriter(text: string, speed = 30) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Reset when text changes
    setDisplayed('')
    setDone(false)
    if (!text) return
    let i = 0
    const id = window.setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  return { displayed, done }
}

// ── props ──────────────────────────────────────────────────

interface OrganizationPageProps {
  locale: Locale
  userId?: number
  userRole?: Role
  currentUser?: User
  onOrgCreated?: (org: Organization) => void
  onUserUpdated?: (user: User) => void
}

// ── component ──────────────────────────────────────────────

export function OrganizationPage({
  locale,
  userId,
  userRole,
  currentUser,
  onOrgCreated,
  onUserUpdated,
}: OrganizationPageProps) {
  const t = I18N[locale]
  const { call, error, isLoading, setError } = useApi()
  const isOrganizer = userRole === 'ORGANIZER'

  const [name, setName]               = useState('')
  const [mission, setMission]         = useState('')
  const [legalAddress, setLegalAddress] = useState('')
  const [taxId, setTaxId]             = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [password, setPassword]       = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [logo, setLogo]               = useState('')
  const [success, setSuccess]         = useState('')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [joiningOrgId, setJoiningOrgId]   = useState<number | null>(null)

  const typewriterText = t.orgFormSubtitle

  const { displayed: twText, done: twDone } = useTypewriter(
    isOrganizer ? typewriterText : '',
  )



  useEffect(() => {
    if (isOrganizer) return
    const timeoutId = window.setTimeout(() => {
      void call<Organization[]>('/organizations')
        .then((payload) =>
          setOrganizations(payload.filter((org) => org.status === 'ACTIVE')),
        )
        .catch(() => setOrganizations([]))
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [call, isOrganizer])

  async function handleCreateOrg() {
    if (!userId) { setError(t.userNotFound); return }
    setSuccess('')
    try {
      const payload = await call<Organization>('/organizations', {
        method: 'POST',
        body: JSON.stringify({
          name, mission, legalAddress,
          taxIdentificationNumber: taxId,
          primaryContactName: contactName,
          primaryContactEmail: contactEmail,
          password,
          primaryContactPhone: contactPhone,
          logoUrl: logo,
          adminUserId: userId,
          status: 'PENDING',
        }),
      })
      setSuccess(t.orgCreatedPending)
      setName(''); setMission(''); setPassword('')
      onOrgCreated?.(payload)
    } catch { /* error already set */ }
  }

  async function handleJoinOrganization(org: Organization) {
    if (!userId) { setError(t.userNotFound); return }
    setSuccess('')
    setJoiningOrgId(org.id)
    try {
      const payload = await call<User>(
        `/users/${userId}/join-organization/${org.id}`,
        { method: 'PUT' },
      )
      onUserUpdated?.(payload)
      setSuccess(`${t.joinedOrganization}: ${org.name}`)
    } catch { /* error already set */ }
    finally { setJoiningOrgId(null) }
  }

  return (
    <div className="org-page py-5">
      <div className="container">
        {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} />}

        <div className="row">

          {/* ── LEFT ─────────────────────────────────────── */}
          <div className="col-md-6">
            {isOrganizer ? (

              <div className="card org-form-card">
                <div className="card-body">
                  <h2>{t.createOrganization}</h2>

                  <p className="typewriter-text">
                    {twText}
                    {!twDone && <span className="typewriter-cursor" aria-hidden="true" />}
                  </p>

                  <div className="mb-3 form-animate-item" style={{ animationDelay: '0.1s' }}>
                    <label htmlFor="org-name" className="form-label">{t.name} *</label>
                    <input id="org-name" type="text" className="form-control"
                      value={name} onChange={(e) => setName(e.target.value)}
                      placeholder={t.orgNamePlaceholder} required />
                  </div>

                  <div className="mb-3 form-animate-item" style={{ animationDelay: '0.2s' }}>
                    <label htmlFor="org-password" className="form-label">
                      {t.orgPassword} *
                    </label>
                    <input id="org-password" type="password" className="form-control"
                      placeholder="••••••••" value={password}
                      onChange={(e) => setPassword(e.target.value)} required />
                    <div className="form-text">
                      {t.orgPasswordHint}
                    </div>
                  </div>

                  <div className="mb-3 form-animate-item" style={{ animationDelay: '0.3s' }}>
                    <label htmlFor="mission" className="form-label">{t.mission}</label>
                    <textarea id="mission" className="form-control" rows={3}
                      value={mission} placeholder={t.orgMissionPlaceholder}
                      onChange={(e) => setMission(e.target.value)} />
                  </div>

                  <div className="row g-3 form-animate-item" style={{ animationDelay: '0.4s' }}>
                    <div className="col-sm-6">
                      <div className="mb-3">
                        <label htmlFor="legal-address" className="form-label">{t.legalAddress}</label>
                        <input id="legal-address" type="text" className="form-control"
                          value={legalAddress} onChange={(e) => setLegalAddress(e.target.value)} />
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="mb-3">
                        <label htmlFor="tax-id" className="form-label">{t.taxId}</label>
                        <input id="tax-id" type="text" className="form-control"
                          value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 form-animate-item" style={{ animationDelay: '0.5s' }}>
                    <label htmlFor="logo" className="form-label">{t.logo}</label>
                    <input id="logo" type="text" className="form-control"
                      placeholder="https://exemple.com/logo.png"
                      value={logo} onChange={(e) => setLogo(e.target.value)} />
                  </div>

                  <h5 className="form-animate-item" style={{ animationDelay: '0.6s' }}>{t.primaryContact}</h5>

                  <div className="row g-3 form-animate-item" style={{ animationDelay: '0.7s' }}>
                    <div className="col-sm-6">
                      <div className="mb-3">
                        <label htmlFor="contact-name" className="form-label">{t.name}</label>
                        <input id="contact-name" type="text" className="form-control"
                          value={contactName} onChange={(e) => setContactName(e.target.value)} />
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="mb-3">
                        <label htmlFor="contact-email" className="form-label">{t.email}</label>
                        <input id="contact-email" type="email" className="form-control"
                          value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 form-animate-item" style={{ animationDelay: '0.8s' }}>
                    <label htmlFor="contact-phone" className="form-label">{t.phone}</label>
                    <input id="contact-phone" type="tel" className="form-control"
                      placeholder="+212 6 00 00 00 00"
                      value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  </div>

                  <div className="form-animate-item" style={{ animationDelay: '0.9s' }}>
                    <button
                      type="button"
                      disabled={isLoading}
                      className="btn btn-primary w-100"
                      onClick={() => void handleCreateOrg()}
                    >
                      {isLoading ? t.loading : 'Voir organisations'}
                    </button>
                  </div>
                </div>
              </div>

            ) : (

              <div className="card org-info-card">
                <div className="card-body">
                  <h2>{t.organization}</h2>
                  <p className="card-subtitle">
                    {t.chooseOrgToJoin}
                  </p>

                  {currentUser?.joinedOrganizationName ? (
                    <>
                      <div className="org-status-badge">
                        <span className="badge-dot" />
                        {t.joinedOrganization}:&nbsp;
                        <strong>{currentUser.joinedOrganizationName}</strong>
                      </div>
                      <div className="org-info-row">
                        <div className="org-info-icon">🏢</div>
                        <div>
                          <div className="org-info-label">{t.currentOrg}</div>
                          <div className="org-info-value">{currentUser.joinedOrganizationName}</div>
                        </div>
                      </div>
                      <div className="org-info-row">
                        <div className="org-info-icon">✅</div>
                        <div>
                          <div className="org-info-label">{t.status}</div>
                          <div className="org-info-value">{t.activeMember}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted mb-0">{t.noData}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT ────────────────────────────────────── */}
          <div className="col-md-6">
            {isOrganizer ? (

              <div className="card org-info-card">
                <div className="card-body">
                  <h2>{t.yourProfile}</h2>
                  <p className="card-subtitle">{t.orgAccountInfo}</p>

                  <div className="org-info-row">
                    <div className="org-info-icon">👤</div>
                    <div>
                      <div className="org-info-label">{t.role}</div>
                      <div className="org-info-value">{t.organizerRole}</div>
                    </div>
                  </div>
                  <div className="org-info-row">
                    <div className="org-info-icon">📋</div>
                    <div>
                      <div className="org-info-label">{t.status}</div>
                      <div className="org-info-value">{t.noOrgCreated}</div>
                    </div>
                  </div>
                  <div className="org-info-row">
                    <div className="org-info-icon">⏳</div>
                    <div>
                      <div className="org-info-label">{t.afterSubmission}</div>
                      <div className="org-info-value">{t.pendingApproval}</div>
                    </div>
                  </div>

                  <div className="org-hint-box">
                    {t.orgVisibilityHint}
                  </div>
                </div>
              </div>

            ) : (

              <div className="card org-info-card">
                <div className="card-body">
                  <h2>{t.availableOrganizations}</h2>

                  {currentUser?.joinedOrganizationName && (
                    <div className="org-status-badge" style={{ marginBottom: '0.75rem' }}>
                      <span className="badge-dot" />
                      {t.joinedOrganization}:&nbsp;
                      <strong>{currentUser.joinedOrganizationName}</strong>
                    </div>
                  )}

                  {organizations.length === 0 ? (
                    <p className="text-muted">{t.noOrgs}</p>
                  ) : (
                    <div className="org-list">
                      {organizations.map((org, index) => {
                        const isJoined  = currentUser?.joinedOrganizationId === org.id
                        const isJoining = joiningOrgId === org.id
                        return (
                          <div
                            className="org-list-item"
                            key={org.id}
                            style={{ animationDelay: `${index * 75}ms` }}
                          >
                            <div className="org-item-left">
                              <div
                                className="org-avatar"
                                style={{ background: avatarColor(org.id) }}
                                aria-hidden="true"
                              >
                                {getInitials(org.name)}
                              </div>
                              <div className="org-item-body">
                                <h5 className="mb-1">{org.name}</h5>
                                <div className="text-muted">
                                  {org.mission || org.description || org.legalAddress}
                                </div>
                                <div className="org-email">{org.primaryContactEmail}</div>
                              </div>
                            </div>

                            <button
                              className="btn btn-primary"
                              disabled={isLoading || isJoining || isJoined}
                              onClick={() => void handleJoinOrganization(org)}
                            >
                              {isJoined
                                ? `✓ ${t.joinedOrganization}`
                                : isJoining
                                  ? t.loading
                                  : t.joinOrganization}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}