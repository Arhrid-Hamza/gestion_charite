import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import { Alert } from './Header'
import type { Locale, CharityAction, Donation } from '../types'
import '../styles/DonatePage.css'
import { useEffect, useState } from 'react'

const PENDING_DONATION_KEY = 'pendingDonationPayment'

interface PaymentRequest {
  actionId: number
  donorUserId: number
  participantUserId?: number
  amount: number
  message: string
}

interface ProviderResponse {
  donation?: Donation
}

interface DonatePageProps {
  locale: Locale
  userId?: number
  selectedAction?: CharityAction
  onSuccess?: (donation: Donation) => void
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250]

const STEPS = ['amount', 'details', 'confirm'] as const
type Step = typeof STEPS[number]

export function DonatePage({
  locale,
  userId,
  selectedAction,
  onSuccess,
}: DonatePageProps) {
  const t = I18N[locale]
  const { call, error, isLoading, setError } = useApi()

  const [step, setStep] = useState<Step>('amount')
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [actionIdInput, setActionIdInput] = useState(selectedAction?.id ? String(selectedAction.id) : '')
  const [amount, setAmount] = useState('50')
  const [customAmount, setCustomAmount] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState('')
  const [donated, setDonated] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'PAYPAL' | 'AUTOMATIC' | 'NO_PAYMENT'>('AUTOMATIC')

  const parsedActionId = Number.parseInt(actionIdInput, 10)
  const isActionIdValid = Number.isInteger(parsedActionId) && parsedActionId > 0
  const parsedAmount = parseFloat(amount)
  const isAmountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentState = params.get('payment')
    if (!paymentState) return

    async function finalizePayment() {
      try {
        if (paymentState === 'paypal-success') {
          const orderId = params.get('token')
          const rawPendingDonation = localStorage.getItem(PENDING_DONATION_KEY)
          if (!orderId || !rawPendingDonation) { setError('Paiement PayPal invalide ou expiré'); return }
          const pendingDonation = JSON.parse(rawPendingDonation) as PaymentRequest
          const response = await call<ProviderResponse>(`/payments/paypal/capture/${orderId}`, {
            method: 'POST', body: JSON.stringify(pendingDonation),
          })
          localStorage.removeItem(PENDING_DONATION_KEY)
          setSuccess('Don PayPal confirmé avec succès!')
          setDonated(true)
          if (response.donation) onSuccess?.(response.donation)
          return
        }
        if (paymentState === 'stripe-success') {
          const sessionId = params.get('session_id')
          if (!sessionId) { setError('Session Stripe manquante'); return }
          const response = await call<ProviderResponse>(`/payments/stripe/confirm-session?sessionId=${encodeURIComponent(sessionId)}`, { method: 'POST' })
          setSuccess('Don Stripe confirmé avec succès!')
          setDonated(true)
          if (response.donation) onSuccess?.(response.donation)
          return
        }
        if (paymentState === 'paypal-cancel' || paymentState === 'stripe-cancel') {
          setError('Paiement annulé')
        }
      } catch {
        // error set by useApi
      } finally {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
    void finalizePayment()
  }, [call, onSuccess, setError])

  function goTo(next: Step) {
    const idx = STEPS.indexOf(next)
    const cur = STEPS.indexOf(step)
    setDirection(idx > cur ? 'forward' : 'back')
    setStep(next)
  }

  async function handleDonate() {
    if (!userId || !isActionIdValid) { setError('Utilisateur ou action non défini'); return }
    if (!isAmountValid) { setError('Montant invalide'); return }
    setSuccess('')
    try {
      const paymentRequest: PaymentRequest = {
        actionId: parsedActionId,
        donorUserId: userId,
        participantUserId: userId,
        amount: parsedAmount,
        message,
      }

      // Prefer redirecting to payment providers when selected
      if (paymentMethod === 'PAYPAL') {
        const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID
        if (!PAYPAL_CLIENT_ID) { setError('PayPal is not configured. Set VITE_PAYPAL_CLIENT_ID in frontend/.env'); return }
        localStorage.setItem(PENDING_DONATION_KEY, JSON.stringify(paymentRequest))
        const resp = await call<{ approveUrl: string }>('/payments/paypal/create-order', {
          method: 'POST', body: JSON.stringify(paymentRequest),
        })
        window.location.href = resp.approveUrl
        return
      }

      if (paymentMethod === 'STRIPE') {
        const resp = await call<{ checkoutUrl: string }>('/payments/stripe/create-checkout-session', {
          method: 'POST', body: JSON.stringify(paymentRequest),
        })
        window.location.href = resp.checkoutUrl
        return
      }

      if (paymentMethod === 'AUTOMATIC') {
        // Automatic payment: create a donation record and let backend handle scheduled/auto payments
        const resp = await call<ProviderResponse>('/donations', {
          method: 'POST', body: JSON.stringify({ ...paymentRequest, paymentMethod: 'AUTOMATIC' }),
        })
        setSuccess('Don programmé/automatique enregistré avec succès')
        setDonated(true)
        if (resp?.donation) onSuccess?.(resp.donation)
        return
      }

      // Fallback: quick-donate (no external provider)
      const resp = await call<ProviderResponse>('/donations', {
        method: 'POST',
        body: JSON.stringify(paymentRequest),
      })

      setSuccess('Don effectué avec succès (sans paiement en ligne)')
      if (resp?.donation) {
        onSuccess?.(resp.donation)
      }
      return
    } catch {
      // error set by useApi
    }
  }

  if (donated) {
    return (
      <div className="dp-wrap">
        <div className="dp-success-card">
          <div className="dp-success-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="currentColor" opacity=".12" />
              <path d="M12 20l6 6 10-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="dp-success-title">{success || t.donate}</h2>
          <p className="dp-success-sub">{t.thanksForGenerosity}</p>
          <button className="dp-btn-primary" onClick={() => { setDonated(false); setSuccess(''); setStep('amount') }}>
            Faire un autre don
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dp-wrap">
      {/* Background blobs */}
      <div className="dp-blob dp-blob-1" />
      <div className="dp-blob dp-blob-2" />

      <div className="dp-container">
        {/* Header */}
        <div className="dp-header">
          <div className="dp-header-badge">
            <span className="dp-heart-icon">♥</span>
            <span>Faire un don</span>
          </div>
          <h1 className="dp-title">{t.donate}</h1>
          <p className="dp-subtitle">{t.everyContributionCounts}</p>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} />}

        {/* Step pills */}
        <div className="dp-steps">
          {(['amount', 'details', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className={`dp-step ${step === s ? 'active' : STEPS.indexOf(step) > i ? 'done' : ''}`}>
              <div className="dp-step-dot">{STEPS.indexOf(step) > i ? '✓' : i + 1}</div>
              <span className="dp-step-label">
                {s === 'amount' ? 'Montant' : s === 'details' ? 'Détails' : 'Confirmer'}
              </span>
              {i < 2 && <div className="dp-step-line" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className={`dp-card dp-slide-${direction}`} key={step}>

          {/* ── STEP 1: Amount ── */}
          {step === 'amount' && (
            <div className="dp-section">
              <label className="dp-label">{t.charityAction}</label>
              <div className="dp-action-input-wrap">
                <span className="dp-input-prefix">#</span>
                <input
                  type="number"
                  className="dp-input dp-input-with-prefix"
                  value={actionIdInput}
                  onChange={(e) => setActionIdInput(e.target.value)}
                  placeholder="ID de l'action"
                />
              </div>
 
              <label className="dp-label dp-label-mt">{t.amount}</label>
              <div className="dp-presets">
                {PRESET_AMOUNTS.map(a => (
                  <button
                    key={a}
                    className={`dp-preset-btn ${!customAmount && amount === String(a) ? 'selected' : ''}`}
                    onClick={() => { setAmount(String(a)); setCustomAmount(false) }}
                  >
                    ${a}
                  </button>
                ))}
                <button
                  className={`dp-preset-btn dp-preset-custom ${customAmount ? 'selected' : ''}`}
                  onClick={() => setCustomAmount(true)}
                >
                  Autre
                </button>
              </div>

              {customAmount && (
                <div className="dp-custom-amount-wrap">
                  <span className="dp-currency-sym">$</span>
                  <input
                    type="number"
                    className="dp-input dp-input-currency"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    placeholder="Montant personnalisé"
                    autoFocus
                  />
                </div>
              )}

              <div className="dp-amount-preview">
                <span className="dp-preview-label">{t.yourDonation}</span>
                <span className="dp-preview-amount">${isAmountValid ? parsedAmount.toFixed(2) : '0.00'}</span>
              </div>

              <button
                className="dp-btn-primary dp-btn-full"
                disabled={!isActionIdValid || !isAmountValid}
                onClick={() => goTo('details')}
              >
                {t.continue} →
              </button>
            </div>
          )}

          {/* ── STEP 2: Details ── */}
          {step === 'details' && (
            <div className="dp-section">
              <label className="dp-label">{t.paymentMethod}</label>
              <div className="dp-pay-grid">
                <button
                  className={`dp-pay-btn ${paymentMethod === 'PAYPAL' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('PAYPAL')}
                >
                  <span className="dp-pay-logo">P</span>
                  <div>
                    <div className="dp-pay-name">PayPal</div>
                    <div className="dp-pay-sub">{t.securePayment}</div>
                  </div>
                </button>
                <button
                  className={`dp-pay-btn ${paymentMethod === 'STRIPE' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('STRIPE')}
                >
                  <span className="dp-pay-logo dp-pay-logo-stripe">S</span>
                  <div>
                    <div className="dp-pay-name">Stripe</div>
                    <div className="dp-pay-sub">{t.creditCard}</div>
                  </div>
                </button>
                <button
                  className={`dp-pay-btn ${paymentMethod === 'AUTOMATIC' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('AUTOMATIC')}
                >
                  <span className="dp-pay-logo">A</span>
                  <div>
                    <div className="dp-pay-name">{t.automatic}</div>
                    <div className="dp-pay-sub">{t.recurringPayment}</div>
                  </div>
                </button>
              </div>

              <label className="dp-label dp-label-mt">{t.message}</label>
              <textarea
                className="dp-textarea"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.messageOptional}
              />

              <div className="dp-nav-row">
                <button className="dp-btn-ghost" onClick={() => goTo('amount')}>← {t.back}</button>
                <button className="dp-btn-primary" onClick={() => goTo('confirm')}>{t.continue} →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 'confirm' && (
            <div className="dp-section">
              <div className="dp-summary">
                <div className="dp-summary-row">
                  <span>{t.charityAction}</span>
                  <span className="dp-summary-val">#{parsedActionId}</span>
                </div>
                <div className="dp-summary-row">
                  <span>{t.amount}</span>
                  <span className="dp-summary-val">${parsedAmount.toFixed(2)}</span>
                </div>
                <div className="dp-summary-row">
                  <span>Méthode</span>
                  <span className="dp-summary-val">{paymentMethod === 'PAYPAL' ? 'PayPal' : paymentMethod === 'STRIPE' ? 'Stripe' : 'Automatique'}</span>
                </div>
                {message.trim() && (
                  <div className="dp-summary-row dp-summary-msg">
                    <span>{t.message}</span>
                    <span className="dp-summary-val">{message}</span>
                  </div>
                )}
                <div className="dp-summary-total">
                  <span>{t.total}</span>
                  <span className="dp-total-amt">${parsedAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                className="dp-btn-donate"
                onClick={() => void handleDonate()}
                disabled={isLoading}
              >
                {isLoading
                  ? <span className="dp-spinner" />
                  : <>♥ {t.donate} ${parsedAmount.toFixed(2)}</>}
              </button>

              <div className="dp-nav-row" style={{ marginTop: '0.75rem' }}>
                <button className="dp-btn-ghost" onClick={() => goTo('details')}>← {t.back}</button>
              </div>

              <p className="dp-secure-note">🔒 Paiement 100% sécurisé via {paymentMethod === 'PAYPAL' ? 'PayPal' : paymentMethod === 'STRIPE' ? 'Stripe' : 'Automatique'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}