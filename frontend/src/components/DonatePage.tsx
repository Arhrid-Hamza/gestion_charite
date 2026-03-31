import { useApi } from '../hooks/useApi'
import { I18N } from '../types/i18n'
import { Alert } from './Header'
import type { Locale, CharityAction, Donation, PaymentMethod } from '../types'
import '../styles/DonatePage.css'
import { useState } from 'react'

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

  const [actionId, setActionId] = useState(selectedAction?.id || 0)
  const [amount, setAmount] = useState('50')
  const [message, setMessage] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('STRIPE')
  const [success, setSuccess] = useState('')

  async function handleDonate() {
    if (!userId || !actionId) {
      setError('Utilisateur ou action non défini')
      return
    }

    setSuccess('')

    try {
      const payload = await call<Donation>('/donations', {
        method: 'POST',
        body: JSON.stringify({
          charityActionId: actionId,
          donorUserId: userId,
          amount: parseFloat(amount),
          message,
          paymentMethod: paymentMethod as PaymentMethod,
          transactionId: `TXN-${Date.now()}`,
          status: 'COMPLETED',
        }),
      })

      setSuccess('Don effectué avec succès!')
      setAmount('50')
      setMessage('')
      onSuccess?.(payload)
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
                  value={actionId}
                  onChange={(e) => setActionId(parseInt(e.target.value))}
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
                  <option value="STRIPE">Stripe</option>
                  <option value="PAYPAL">PayPal</option>
                </select>
              </div>

              <button
                onClick={() => void handleDonate()}
                disabled={isLoading || !actionId}
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
