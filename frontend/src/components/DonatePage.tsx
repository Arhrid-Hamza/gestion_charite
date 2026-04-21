import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import { Alert } from './Header'
import type { Locale, CharityAction, Donation, PaymentMethod } from '../types'
import '../styles/DonatePage.css'
import { useEffect, useState } from 'react'

const PENDING_DONATION_KEY = 'pendingDonationPayment'
const PAYPAL_CLIENT_ID = String(import.meta.env.VITE_PAYPAL_CLIENT_ID ?? '').trim()

interface PaymentRequest {
  actionId: number
  donorUserId: number
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

export function DonatePage({
  locale,
  userId,
  selectedAction,
  onSuccess,
}: DonatePageProps) {
  const t = I18N[locale]
  const { call, error, isLoading, setError } = useApi()

  const [actionIdInput, setActionIdInput] = useState(selectedAction?.id ? String(selectedAction.id) : '')
  const [amount, setAmount] = useState('50')
  const [message, setMessage] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PAYPAL')
  const [success, setSuccess] = useState('')
  const parsedActionId = Number.parseInt(actionIdInput, 10)
  const isActionIdValid = Number.isInteger(parsedActionId) && parsedActionId > 0

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentState = params.get('payment')

    if (!paymentState) {
      return
    }

    async function finalizePayment() {
      try {
        if (paymentState === 'paypal-success') {
          const orderId = params.get('token')
          const rawPendingDonation = localStorage.getItem(PENDING_DONATION_KEY)
          if (!orderId || !rawPendingDonation) {
            setError('Paiement PayPal invalide ou expiré')
            return
          }

          const pendingDonation = JSON.parse(rawPendingDonation) as PaymentRequest
          const response = await call<ProviderResponse>(`/payments/paypal/capture/${orderId}`, {
            method: 'POST',
            body: JSON.stringify(pendingDonation),
          })

          localStorage.removeItem(PENDING_DONATION_KEY)
          setSuccess('Don PayPal confirmé avec succès!')
          if (response.donation) {
            onSuccess?.(response.donation)
          }
          return
        }

        if (paymentState === 'stripe-success') {
          const sessionId = params.get('session_id')
          if (!sessionId) {
            setError('Session Stripe manquante')
            return
          }

          const response = await call<ProviderResponse>(`/payments/stripe/confirm-session?sessionId=${encodeURIComponent(sessionId)}`, {
            method: 'POST',
          })

          setSuccess('Don Stripe confirmé avec succès!')
          if (response.donation) {
            onSuccess?.(response.donation)
          }
          return
        }

        if (paymentState === 'paypal-cancel' || paymentState === 'stripe-cancel') {
          setError('Paiement annulé')
          return
        }
      } catch {
        // Erreur déjà définie par useApi
      } finally {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }

    void finalizePayment()
  }, [call, onSuccess, setError])

  async function handleDonate() {
    if (!userId || !isActionIdValid) {
      setError('Utilisateur ou action non défini')
      return
    }

    setSuccess('')

    try {
      const parsedAmount = parseFloat(amount)
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Montant invalide')
        return
      }

      const paymentRequest: PaymentRequest = {
        actionId: parsedActionId,
        donorUserId: userId,
        amount: parsedAmount,
        message,
      }

      if (paymentMethod === 'PAYPAL') {
        if (!PAYPAL_CLIENT_ID) {
          setError('PayPal is not configured on frontend. Set VITE_PAYPAL_CLIENT_ID in frontend/.env')
          return
        }

        localStorage.setItem(PENDING_DONATION_KEY, JSON.stringify(paymentRequest))
        const response = await call<{ approveUrl: string }>('/payments/paypal/create-order', {
          method: 'POST',
          body: JSON.stringify(paymentRequest),
        })

        window.location.href = response.approveUrl
        return
      }

      const response = await call<{ checkoutUrl: string }>('/payments/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify(paymentRequest),
      })

      window.location.href = response.checkoutUrl
    } catch {
      // Erreur déjà définie
    }
  }

  return (
    <div className="donate-page py-5">
      <div className="container">
        <div className="row justify-content-md-center">
          <div className="col-md-6">
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} />}

            <div className="donate-card">
              <h2 className="donate-title">{t.donate}</h2>

              <div className="mb-3">
                <label htmlFor="action-id" className="form-label">{t.charityAction}</label>
                <input
                  id="action-id"
                  type="number"
                  className="form-control"
                  value={actionIdInput}
                  onChange={(e) => setActionIdInput(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="amount" className="form-label">{t.amount}</label>
                <input
                  id="amount"
                  type="number"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  step="10"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="message" className="form-label">{t.message}</label>
                <textarea
                  id="message"
                  className="form-control"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.messageOptional}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="payment-method" className="form-label">{t.paymentMethod}</label>
                <select
                  id="payment-method"
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  <option value="PAYPAL">PayPal</option>
                  <option value="STRIPE">Stripe</option>
                </select>
              </div>

              <button
                onClick={() => void handleDonate()}
                disabled={isLoading || !isActionIdValid}
                className="btn btn-success btn-lg w-100"
              >
                {isLoading ? `${t.processing}...` : `${t.donate} $${amount}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
