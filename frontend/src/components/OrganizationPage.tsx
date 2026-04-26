import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import { Alert } from './Header'
import type { Locale, Organization, Role, User } from '../types'
import '../styles/OrganizationPage.css'

interface OrganizationPageProps {
  locale: Locale
  userId?: number
  userRole?: Role
  currentUser?: User
  onOrgCreated?: (org: Organization) => void
  onUserUpdated?: (user: User) => void
}

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

  const [name, setName] = useState('')
  const [mission, setMission] = useState('')
  const [legalAddress, setLegalAddress] = useState('')
  const [taxId, setTaxId] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [password, setPassword] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [logo, setLogo] = useState('')
  const [success, setSuccess] = useState('')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [joiningOrgId, setJoiningOrgId] = useState<number | null>(null)

  useEffect(() => {
    if (isOrganizer) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void call<Organization[]>('/organizations')
        .then((payload) => {
          setOrganizations(payload.filter((org) => org.status === 'ACTIVE'))
        })
        .catch(() => {
          setOrganizations([])
        })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [call, isOrganizer])

  async function handleCreateOrg() {
    if (!userId) {
      setError('Utilisateur non identifié')
      return
    }

    setSuccess('')

    try {
      const payload = await call<Organization>('/organizations', {
        method: 'POST',
        body: JSON.stringify({
          name,
          mission,
          legalAddress,
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

      setSuccess('Organisation créée et en attente d\'approbation')
      setName('')
      setMission('')
      setPassword('')
      onOrgCreated?.(payload)
    } catch {
      // Erreur déjà définie
    }
  }

  async function handleJoinOrganization(org: Organization) {
    if (!userId) {
      setError('Utilisateur non identifié')
      return
    }

    setSuccess('')
    setJoiningOrgId(org.id)

    try {
      const payload = await call<User>(`/users/${userId}/join-organization/${org.id}`, {
        method: 'PUT',
      })
      onUserUpdated?.(payload)
      setSuccess(`${t.joinedOrganization}: ${org.name}`)
    } catch {
      // Erreur déjà définie
    } finally {
      setJoiningOrgId(null)
    }
  }

  return (
    <div className="org-page py-5">
      <div className="container">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} />}

        <div className="row">
          <div className="col-md-6">
            {isOrganizer ? (
              <div className="card org-form-card">
                <div className="card-body">
                  <h2>{t.createOrganization}</h2>

                  <div className="mb-3">
                    <label htmlFor="org-name" className="form-label">{t.name}</label>
                    <input 
                      id="org-name"
                      type="text" 
                      className="form-control" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="org-password" className="form-label">Mot de passe de l'organisation</label>
                    <input
                      id="org-password"
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <small className="text-muted">Ce mot de passe sera utilisé pour se connecter en tant qu'organisation.</small>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="mission" className="form-label">{t.mission}</label>
                    <textarea
                      id="mission"
                      className="form-control"
                      rows={3}
                      value={mission}
                      onChange={(e) => setMission(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="legal-address" className="form-label">{t.legalAddress}</label>
                    <input
                      id="legal-address"
                      type="text"
                      className="form-control"
                      value={legalAddress}
                      onChange={(e) => setLegalAddress(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="tax-id" className="form-label">{t.taxId}</label>
                    <input 
                      id="tax-id"
                      type="text" 
                      className="form-control" 
                      value={taxId} 
                      onChange={(e) => setTaxId(e.target.value)} 
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="logo" className="form-label">{t.logo}</label>
                    <input 
                      id="logo"
                      type="text" 
                      className="form-control" 
                      value={logo} 
                      onChange={(e) => setLogo(e.target.value)} 
                    />
                  </div>

                  <h5>{t.primaryContact}</h5>

                  <div className="mb-3">
                    <label htmlFor="contact-name" className="form-label">{t.name}</label>
                    <input
                      id="contact-name"
                      type="text"
                      className="form-control"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="contact-email" className="form-label">{t.email}</label>
                    <input
                      id="contact-email"
                      type="email"
                      className="form-control"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="contact-phone" className="form-label">{t.phone}</label>
                    <input
                      id="contact-phone"
                      type="tel"
                      className="form-control"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={() => void handleCreateOrg()}
                    disabled={isLoading}
                    className="btn btn-primary w-100"
                  >
                    {t.create}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card org-info-card">
                <div className="card-body">
                  <h2>{t.organization}</h2>
                  <p className="text-muted">
                    {locale === 'fr'
                      ? 'Choisissez une organisation active à rejoindre.'
                      : 'اختر منظمة نشطة للانضمام إليها.'}
                  </p>
                  {currentUser?.joinedOrganizationName ? (
                    <p className="text-success mb-0">
                      {t.joinedOrganization}: <strong>{currentUser.joinedOrganizationName}</strong>
                    </p>
                  ) : (
                    <p className="text-muted mb-0">{t.noData}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="col-md-6">
            <div className="card org-info-card">
              <div className="card-body">
                <h2>{t.availableOrganizations}</h2>
                {currentUser?.joinedOrganizationName ? (
                  <p className="text-success mb-3">
                    {t.joinedOrganization}: <strong>{currentUser.joinedOrganizationName}</strong>
                  </p>
                ) : null}

                {organizations.length === 0 ? (
                  <p className="text-muted">{t.noOrgs}</p>
                ) : (
                  <div className="org-list">
                    {organizations.map((org) => {
                      const isJoined = currentUser?.joinedOrganizationId === org.id
                      return (
                        <div className="org-list-item" key={org.id}>
                          <div>
                            <h5 className="mb-1">{org.name}</h5>
                            <div className="text-muted small">{org.mission || org.description || org.legalAddress}</div>
                            <div className="text-muted small">{org.primaryContactEmail}</div>
                          </div>
                          <button
                            className="btn btn-primary"
                            disabled={isLoading || joiningOrgId === org.id || isJoined}
                            onClick={() => void handleJoinOrganization(org)}
                          >
                            {isJoined ? t.joinedOrganization : (joiningOrgId === org.id ? t.loading : t.joinOrganization)}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
