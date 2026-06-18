import { NextResponse } from 'next/server'

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('scopery_token', '', { maxAge: 0, path: '/' })
  return res
}
