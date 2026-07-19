import { NextResponse } from 'next/server'

const SESSION_COOKIE = 'scopery_session'
const TOKEN_COOKIE = 'scopery_token'

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(TOKEN_COOKIE, '', { maxAge: 0, path: '/' })
  res.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
  return res
}
