'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy route — redirects to participant my-events */
export default function LegacyMyEventsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/participant/my-events') }, [router])
  return null
}
