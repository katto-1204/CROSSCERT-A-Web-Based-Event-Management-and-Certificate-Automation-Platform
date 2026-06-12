'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy route — redirects to admin dashboard */
export default function LegacyDashboardRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/dashboard') }, [router])
  return null
}
