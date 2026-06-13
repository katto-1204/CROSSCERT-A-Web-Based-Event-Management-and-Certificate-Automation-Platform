'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, AlertTriangle, RefreshCw, ServerCrash, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { getApiUrl } from '@/lib/api-config'
import {
  getBackendStatus,
  isBackendIssueStatus,
  reportBackendReachable,
  reportBackendUnreachable,
  setBackendStatus,
  subscribeBackendStatus,
  type BackendStatus,
} from '@/lib/backend-status'

const HEALTH_URL = getApiUrl('/api/health/')
const SAME_ORIGIN_HEALTH_URL = '/api/health'
const CHECK_INTERVAL_MS = 20_000
const CHECK_TIMEOUT_MS = 8_000

async function pingBackend(): Promise<BackendStatus> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)

  try {
    const response = await fetch(SAME_ORIGIN_HEALTH_URL, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'omit',
    })
    window.clearTimeout(timeout)
    if (response.ok) return 'online'
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      return 'degraded'
    }
    return 'online'
  } catch {
    window.clearTimeout(timeout)
    return 'offline'
  }
}

function statusCopy(status: BackendStatus) {
  if (status === 'degraded') {
    return {
      title: 'Backend is experiencing issues',
      description:
        'The server responded, but it may be restarting or overloaded. Some actions might fail until it stabilizes.',
      detail: 'Service responded with an unhealthy status. Retry after the server finishes restarting.',
      icon: AlertTriangle,
    }
  }

  return {
    title: 'Backend unavailable',
    description:
      'We cannot reach the CROSSCERT API right now. Start the Django server or check your connection, then retry.',
    detail: 'Requests are temporarily paused to prevent repeated failed actions.',
    icon: ServerCrash,
  }
}

export function BackendStatusMonitor() {
  const [status, setStatus] = useState<BackendStatus>(() => getBackendStatus())
  const [modalOpen, setModalOpen] = useState(false)
  const [checking, setChecking] = useState(false)

  const runHealthCheck = useCallback(async (manual = false) => {
    if (manual) setChecking(true)
    const result = await pingBackend()
    if (result === 'online') {
      reportBackendReachable()
    } else if (result === 'degraded') {
      setBackendStatus('degraded')
    } else {
      reportBackendUnreachable()
    }
    if (manual) setChecking(false)
    return result
  }, [])

  useEffect(() => {
    void runHealthCheck()

    const interval = window.setInterval(() => {
      void runHealthCheck()
    }, CHECK_INTERVAL_MS)

    const handleOnline = () => void runHealthCheck(true)
    const handleOffline = () => reportBackendUnreachable()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [runHealthCheck])

  useEffect(() => {
    return subscribeBackendStatus((next, prev) => {
      setStatus(next)

      const wasHealthy = !isBackendIssueStatus(prev)
      const isHealthy = !isBackendIssueStatus(next)

      if (isBackendIssueStatus(next) && wasHealthy) {
        setModalOpen(true)
        const copy = statusCopy(next)
        toast({
          variant: 'destructive',
          title: next === 'degraded' ? 'Service disruption detected' : 'Backend connection lost',
          description: copy.description,
          className:
            'border-red-200 bg-red-50 text-red-950 dark:border-red-900/50 dark:bg-red-950/90 dark:text-red-50',
        })
      }

      if (isHealthy && isBackendIssueStatus(prev)) {
        setModalOpen(false)
        toast({
          title: 'Backend connection restored',
          description: 'You can continue using CROSSCERT normally.',
          className:
            'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/90 dark:text-emerald-50',
        })
      }
    })
  }, [])

  useEffect(() => {
    if (isBackendIssueStatus(status)) {
      setModalOpen(true)
    }
  }, [status])

  const copy = statusCopy(status)
  const StatusIcon = copy.icon
  const isDegraded = status === 'degraded'
  const statusPalette = isDegraded
    ? {
        icon: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        panel: 'bg-gradient-to-br from-amber-50 to-background dark:from-amber-950/30',
        accent: 'bg-amber-500',
        glow: 'bg-amber-500/10',
        illustration: 'text-amber-600',
      }
    : {
        icon: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
        badge: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
        panel: 'bg-gradient-to-br from-red-50 to-background dark:from-red-950/30',
        accent: 'bg-red-500',
        glow: 'bg-red-500/10',
        illustration: 'text-red-600',
      }

  return (
    <Dialog open={modalOpen && isBackendIssueStatus(status)} onOpenChange={setModalOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[620px] overflow-y-auto border-border/70 bg-background/95 p-0 shadow-2xl shadow-black/20 backdrop-blur-xl duration-300 sm:rounded-2xl"
      >
        <div className="grid gap-0 sm:grid-cols-[1fr_180px]">
          <section className="flex min-w-0 flex-col gap-6 p-6 sm:p-8">
            <DialogHeader className="space-y-0 text-left">
              <div className="flex min-w-0 items-start gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${statusPalette.icon}`}>
                  <StatusIcon className="h-7 w-7" aria-hidden="true" />
                </div>
                <div className="min-w-0 space-y-2 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <DialogTitle className="font-[family-name:var(--font-display)] text-2xl leading-tight tracking-tight">
                      {copy.title}
                    </DialogTitle>
                    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusPalette.badge}`}>
                      {status}
                    </span>
                  </div>
                  <DialogDescription className="max-w-prose text-sm leading-6 text-muted-foreground">
                    {copy.description}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-semibold text-foreground">Primary API endpoint</p>
                    <p className="break-all font-mono text-xs leading-5 text-muted-foreground">{HEALTH_URL}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/80 p-4">
                <div className="flex items-start gap-3">
                  <Activity className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Current status</p>
                    <p className="text-xs leading-5 text-muted-foreground">{copy.detail}</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center"
                onClick={() => setModalOpen(false)}
              >
                Continue offline
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Refresh
              </Button>
              <Button
                type="button"
                className="w-full justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={checking}
                onClick={() => void runHealthCheck(true)}
              >
                <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} aria-hidden="true" />
                {checking ? 'Checking...' : 'Retry'}
              </Button>
            </DialogFooter>
          </section>

          <aside
            className={`relative hidden overflow-hidden border-l border-border/60 p-6 sm:flex sm:items-center sm:justify-center ${statusPalette.panel}`}
            aria-hidden="true"
          >
            <div className="relative flex h-32 w-32 items-center justify-center rounded-[2rem] border border-white/60 bg-background/80 shadow-xl shadow-black/10 backdrop-blur">
              <div className={`absolute inset-4 rounded-[1.5rem] ${statusPalette.glow}`} />
              <StatusIcon className={`relative h-14 w-14 ${statusPalette.illustration}`} />
              <span className="absolute right-7 top-7 flex h-4 w-4">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusPalette.accent} opacity-60`} />
                <span className={`relative inline-flex h-4 w-4 rounded-full ${statusPalette.accent}`} />
              </span>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}
