'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, ServerCrash, WifiOff } from 'lucide-react'
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
const CHECK_INTERVAL_MS = 20_000
const CHECK_TIMEOUT_MS = 8_000

async function pingBackend(): Promise<BackendStatus> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)

  try {
    const response = await fetch(HEALTH_URL, {
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
      icon: AlertTriangle,
    }
  }
  return {
    title: 'Backend unavailable',
    description:
      'We cannot reach the CROSSCERT API right now. Start the Django server or check your connection, then retry.',
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

  return (
    <Dialog open={modalOpen && isBackendIssueStatus(status)} onOpenChange={setModalOpen}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-red-200/60 bg-gradient-to-b from-background to-red-50/30 p-0 dark:border-red-900/40 dark:to-red-950/20 sm:max-w-md"
      >
        <div className="relative px-6 pt-8 pb-2">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
          <DialogHeader className="space-y-4 text-left">
            <div className="flex items-start gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                <StatusIcon className="h-7 w-7" />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
                </span>
              </div>
              <div className="space-y-2 pt-1">
                <DialogTitle className="font-[family-name:var(--font-display)] text-xl tracking-tight">
                  {copy.title}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed">
                  {copy.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-5 rounded-xl border border-border/70 bg-card/80 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-sm">
              <WifiOff className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">API endpoint</p>
                <p className="truncate text-xs text-muted-foreground">{HEALTH_URL}</p>
              </div>
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700 dark:bg-red-950 dark:text-red-300">
                {status}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 bg-muted/20 px-6 py-4 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setModalOpen(false)}
          >
            Continue offline
          </Button>
          <Button
            type="button"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={checking}
            onClick={() => void runHealthCheck(true)}
          >
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking…' : 'Retry connection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
