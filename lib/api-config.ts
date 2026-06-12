/**
 * API Configuration for CROSSCERT
 * Uses dashes (kebab-case) for all route names
 */

import {
  createUnavailableResponse,
  isBackendUnavailableResponse,
  reportBackendReachable,
  reportBackendUnreachable,
} from './backend-status'

// Base API URL - can be configured via environment variable
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_BASE_URL = rawApiUrl.startsWith('http') ? rawApiUrl : `https://${rawApiUrl}`

/**
 * API Route paths using dashes (kebab-case)
 */
export const API_ROUTES = {
  // Authentication endpoints
  auth: {
    login: '/api/auth/login/',
    logout: '/api/auth/logout/',
    csrfToken: '/api/auth/csrf-token/',
    me: '/api/auth/me/',
    forgotPassword: '/api/auth/forgot-password/',
    verifyOtp: '/api/auth/verify-otp/',
    resetPassword: '/api/auth/reset-password/',
  },

  health: '/api/health/',

  // General API routes
  events: '/api/events',
  registrations: '/api/registrations',
  checkIns: '/api/check-ins',
  evaluations: '/api/evaluations',
  certificates: '/api/certificates',
  notifications: '/api/notifications',
  bookmarks: '/api/bookmarks',

  // Admin API routes (using dashes)
  admin: {
    events: '/api/admin/events',
    participants: '/api/admin/participants',
    checkIns: '/api/admin/check-ins',
    evaluations: '/api/admin/evaluations',
    certificates: '/api/admin/certificates',
  },
} as const

/**
 * Get full API URL for a route
 */
export function getApiUrl(route: string): string {
  return `${API_BASE_URL}${route}`
}

/** Human-readable message for failed API responses (including synthetic offline responses). */
export async function getApiErrorMessage(
  response: Response,
  fallback = 'Request failed',
): Promise<string> {
  if (isBackendUnavailableResponse(response)) {
    return 'Backend is unavailable. Please start the server or retry in a moment.'
  }

  try {
    const data = await response.clone().json()
    if (typeof data?.error === 'string') return data.error
    if (typeof data?.detail === 'string') return data.detail
  } catch {
    // ignore parse errors
  }

  return `${fallback} (Status: ${response.status})`
}

export { isBackendUnavailableResponse } from './backend-status'

/**
 * Admin API helper functions
 */
export const adminApi = {
  events: () => {
    const url = getApiUrl(API_ROUTES.admin.events)
    return url.endsWith('/') ? url : `${url}/`
  },
  participants: () => {
    const url = getApiUrl(API_ROUTES.admin.participants)
    return url.endsWith('/') ? url : `${url}/`
  },
  checkIns: () => {
    const url = getApiUrl(API_ROUTES.admin.checkIns)
    return url.endsWith('/') ? url : `${url}/`
  },
  evaluations: () => {
    const url = getApiUrl(API_ROUTES.admin.evaluations)
    return url.endsWith('/') ? url : `${url}/`
  },
  certificates: () => {
    const url = getApiUrl(API_ROUTES.admin.certificates)
    return url.endsWith('/') ? url : `${url}/`
  },

  certificatePreviewSample: () => `${adminApi.certificates()}preview-sample/`,

  // Helper to get a specific event by ID
  eventById: (id: string | number) => `${getApiUrl(API_ROUTES.admin.events)}/${id}/`,

  // Helper to get a specific participant by ID
  participantById: (id: string | number) => `${getApiUrl(API_ROUTES.admin.participants)}/${id}/`,

  // Helper to get check-ins for an event
  checkInsByEvent: (eventId: string | number) => `${getApiUrl(API_ROUTES.admin.checkIns)}/?event=${eventId}`,
}

/**
 * General API helper functions
 */
export const api = {
  events: () => {
    const url = getApiUrl(API_ROUTES.events)
    return url.endsWith('/') ? url : `${url}/`
  },
  registrations: () => {
    const url = getApiUrl(API_ROUTES.registrations)
    return url.endsWith('/') ? url : `${url}/`
  },
  checkIns: () => {
    const url = getApiUrl(API_ROUTES.checkIns)
    return url.endsWith('/') ? url : `${url}/`
  },
  evaluations: () => {
    const url = getApiUrl(API_ROUTES.evaluations)
    return url.endsWith('/') ? url : `${url}/`
  },
  certificates: () => {
    const url = getApiUrl(API_ROUTES.certificates)
    return url.endsWith('/') ? url : `${url}/`
  },
  participants: () => {
    const url = getApiUrl('/api/participants')
    return url.endsWith('/') ? url : `${url}/`
  },
  notifications: () => {
    const url = getApiUrl(API_ROUTES.notifications)
    return url.endsWith('/') ? url : `${url}/`
  },
  bookmarks: () => {
    const url = getApiUrl(API_ROUTES.bookmarks)
    return url.endsWith('/') ? url : `${url}/`
  },
  notificationById: (id: string | number) => {
    return `${api.notifications()}${id}/`
  },
  notificationMarkRead: (id: string | number) => {
    return `${api.notifications()}${id}/mark_as_read/`
  },
  notificationMarkAllRead: () => {
    return `${api.notifications()}mark_all_as_read/`
  },

  // Helper for participant registration
  participantRegister: () => {
    const baseUrl = api.participants()
    return baseUrl.endsWith('/') ? `${baseUrl}register/` : `${baseUrl}/register/`
  },

  // Helper to get a specific resource by ID
  eventById: (id: string | number) => `${getApiUrl(API_ROUTES.events)}/${id}/`,
  registrationById: (id: string | number) => `${getApiUrl(API_ROUTES.registrations)}/${id}/`,
  certificateById: (id: string | number) => `${getApiUrl(API_ROUTES.certificates)}/${id}/`,
}

