import { useState, useCallback } from 'react'

function normalizeApiBaseUrl(rawValue: string | undefined) {
  const base = (rawValue ?? 'http://localhost:8080/api').trim().replace(/\/+$/, '')
  return /\/api$/i.test(base) ? base : `${base}/api`
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)

export function useApi() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const call = useCallback(
    async function <T>(
      path: string,
      init?: RequestInit,
    ): Promise<T> {
      setError('')
      setIsLoading(true)

      try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
          },
          ...init,
        })

        const text = await response.text()
        let body: unknown = null
        if (text) {
          try {
            body = JSON.parse(text) as unknown
          } catch {
            body = text
          }
        }

        if (!response.ok) {
          const message =
            typeof body === 'string'
              ? body
              : body && typeof body === 'object' && 'error' in body
                ? String((body as { error: unknown }).error)
                : `HTTP ${response.status}`
          throw new Error(message)
        }

        return body as T
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur inconnue'
        setError(msg)
        throw e
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  return { call, error, isLoading, setError }
}
