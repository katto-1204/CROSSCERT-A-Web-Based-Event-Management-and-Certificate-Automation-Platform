'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminTopbar } from '@/components/admin-topbar'
import { CrosscertLogo } from '@/components/crosscert-logo'
import { ensureCsrfToken } from '@/lib/api-config'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true
    const userRole = localStorage.getItem('userRole')
    if (userRole !== 'admin') {
      router.push('/auth/signin')
      return
    }
    ensureCsrfToken().catch(() => {})
  }, [router])

  // Render shell immediately — no blank flash
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64 w-full min-w-0">
        <AdminTopbar />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 max-w-full">
          {children}
        </main>
      </div>
      <CrosscertLogo />
    </div>
  )
}
