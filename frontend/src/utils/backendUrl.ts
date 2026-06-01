const DEFAULT_API_BASE_URL = 'http://localhost:8080/api'

export function normalizeApiBaseUrl(rawValue: string | undefined) {
  const base = (rawValue?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
  return /\/api$/i.test(base) ? base : `${base}/api`
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)

export function getBackendOrigin() {
  return API_BASE_URL.replace(/\/api$/i, '')
}