/**
 * Authentication API helpers
 */
export const authApi = {
  login: () => getApiUrl(API_ROUTES.auth.login),
  logout: () => getApiUrl(API_ROUTES.auth.logout),
  csrfToken: () => getApiUrl(API_ROUTES.auth.csrfToken),
  me: () => getApiUrl(API_ROUTES.auth.me),
  forgotPassword: () => getApiUrl(API_ROUTES.auth.forgotPassword),
  verifyOtp: () => getApiUrl(API_ROUTES.auth.verifyOtp),
  resetPassword: () => getApiUrl(API_ROUTES.auth.resetPassword),
}

/**
 * Get CSRF token from cookies or localStorage
 */
export function getCsrfToken(): string {
  if (typeof document === 'undefined') return ''

  // 1. Try to get token from localStorage (useful for cross-domain requests where document.cookie is inaccessible)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('csrfToken')
    if (token) return token
  }

  // 2. Fall back to document.cookie
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrftoken') {
      return decodeURIComponent(value)
    }
  }
  return ''
}

/**
 * Fetch and persist a fresh CSRF token from the backend.
 */
export async function ensureCsrfToken(): Promise<string> {
  const existing = getCsrfToken()
  if (existing) return existing

  const csrfUrl = getApiUrl(API_ROUTES.auth.csrfToken)
  let csrfResp: Response
  try {
    csrfResp = await fetch(csrfUrl, { credentials: 'include' })
  } catch {
    reportBackendUnreachable()
    throw new Error('Backend unavailable')
  }

  if (!csrfResp.ok) {
    throw new Error(`Failed to fetch CSRF token (${csrfResp.status})`)
  }

  const csrfData = await csrfResp.json()
  if (!csrfData?.csrf_token) {
    throw new Error('CSRF token missing from server response')
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('csrfToken', csrfData.csrf_token)
  }

  return csrfData.csrf_token
}

/**
 * Make an authenticated API request with CSRF token
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  retryOnCsrf = true
): Promise<Response> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(typeof options.headers === 'object' ? (options.headers as Record<string, string>) : {}),
  }

  const method = (options.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      const csrfToken = await ensureCsrfToken()
      headers['X-CSRFToken'] = csrfToken
    } catch (err) {
      console.error('[API] Failed to ensure CSRF token:', err)
    }
  }

  // Add Content-Type if not already set and there's a body
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })
    reportBackendReachable(response.status)
  } catch {
    reportBackendUnreachable()
    return createUnavailableResponse()
  }

  // Retry once with a fresh token if Django middleware still rejects CSRF
  if (
    retryOnCsrf &&
    response.status === 403 &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  ) {
    try {
      const errorBody = await response.clone().json()
      const detail = String(errorBody?.detail || '')
      if (detail.toLowerCase().includes('csrf')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('csrfToken')
        }
        const freshToken = await ensureCsrfToken()
        headers['X-CSRFToken'] = freshToken
        return apiRequest(url, { ...options, headers }, false)
      }
    } catch {
      // fall through to original response
    }
  }

  // Automatically intercept and store any csrf_token returned in JSON responses
  try {
    const clone = response.clone()
    const contentType = clone.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      clone.json().then(data => {
        if (data && data.csrf_token && typeof window !== 'undefined') {
          localStorage.setItem('csrfToken', data.csrf_token)
        }
      }).catch(() => {})
    }
  } catch {
    // Ignore cloning errors
  }

  return response
}

/**
 * Convenience methods using apiRequest
 */
export const apiCall = {
  get: (url: string) => apiRequest(url, { method: 'GET' }),
  post: (url: string, data?: any) => apiRequest(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url: string, data?: any) => apiRequest(url, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (url: string, data?: any) => apiRequest(url, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (url: string) => apiRequest(url, { method: 'DELETE' }),
}

/**
 * Get authenticated user's email from API session
 * This is more secure than using localStorage
 */
export async function getAuthenticatedUserEmail(): Promise<string | null> {
  try {
    const response = await apiRequest(authApi.me(), { method: 'GET' })
    if (response.ok) {
      const data = await response.json()
      if (data.authenticated && data.user && data.user.email) {
        return data.user.email
      }
    }
  } catch (err) {
    console.error('[API] Error fetching authenticated user email:', err)
  }
  return null
}

