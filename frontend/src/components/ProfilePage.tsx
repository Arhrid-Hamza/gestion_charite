import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import type { Locale, User, Donation, Organization } from '../types'
import '../styles/ProfilePage.css'

interface ProfilePageProps {
  locale: Locale
  user?: User
  onUpdate?: (user: User) => void
}

/* ── Alert ──────────────────────────────────────────────────── */
function Alert({
  type,
  message,
  onClose,
}: {
  type: 'error' | 'success'
  message: string
  onClose?: () => void
}) {
  return (
    <div className={`pp-alert pp-alert-${type}`} role="alert">
      <span>{type === 'success' ? '✓' : '!'}</span>
      <span>{message}</span>
      {onClose && (
        <button className="pp-alert-close" onClick={onClose} aria-label="Fermer">
          ×
        </button>
      )}
    </div>
  )
}

/* ── Initials helper ────────────────────────────────────────── */
function initials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.trim().slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return '??'
}

/* ── Component ──────────────────────────────────────────────── */
export function ProfilePage({ locale, user, onUpdate }: ProfilePageProps) {
  const t = I18N[locale]
  const { call, error, isLoading, setError } = useApi()

  const [profileUser, setProfileUser] = useState<User | undefined>(user)
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [address, setAddress] = useState(user?.address ?? '')
  const [interests, setInterests] = useState(user?.interests ?? 'education,sante')
  const [donations, setDonations] = useState<Donation[]>([])
  const [organizationProfile, setOrganizationProfile] = useState<Organization | null>(null)
  const [success, setSuccess] = useState('')

  /* ── Load user / org ────────────────────────────────────────── */
  useEffect(() => {
    if (!user?.id) return

    if (user.role === 'ORGANIZER') {
      const tid = window.setTimeout(() => {
        void call<Organization[]>('/organizations')
          .then((orgs) => {
            const linked =
              orgs.find((o) => o.adminUserId === user.id) ??
              orgs.find(
                (o) =>
                  o.primaryContactEmail?.toLowerCase() === user.email?.toLowerCase(),
              )

            if (!linked) {
              setProfileUser(user)
              setFullName(user.fullName ?? '')
              setPhone(user.phone ?? '')
              setAddress(user.address ?? '')
              setInterests(user.interests ?? '')
              setOrganizationProfile(null)
              return
            }

            setOrganizationProfile(linked)
            setProfileUser({
              ...user,
              fullName: linked.primaryContactName ?? linked.name,
              phone: linked.primaryContactPhone ?? '',
              address: linked.legalAddress ?? '',
              interests: linked.mission ?? '',
            })
            setFullName(linked.primaryContactName ?? linked.name ?? '')
            setPhone(linked.primaryContactPhone ?? '')
            setAddress(linked.legalAddress ?? '')
            setInterests(linked.mission ?? '')
          })
          .catch(() => {
            setProfileUser(user)
            setFullName(user.fullName ?? '')
            setPhone(user.phone ?? '')
            setAddress(user.address ?? '')
            setInterests(user.interests ?? '')
            setOrganizationProfile(null)
          })
      }, 0)
      return () => window.clearTimeout(tid)
    }

    const tid = window.setTimeout(() => {
      void call<User>(`/users/${user.id}`)
        .then((payload) => {
          setProfileUser(payload)
          setFullName(payload.fullName ?? '')
          setPhone(payload.phone ?? '')
          setAddress(payload.address ?? '')
          setInterests(payload.interests ?? 'education,sante')
          onUpdate?.(payload)
        })
        .catch(() => {
          setProfileUser(user)
          setFullName(user.fullName ?? '')
          setPhone(user.phone ?? '')
          setAddress(user.address ?? '')
          setInterests(user.interests ?? 'education,sante')
        })
    }, 0)

    return () => window.clearTimeout(tid)
  }, [call, onUpdate, user])

  /* ── Load donations ─────────────────────────────────────────── */
  useEffect(() => {
    if (!user?.id || user.role === 'ORGANIZER') return
    const tid = window.setTimeout(() => {
      void call<Donation[]>(`/donations/user/${user.id}`)
        .then(setDonations)
        .catch(() => setDonations([]))
    }, 0)
    return () => window.clearTimeout(tid)
  }, [call, user?.id, user?.role])

  /* ── Save ───────────────────────────────────────────────────── */
  async function handleSave() {
    if (!user?.id) {
      setError('Utilisateur non identifie')
      return
    }

    if (user.role === 'ORGANIZER') {
      if (!organizationProfile) {
        setError('Organisation introuvable pour ce compte')
        return
      }
      try {
        const payload = await call<Organization>(
          `/organizations/${organizationProfile.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              ...organizationProfile,
              primaryContactName: fullName,
              primaryContactPhone: phone,
              legalAddress: address,
              mission: interests,
            }),
          },
        )
        setOrganizationProfile(payload)
        setProfileUser((prev) =>
          prev
            ? {
                ...prev,
                fullName: payload.primaryContactName ?? prev.fullName,
                phone: payload.primaryContactPhone ?? '',
                address: payload.legalAddress ?? '',
                interests: payload.mission ?? '',
              }
            : prev,
        )
        onUpdate?.({
          ...(user ?? {
            id: 0,
            fullName: '',
            email: '',
            role: 'DONOR' as const,
            preferredLanguage: 'fr',
          }),
          fullName: payload.primaryContactName ?? user.fullName,
          phone: payload.primaryContactPhone ?? '',
          address: payload.legalAddress ?? '',
          interests: payload.mission ?? '',
        })
        setSuccess("Informations de l'organisation mises a jour avec succes !")
      } catch {
        /* error set by useApi */
      }
      return
    }

    setSuccess('')
    try {
      const payload = await call<User>(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ fullName, phone, address, interests }),
      })
      setProfileUser(payload)
      setSuccess('Profil mis a jour avec succes !')
      onUpdate?.(payload)
    } catch {
      /* error set by useApi */
    }
  }

  /* ── Derived ────────────────────────────────────────────────── */
  const isOrganizer  = user?.role === 'ORGANIZER'
  const totalDonated = donations.reduce((s, d) => s + d.amount, 0)
  const maxAmount    = donations.length ? Math.max(...donations.map((d) => d.amount)) : 1
  const avatarText   = initials(profileUser?.fullName ?? fullName, user?.email)
  const displayName  = profileUser?.fullName ?? fullName ?? '—'
  const displayEmail = profileUser?.email ?? user?.email ?? ''

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="profile-page">
      <div className="pp-wrapper">

        {/* ── SIDEBAR ─────────────────────────────────────────── */}
        <aside className="pp-sidebar">
          {/* Avatar */}
          <div className="pp-avatar-wrap">
            <div className="pp-avatar-ring">
              <span className="pp-avatar-initials">{avatarText}</span>
            </div>
            <span className="pp-online-dot" aria-hidden="true" />
          </div>

          <p className="pp-sidebar-name">{displayName}</p>
          <p className="pp-sidebar-role">{isOrganizer ? 'Organizer' : 'Donor'}</p>
          <p className="pp-sidebar-email">{displayEmail}</p>

          <div className="pp-sidebar-divider" />

          {/* Quick stats */}
          {isOrganizer ? (
            <div className="pp-sidebar-stats">
              <div className="pp-stat-pill">
                <span className="pp-stat-pill-label">Organisation</span>
                <span className="pp-stat-pill-val">
                  {organizationProfile?.name?.slice(0, 12) ?? '—'}
                </span>
              </div>
              <div className="pp-stat-pill">
                <span className="pp-stat-pill-label">Statut</span>
                <span className="pp-stat-pill-val">
                  {organizationProfile?.status ?? '—'}
                </span>
              </div>
            </div>
          ) : (
            <div className="pp-sidebar-stats">
              <div className="pp-stat-pill">
                <span className="pp-stat-pill-label">{t.totalDonated}</span>
                <span className="pp-stat-pill-val">${totalDonated.toFixed(0)}</span>
              </div>
              <div className="pp-stat-pill">
                <span className="pp-stat-pill-label">{t.donations}</span>
                <span className="pp-stat-pill-val">{donations.length}</span>
              </div>
            </div>
          )}

          {profileUser?.createdAt && (
            <p className="pp-sidebar-since">
              {t.memberSince} {profileUser.createdAt}
            </p>
          )}
        </aside>

        {/* ── CONTENT ─────────────────────────────────────────── */}
        <main className="pp-content">
          {/* Alerts */}
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}
          {success && (
            <Alert
              type="success"
              message={success}
              onClose={() => setSuccess('')}
            />
          )}

          {/* Header */}
          <div className="pp-content-header">
            <p className="pp-eyebrow">Account Settings</p>
            <h1>
              Mon <span>{t.profile}</span>
            </h1>
          </div>

          {/* ── Section 1 : form ─────────────────────────────── */}
          <section className="pp-section">
            <div className="pp-section-head">
              <div className="pp-section-icon" aria-hidden="true">✎</div>
              <span className="pp-section-title">Informations personnelles</span>
            </div>

            <div className="pp-section-body">
              <div className="pp-form-grid">
                {/* Name */}
                <div className="pp-field">
                  <label htmlFor="pp-name" className="pp-label">{t.name}</label>
                  <input
                    id="pp-name"
                    type="text"
                    className="pp-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Votre nom complet"
                  />
                </div>

                {/* Email */}
                <div className="pp-field">
                  <label htmlFor="pp-email" className="pp-label">{t.email}</label>
                  <input
                    id="pp-email"
                    type="email"
                    className="pp-input"
                    value={displayEmail}
                    disabled
                  />
                </div>

                {/* Phone */}
                <div className="pp-field">
                  <label htmlFor="pp-phone" className="pp-label">{t.phone}</label>
                  <input
                    id="pp-phone"
                    type="tel"
                    className="pp-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+212 6 00 00 00 00"
                  />
                </div>

                {/* Interests / Mission */}
                <div className="pp-field">
                  <label htmlFor="pp-interests" className="pp-label">
                    {isOrganizer ? 'Mission' : t.interests}
                  </label>
                  <input
                    id="pp-interests"
                    type="text"
                    className="pp-input"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder={isOrganizer ? "Mission de l'organisation" : 'education, sante...'}
                  />
                </div>

                {/* Address */}
                <div className="pp-field pp-field-full">
                  <label htmlFor="pp-address" className="pp-label">{t.address}</label>
                  <textarea
                    id="pp-address"
                    className="pp-input"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Votre adresse..."
                  />
                </div>
              </div>

              <button
                className="pp-save-btn"
                onClick={() => void handleSave()}
                disabled={isLoading}
              >
                {isLoading ? 'Enregistrement...' : t.save}
              </button>
            </div>
          </section>

          {/* ── Section 2 : org info OR stats ────────────────── */}
          {isOrganizer ? (
            <section className="pp-section">
              <div className="pp-section-head">
                <div className="pp-section-icon" aria-hidden="true">🏛</div>
                <span className="pp-section-title">Organisation</span>
              </div>
              <div className="pp-section-body">
                <div className="pp-org-grid">
                  <div className="pp-org-item">
                    <p className="pp-org-item-label">Nom</p>
                    <p className="pp-org-item-val">{organizationProfile?.name ?? '—'}</p>
                  </div>
                  <div className="pp-org-item">
                    <p className="pp-org-item-label">Statut</p>
                    <p className="pp-org-item-val">{organizationProfile?.status ?? '—'}</p>
                  </div>
                  <div className="pp-org-item">
                    <p className="pp-org-item-label">Identifiant fiscal</p>
                    <p className="pp-org-item-val">
                      {organizationProfile?.taxIdentificationNumber ?? '—'}
                    </p>
                  </div>
                  <div className="pp-org-item">
                    <p className="pp-org-item-label">Email contact</p>
                    <p className="pp-org-item-val" style={{ fontSize: '0.82rem' }}>
                      {organizationProfile?.primaryContactEmail ?? displayEmail}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* ── Section 3 : donation history ─────────────────── */}
          {!isOrganizer && (
            <section className="pp-section">
              <div className="pp-section-head">
                <div className="pp-section-icon" aria-hidden="true">♥</div>
                <span className="pp-section-title">{t.donationHistory}</span>
              </div>
              <div className="pp-section-body">
                {donations.length === 0 ? (
                  <p className="pp-no-don">{t.noDonations}</p>
                ) : (
                  <div className="pp-don-list">
                    {donations.map((d, idx) => {
                      const pct = Math.round((d.amount / maxAmount) * 100)
                      return (
                        <div
                          key={d.id}
                          className="pp-don-row"
                          style={{ animationDelay: `${0.3 + idx * 0.06}s` }}
                        >
                          <span className="pp-don-id">#{d.id}</span>
                          <div className="pp-don-bar-track">
                            <div
                              className="pp-don-bar-fill"
                              style={{
                                width: `${pct}%`,
                                animationDelay: `${0.5 + idx * 0.06}s`,
                              }}
                            />
                          </div>
                          <span className="pp-don-amount">${d.amount}</span>
                          <span className="pp-don-badge">{d.status}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}