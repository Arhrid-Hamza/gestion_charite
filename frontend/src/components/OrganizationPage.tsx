import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import { Alert } from './Header'
import type { Locale, Organization } from '../types'
import '../styles/OrganizationPage.css'

interface OrganizationPageProps {
  locale: Locale
  userId?: number
  onOrgCreated?: (org: Organization) => void
}

export function OrganizationPage({ locale, userId, onOrgCreated }: OrganizationPageProps) {
  const t = I18N[locale]
  const { call, error, isLoading, setError } = useApi()

  const [name, setName] = useState('')
  const [mission, setMission] = useState('')
  const [legalAddress, setLegalAddress] = useState('')
  const [taxId, setTaxId] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [logo, setLogo] = useState('')
  const [success, setSuccess] = useState('')

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
          primaryContactPhone: contactPhone,
          logoUrl: logo,
          adminUserId: userId,
          status: 'PENDING',
        }),
      })

      setSuccess('Organisation créée et en attente d\'approbation')
      setName('')
      setMission('')
      onOrgCreated?.(payload)
    } catch {
      // Erreur déjà définie
    }
  }

  return (
    <div className="org-page py-5">
      <div className="container">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} />}

        <div className="row">
          <div className="col-md-6">
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
          </div>

          <div className="col-md-6">
            <div className="card org-info-card">
              <div className="card-body">
                <h3>{t.yourOrganizations}</h3>
                <p className="text-muted">{t.noOrgs}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
