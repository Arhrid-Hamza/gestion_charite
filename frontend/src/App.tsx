import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type CharityAction = {
  id: number
  title: string
  description: string
  targetAmount: number
  collectedAmount: number
  status: string
  organizationName: string
  categoryName: string
  startDate: string
  endDate: string
}

type Donation = {
  id: number
  donorName: string
  donorEmail: string
  amount: number
  message: string
  actionId: number
  status: string
  createdAt: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

function App() {
  const [actions, setActions] = useState<CharityAction[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null)
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedAction = useMemo(
    () => actions.find((action) => action.id === selectedActionId) ?? null,
    [actions, selectedActionId],
  )

  async function fetchData() {
    setIsLoading(true)
    setError('')
    try {
      const [actionsResponse, donationsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/charity-actions`),
        fetch(`${API_BASE_URL}/donations`),
      ])

      if (!actionsResponse.ok || !donationsResponse.ok) {
        throw new Error('Failed to load data from backend API.')
      }

      const actionsData = (await actionsResponse.json()) as CharityAction[]
      const donationsData = (await donationsResponse.json()) as Donation[]

      setActions(actionsData)
      setDonations(donationsData)
      if (actionsData.length > 0) {
        setSelectedActionId((current) => current ?? actionsData[0].id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown API error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedActionId) {
      setError('Select a charity action before donating.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donorName,
          donorEmail,
          amount: Number(amount),
          message,
          actionId: selectedActionId,
        }),
      })

      if (!response.ok) {
        throw new Error('Donation failed. Check backend logs and try again.')
      }

      setDonorName('')
      setDonorEmail('')
      setAmount('')
      setMessage('')
      await fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown API error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Gestion Charite</p>
        <h1>Spring Boot + H2 + React TypeScript</h1>
        <p>
          Frontend and backend are in separate folders and linked through API endpoints under
          /api.
        </p>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="grid">
        <article className="panel">
          <h2>Active Charity Actions</h2>
          {isLoading ? (
            <p>Loading actions...</p>
          ) : (
            <ul className="action-list">
              {actions.map((action) => {
                const progress =
                  action.targetAmount > 0
                    ? Math.min((action.collectedAmount / action.targetAmount) * 100, 100)
                    : 0

                return (
                  <li
                    key={action.id}
                    className={selectedActionId === action.id ? 'selected' : ''}
                    onClick={() => setSelectedActionId(action.id)}
                  >
                    <div className="title-row">
                      <strong>{action.title}</strong>
                      <span>{action.categoryName}</span>
                    </div>
                    <p>{action.description}</p>
                    <small>{action.organizationName}</small>
                    <progress className="meter" value={progress} max={100} />
                    <div className="amounts">
                      <span>{action.collectedAmount.toFixed(2)} MAD</span>
                      <span>{action.targetAmount.toFixed(2)} MAD</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>Make a Donation</h2>
          <form onSubmit={handleSubmit} className="donation-form">
            <label>
              Charity Action
              <select
                value={selectedActionId ?? ''}
                onChange={(event) => setSelectedActionId(Number(event.target.value))}
                required
              >
                {actions.map((action) => (
                  <option key={action.id} value={action.id}>
                    {action.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Full Name
              <input
                value={donorName}
                onChange={(event) => setDonorName(event.target.value)}
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={donorEmail}
                onChange={(event) => setDonorEmail(event.target.value)}
              />
            </label>

            <label>
              Amount (MAD)
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </label>

            <label>
              Message
              <textarea
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>

            <button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Sending...' : 'Donate now'}
            </button>
          </form>

          {selectedAction && (
            <p className="hint">
              You are supporting: <strong>{selectedAction.title}</strong>
            </p>
          )}
        </article>
      </section>

      <section className="panel">
        <h2>Latest Donations</h2>
        {donations.length === 0 ? (
          <p>No donations yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Amount</th>
                <th>Action ID</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {donations
                .slice()
                .reverse()
                .slice(0, 8)
                .map((donation) => (
                  <tr key={donation.id}>
                    <td>{donation.donorName}</td>
                    <td>{Number(donation.amount).toFixed(2)} MAD</td>
                    <td>{donation.actionId}</td>
                    <td>{new Date(donation.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default App
