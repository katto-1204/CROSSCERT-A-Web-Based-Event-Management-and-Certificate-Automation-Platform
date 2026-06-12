export type BackendStatus = 'online' | 'offline' | 'degraded' | 'checking'

type StatusListener = (status: BackendStatus, previous: BackendStatus) => void

let currentStatus: BackendStatus = 'checking'
const listeners = new Set<StatusListener>()

export function getBackendStatus(): BackendStatus {
  return currentStatus
}

export function subscribeBackendStatus(listener: StatusListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify(previous: BackendStatus) {
  listeners.forEach((listener) => listener(currentStatus, previous))
}

export function setBackendStatus(next: BackendStatus) {
  if (next === currentStatus) return
  const previous = currentStatus
  currentStatus = next
  notify(previous)
}

/** Any HTTP response from the server means it is reachable. */
export function classifyResponseStatus(status: number): BackendStatus {
  if (status === 502 || status === 503 || status === 504) return 'degraded'
  return 'online'
}

export function reportBackendReachable(status = 200) {
  setBackendStatus(classifyResponseStatus(status))
}

export function reportBackendUnreachable() {
  if (currentStatus === 'offline') return
  setBackendStatus('offline')
}

export function isBackendIssueStatus(status: BackendStatus) {
  return status === 'offline' || status === 'degraded'
}

export const BACKEND_UNAVAILABLE_STATUS = 503

export function createUnavailableResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Backend unavailable',
      detail: 'Unable to reach the CROSSCERT API. The server may be offline or restarting.',
    }),
    {
      status: BACKEND_UNAVAILABLE_STATUS,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

export function isBackendUnavailableResponse(response: Response): boolean {
  return response.status === BACKEND_UNAVAILABLE_STATUS
}
