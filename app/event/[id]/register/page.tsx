'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

/** Legacy route — redirects to participant event registration */
export default function LegacyRegisterRedirect() {
  const router = useRouter()
  const params = useParams()
  useEffect(() => {
    router.replace(`/participant/event/${params.id}`)
  }, [router, params.id])
  return null
}
