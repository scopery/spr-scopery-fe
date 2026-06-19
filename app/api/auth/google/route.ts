import { NextRequest, NextResponse } from 'next/server'

function getBackendBase(): string {
  return (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export async function GET(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get('redirectTo')
  const state = request.nextUrl.searchParams.get('state')
  const backendUrl = new URL('/api/v2/auth/google', getBackendBase())

  if (redirectTo) backendUrl.searchParams.set('redirectTo', redirectTo)
  if (state) backendUrl.searchParams.set('state', state)

  const res = await fetch(backendUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  const body = await res.text()
  const headers = new Headers(res.headers)
  headers.delete('content-encoding')
  headers.delete('content-length')
  headers.delete('transfer-encoding')

  return new NextResponse(body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  })
}
