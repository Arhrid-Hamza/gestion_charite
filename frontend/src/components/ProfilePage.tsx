import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import { Alert } from './Header'
import type { Locale, User, Donation } from '../types'
import '../styles/ProfilePage.css'

interface ProfilePageProps {
  locale: Locale
  user?: User
  onUpdate?: (user: User) => void
}

export function ProfilePage({ locale, user, onUpdate }: ProfilePageProps) {
  const t = I18N[locale]
  const { call, error, isLoading, setError } = useApi()

  const [profileUser, setProfileUser] = useState<User | undefined>(user)
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [interests, setInterests] = useState(user?.interests || 'education,sante')
  const [donations, setDonations] = useState<Donation[]>([])
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!user?.id) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void call<User>(`/users/${user.id}`).then((payload) => {
        setProfileUser(payload)
        setFullName(payload.fullName || '')
        setPhone(payload.phone || '')
        setAddress(payload.address || '')
        setInterests(payload.interests || 'education,sante')
        onUpdate?.(payload)
      })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [call, onUpdate, user?.id])

  useEffect(() => {
    if (user?.id) {
      const timeoutId = window.setTimeout(() => {
        void call<Donation[]>(`/donations/user/${user.id}`).then(setDonations)
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }
  }, [call, user?.id])

  async function handleUpdateProfile() {
    if (!user?.id) {
      setError('Utilisateur non identifié')
      return
    }

    setSuccess('')

    try {
      const payload = await call<User>(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName,
          phone,
          address,
          interests,
        }),
      })

      setProfileUser(payload)
      setSuccess('Profil mis à jour avec succès!')
      onUpdate?.(payload)
    } catch {
      // Erreur déjà définie
    }
  }

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="profile-page py-5">
      <div className="container">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} />}

        <div className="row mb-4">
          <div className="col-md-6">
            <div className="profile-card">
              <h2 className="profile-title">{t.profile}</h2>

              <div className="mb-3">
                <label htmlFor="full-name" className="form-label">{t.name}</label>
                <input 
                  id="full-name"
                  type="text" 
                  className="form-control" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                />
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">{t.email}</label>
                <input 
                  id="email"
                  type="email" 
                  className="form-control" 
                  value={profileUser?.email || user?.email || ''} 
                  disabled 
                />
              </div>

              <div className="mb-3">
                <label htmlFor="phone" className="form-label">{t.phone}</label>
                <input 
                  id="phone"
                  type="tel" 
                  className="form-control" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>

              <div className="mb-3">
                <label htmlFor="address" className="form-label">{t.address}</label>
                <textarea
                  id="address"
                  className="form-control"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="interests" className="form-label">{t.interests}</label>
                <input 
                  id="interests"
                  type="text" 
                  className="form-control" 
                  value={interests} 
                  onChange={(e) => setInterests(e.target.value)} 
                />
              </div>

              <button
                onClick={() => void handleUpdateProfile()}
                disabled={isLoading}
                className="btn btn-primary w-100"
              >
                {t.save}
              </button>
            </div>
          </div>

          <div className="col-md-6">
            <div className="stats-card">
              <h3>{t.statistics}</h3>
              <div className="stat-item">
                <span className="stat-label">{t.totalDonated}:</span>
                <span className="stat-value">${totalDonated.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t.donations}:</span>
                <span className="stat-value">{donations.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t.memberSince}:</span>
                <span className="stat-value">{profileUser?.createdAt || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="donations-history">
          <h3>{t.donationHistory}</h3>
          {donations.length === 0 ? (
            <p className="no-donations">{t.noDonations}</p>
          ) : (
            <div className="donation-list">
              {donations.map((d) => (
                <div key={d.id} className="donation-item">
                  <div className="donation-info">
                    <span className="donation-id">#{d.id}</span>
                    <span className="donation-amount">${d.amount}</span>
                  </div>
                  <span className="donation-status">{d.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
