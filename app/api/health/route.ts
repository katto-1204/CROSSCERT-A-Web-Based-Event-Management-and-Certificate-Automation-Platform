import { NextResponse } from 'next/server'

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_BASE_URL = rawApiUrl.startsWith('http') ? rawApiUrl : `https://${rawApiUrl}`

export async function GET() {
  const target = new URL('/api/health/', API_BASE_URL)

  try {
    const response = await fetch(target, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    })
    const contentType = response.headers.get('content-type') || 'application/json'
    const body = await response.text()

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'content-type': contentType,
        'cache-control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json(
      {
        status: 'offline',
        detail: 'Unable to reach the Django health endpoint.',
        endpoint: target.toString(),
      },
      {
        status: 503,
        headers: {
          'cache-control': 'no-store',
        },
      },
    )
  }
}
