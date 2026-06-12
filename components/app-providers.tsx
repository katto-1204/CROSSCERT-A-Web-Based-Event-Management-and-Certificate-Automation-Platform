'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { BackendStatusMonitor } from '@/components/backend-status-monitor'
import { Toaster } from '@/components/ui/toaster'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
      <Toaster />
      <BackendStatusMonitor />
    </ThemeProvider>
  )
}
