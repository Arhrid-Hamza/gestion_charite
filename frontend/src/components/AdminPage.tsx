import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import { Alert, Loader } from './Header'
import type { Locale, Organization } from '../types'
import '../styles/AdminPage.css'
import { useState, useEffect } from 'react'

interface AdminPageProps {
  locale: Locale
}

export function AdminPage({ locale }: AdminPageProps) {
  const t = I18N[locale]
  const { call, error, isLoading, setError } = useApi()

  const [orgs, setOrgs] = useState<Organization[]>([])
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadPendingOrgs()
  }, [])

  async function loadPendingOrgs() {
    try {
      const data = await call<Organization[]>('/organizations/pending')
      setOrgs(data)
    } catch {
      // Erreur déjà définie
    }
  }

  async function approveOrg(orgId: number) {
    setSuccess('')

    try {
      await call(`/organizations/${orgId}/approve?superAdminApproved=true`, {
        method: 'PUT',
      })

      setSuccess('Organisation approuvée!')
      await loadPendingOrgs()
    } catch {
      // Erreur déjà définie
    }
  }

  return (
    <div className="admin-page py-5">
      <div className="container">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} />}

        <h2 className="admin-title">{t.adminPanel}</h2>

        {isLoading ? (
          <Loader message={t.loading} />
        ) : (
          <div className="row">
            <div className="col-md-12">
              <div className="pending-orgs">
                <h3>{t.pendingOrganizations}</h3>

                {orgs.length === 0 ? (
                  <p className="no-pending">{t.noPendingOrgs}</p>
                ) : (
                  <div className="org-list">
                    {orgs.map((org) => (
                      <div key={org.id} className="card org-approval-card">
                        <div className="card-body">
                          <div className="org-header">
                            <div>
                              <h5>{org.name}</h5>
                              <p className="org-mission">{org.mission}</p>
                            </div>
                            <span className={`badge bg-warning`}>{org.status}</span>
                          </div>

                          <div className="org-details">
                            <span>📍 {org.legalAddress}</span>
                            <span>🆔 {org.taxIdentificationNumber}</span>
                          </div>

                          <div className="contact-info">
                            <h6>{t.primaryContact}</h6>
                            <p>{org.primaryContactName}</p>
                            <p>📧 {org.primaryContactEmail}</p>
                            <p>📱 {org.primaryContactPhone}</p>
                          </div>

                          <button
                            onClick={() => void approveOrg(org.id)}
                            disabled={isLoading}
                            className="btn btn-success"
                          >
                            {t.approve}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
