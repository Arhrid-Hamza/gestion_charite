import { useEffect, useState } from 'react'
import type { User, Organization, CharityAction } from '../types'
import { useApi } from '../hooks/useApi'
import type { Locale } from '../types'
import { Alert } from './Header'
import './OrganizationDashboard.css'

type PageType = 'auth' | 'dashboard' | 'explore' | 'donate' | 'profile' | 'participate' | 'organization' | 'admin' | 'org-dashboard'

interface OrganizationDashboardProps {
  locale: Locale
  user: User
  onNavigate: (page: PageType, action?: CharityAction) => void
}

interface ActionFormState {
  id?: number
  title: string
  description: string
  targetAmount: string
  categoryName: string
  location: string
  startDate: string
  endDate: string
  mediaUrls: string
  status?: CharityAction['status']
  collectedAmount?: number
}

const EMPTY_ACTION_FORM: ActionFormState = {
  title: '',
  description: '',
  targetAmount: '',
  categoryName: '',
  location: '',
  startDate: '',
  endDate: '',
  mediaUrls: '',
}

function toMediaString(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  return value ?? ''
}

function normalizeMediaUrls(value: string) {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(',')
}

export function OrganizationDashboard({ locale: _locale, user, onNavigate }: OrganizationDashboardProps) {
  const { call, error, isLoading, setError } = useApi()

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [actions, setActions] = useState<CharityAction[]>([])
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Partial<Organization>>({})
  const [actionForm, setActionForm] = useState<ActionFormState>(EMPTY_ACTION_FORM)
  const [actionFormOpen, setActionFormOpen] = useState(false)
  const [success, setSuccess] = useState('')
  const [loadingOrg, setLoadingOrg] = useState(true)

  const totalRaised = actions.reduce((sum, action) => sum + Number(action.collectedAmount || 0), 0)
  const totalTarget = actions.reduce((sum, action) => sum + Number(action.targetAmount || 0), 0)
  const activeActions = actions.filter((action) => (action.status || '').toUpperCase() === 'OPEN').length
  const completionRate = totalTarget > 0 ? Math.min(100, (totalRaised / totalTarget) * 100) : 0

  function resetActionForm() {
    setActionForm(EMPTY_ACTION_FORM)
    setActionFormOpen(false)
  }

  // Load organization data
  useEffect(() => {
    const loadOrgData = async () => {
      try {
        setLoadingOrg(true)
        const orgs = await call<Organization[]>('/organizations')
        
        // Find organization by admin user ID
        const userOrg = orgs.find((org) => org.adminUserId === user.id)
          ?? orgs.find((org) => org.primaryContactEmail?.toLowerCase() === user.email?.toLowerCase())
        
        if (userOrg) {
          setOrganization(userOrg)
          setFormData(userOrg)

          // Load charity actions for this organization
          const orgActions = await call<CharityAction[]>(`/charity-actions?organizationId=${userOrg.id}`)
          setActions(orgActions)
        }
      } catch (err) {
        console.error('Failed to load organization data:', err)
      } finally {
        setLoadingOrg(false)
      }
    }

    void loadOrgData()
  }, [call, user.id, user.email])

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')

    try {
      if (!organization) {
        throw new Error('No organization to update')
      }

      const payload = await call<Organization>(`/organizations/${organization.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...organization,
          ...formData,
        }),
      })

      setOrganization(payload)
      setFormData(payload)
      setSuccess('Organization updated successfully!')
      setEditMode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save organization')
    }
  }

  const handleCreateAction = () => {
    setActionForm(EMPTY_ACTION_FORM)
    setActionFormOpen(true)
  }

  const handleEditAction = (action: CharityAction) => {
    setActionForm({
      id: action.id,
      title: action.title || '',
      description: action.description || '',
      targetAmount: String(action.targetAmount ?? ''),
      categoryName: action.categoryName || '',
      location: action.location || '',
      startDate: action.startDate || '',
      endDate: action.endDate || '',
      mediaUrls: toMediaString(action.mediaUrls),
      status: action.status,
      collectedAmount: Number(action.collectedAmount || 0),
    })
    setActionFormOpen(true)
  }

  const handleViewAction = (action: CharityAction) => {
    onNavigate('donate', action)
  }

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')

    if (!organization) {
      setError('No organization selected')
      return
    }

    const targetAmount = Number(actionForm.targetAmount)
    if (!actionForm.title.trim() || !actionForm.description.trim() || !actionForm.categoryName.trim()) {
      setError('Title, description, and category are required')
      return
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setError('Target amount must be greater than zero')
      return
    }

    try {
      const payload = {
        title: actionForm.title.trim(),
        description: actionForm.description.trim(),
        targetAmount,
        collectedAmount: actionForm.collectedAmount ?? 0,
        status: actionForm.status ?? 'OPEN',
        organizationId: organization.id,
        organizationName: organization.name,
        categoryName: actionForm.categoryName.trim(),
        startDate: actionForm.startDate || null,
        endDate: actionForm.endDate || null,
        location: actionForm.location.trim() || null,
        mediaUrls: normalizeMediaUrls(actionForm.mediaUrls),
      }

      let saved: CharityAction
      if (actionForm.id) {
        saved = await call<CharityAction>(`/charity-actions/${actionForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        setActions((prev) => prev.map((item) => (item.id === saved.id ? saved : item)))
        setSuccess('Charity action updated successfully')
      } else {
        saved = await call<CharityAction>(`/charity-actions/organization/${organization.id}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setActions((prev) => [saved, ...prev])
        setSuccess('Charity action created successfully')
      }

      resetActionForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save charity action')
    }
  }

  const handleArchiveAction = async (actionId: number) => {
    setSuccess('')
    try {
      const archived = await call<CharityAction>(`/charity-actions/${actionId}/archive`, {
        method: 'PUT',
      })
      setActions((prev) => prev.map((item) => (item.id === archived.id ? archived : item)))
      setSuccess('Charity action archived successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive charity action')
    }
  }

  if (loadingOrg) {
    return (
      <div className="org-dashboard">
        <div className="dashboard-container">
          <div className="org-loading-card">
            <div className="spinner" />
            <p>Loading organization data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="org-dashboard">
      <div className="dashboard-container">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} />}

        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-kicker">Organization mode</div>
          <h1 className="dashboard-title">Organization Dashboard</h1>
          <p className="dashboard-subtitle">Manage your organization, monitor campaigns, and track funding in one place.</p>
        </div>

        {organization ? (
          <>
            <div className="org-metrics-grid">
              <div className="metric-card metric-primary">
                <span className="metric-label">Organization</span>
                <strong className="metric-value">{organization.name}</strong>
                <span className="metric-caption">{organization.status} approval status</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Charity actions</span>
                <strong className="metric-value">{actions.length}</strong>
                <span className="metric-caption">{activeActions} currently active</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Raised</span>
                <strong className="metric-value">${totalRaised.toFixed(2)}</strong>
                <span className="metric-caption">Across all campaigns</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Completion</span>
                <strong className="metric-value">{completionRate.toFixed(0)}%</strong>
                <span className="metric-caption">Of total target funding</span>
              </div>
            </div>

            {/* Organization Overview Card */}
            <div className="org-overview-card">
              <div className="org-overview-header">
                <div className="org-info">
                  <h2 className="org-name">{organization.name}</h2>
                  <p className="org-status">
                    Status: <span className={`status-badge status-${organization.status.toLowerCase()}`}>
                      {organization.status}
                    </span>
                  </p>
                </div>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    if (editMode) {
                      setFormData(organization)
                    }
                    setEditMode(!editMode)
                  }}
                >
                  {editMode ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="org-split-panel">
                <div className="org-summary-panel">
                  <h3>Dashboard summary</h3>
                  <ul className="summary-list">
                    <li><span>Status</span><strong>{organization.status}</strong></li>
                    <li><span>Contact</span><strong>{organization.primaryContactEmail}</strong></li>
                    <li><span>Address</span><strong>{organization.legalAddress}</strong></li>
                  </ul>
                </div>

                <div className="org-progress-panel">
                  <h3>Funding overview</h3>
                  <div className="org-progress-ring">
                    <span>{completionRate.toFixed(0)}%</span>
                  </div>
                  <p>{actions.length} campaigns, ${totalRaised.toFixed(2)} raised, ${totalTarget.toFixed(2)} target</p>
                </div>
              </div>

              {!editMode ? (
                <div className="org-details-view">
                  <div className="detail-row">
                    <label>Legal Address:</label>
                    <span>{organization.legalAddress}</span>
                  </div>
                  <div className="detail-row">
                    <label>Tax ID:</label>
                    <span>{organization.taxIdentificationNumber}</span>
                  </div>
                  <div className="detail-row">
                    <label>Primary Contact:</label>
                    <span>{organization.primaryContactName} ({organization.primaryContactEmail})</span>
                  </div>
                  {organization.description && (
                    <div className="detail-row full-width">
                      <label>Description:</label>
                      <span>{organization.description}</span>
                    </div>
                  )}
                  {organization.mission && (
                    <div className="detail-row full-width">
                      <label>Mission:</label>
                      <span>{organization.mission}</span>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={(e) => void handleSaveOrganization(e)} className="org-edit-form">
                  <div className="form-group">
                    <label htmlFor="org-name" className="form-label">Organization Name</label>
                    <input
                      id="org-name"
                      type="text"
                      className="form-input"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-address" className="form-label">Legal Address</label>
                    <input
                      id="org-address"
                      type="text"
                      className="form-input"
                      value={formData.legalAddress || ''}
                      onChange={(e) => setFormData({ ...formData, legalAddress: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-tax" className="form-label">Tax ID</label>
                    <input
                      id="org-tax"
                      type="text"
                      className="form-input"
                      value={formData.taxIdentificationNumber || ''}
                      onChange={(e) => setFormData({ ...formData, taxIdentificationNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-contact" className="form-label">Primary Contact Name</label>
                    <input
                      id="org-contact"
                      type="text"
                      className="form-input"
                      value={formData.primaryContactName || ''}
                      onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-email" className="form-label">Contact Email</label>
                    <input
                      id="org-email"
                      type="email"
                      className="form-input"
                      value={formData.primaryContactEmail || ''}
                      onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-phone" className="form-label">Contact Phone</label>
                    <input
                      id="org-phone"
                      type="tel"
                      className="form-input"
                      value={formData.primaryContactPhone || ''}
                      onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-description" className="form-label">Description</label>
                    <textarea
                      id="org-description"
                      className="form-input"
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="org-mission" className="form-label">Mission</label>
                    <textarea
                      id="org-mission"
                      className="form-input"
                      rows={3}
                      value={formData.mission || ''}
                      onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              )}
            </div>

            {/* Charity Actions Section */}
            <div className="charity-actions-section">
              <div className="section-header">
                <h2 className="section-title">Charity Actions</h2>
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateAction}
                >
                  Create action
                </button>
              </div>

              {actionFormOpen && (
                <form onSubmit={(e) => void handleSaveAction(e)} className="org-edit-form mb-4">
                  <div className="form-group">
                    <label htmlFor="action-title" className="form-label">Title</label>
                    <input
                      id="action-title"
                      type="text"
                      className="form-input"
                      value={actionForm.title}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="action-description" className="form-label">Description</label>
                    <textarea
                      id="action-description"
                      className="form-input"
                      rows={3}
                      value={actionForm.description}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="action-target" className="form-label">Target amount</label>
                    <input
                      id="action-target"
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-input"
                      value={actionForm.targetAmount}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="action-category" className="form-label">Category</label>
                    <input
                      id="action-category"
                      type="text"
                      className="form-input"
                      placeholder="education, sante, environnement..."
                      value={actionForm.categoryName}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, categoryName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="action-location" className="form-label">Location</label>
                    <input
                      id="action-location"
                      type="text"
                      className="form-input"
                      value={actionForm.location}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, location: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="action-start" className="form-label">Start date</label>
                    <input
                      id="action-start"
                      type="date"
                      className="form-input"
                      value={actionForm.startDate}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="action-end" className="form-label">End date</label>
                    <input
                      id="action-end"
                      type="date"
                      className="form-input"
                      value={actionForm.endDate}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="action-media" className="form-label">Media URLs (images/videos)</label>
                    <textarea
                      id="action-media"
                      className="form-input"
                      rows={3}
                      placeholder="https://...image.jpg, https://...video.mp4"
                      value={actionForm.mediaUrls}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, mediaUrls: e.target.value }))}
                    />
                  </div>

                  <div className="action-actions">
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? 'Saving...' : actionForm.id ? 'Update action' : 'Create action'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetActionForm}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {actions.length === 0 ? (
                <div className="empty-state">
                  <p>No charity actions yet. Create one to get started!</p>
                </div>
              ) : (
                <div className="actions-grid">
                  {actions.map((action) => (
                    <div key={action.id} className="action-card-org">
                      <div className="action-header-org">
                        <h3 className="action-title-org">{action.title}</h3>
                        <span className={`status-badge status-${(action.status || 'active').toLowerCase()}`}>
                          {action.status || 'ACTIVE'}
                        </span>
                      </div>

                      <p className="action-description-org">{action.description}</p>

                      <div className="progress-bar-org">
                        <progress
                          className="action-progress"
                          value={Math.min(100, (Number(action.collectedAmount || 0) / Math.max(Number(action.targetAmount || 0), 1)) * 100)}
                          max={100}
                        />
                      </div>

                      <div className="progress-info">
                        <span className="collected">${action.collectedAmount.toFixed(2)}</span>
                        <span className="target">/ ${action.targetAmount.toFixed(2)}</span>
                      </div>

                      <div className="action-actions">
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewAction(action)}
                        >
                          View
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditAction(action)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => void handleArchiveAction(action.id)}
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="no-organization">
            <p className="error-message">You are not associated with any organization yet.</p>
            <p className="info-message">Contact an administrator to link your account to an organization.</p>
          </div>
        )}
      </div>
    </div>
  )
}
