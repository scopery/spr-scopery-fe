'use client'

import { Ban, RefreshCw } from 'lucide-react'

import { toast } from 'sonner'
import { Badge, Button, Stack, Typography, PageSkeleton } from '@/shared/ui'
import { useAccountSessions } from '../hooks/useAccountSessions'

export function AccountSessionsView() {
  const { items, loading, actingId, refetch, revoke } = useAccountSessions()

  const handleRevoke = async (sessionId: string) => {
    try {
      await revoke(sessionId)
      toast.success('Session revoked')
    } catch (err) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <PageSkeleton variant="list" />
    )
  }

  return (
    <div className="border border-neutral-200 bg-white p-6">
      <Typography as="h2" size="lg" weight="bold" className="mb-1">
        Active sessions
      </Typography>
      <Typography as="p" variant="small" tone="muted" className="mb-6">
        Devices and browsers signed in to your account.
      </Typography>
      <div className="overflow-x-auto border border-neutral-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-3 py-2 font-medium">Device</th>
              <th className="px-3 py-2 font-medium">IP</th>
              <th className="px-3 py-2 font-medium">Last active</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="min-w-[12rem] whitespace-nowrap px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-neutral-100">
                <td className="px-3 py-2">
                  {item.deviceName ?? item.userAgent ?? 'Unknown device'}
                  {item.current ? (
                    <Badge tone="success" className="ml-2">
                      Current
                    </Badge>
                  ) : null}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{item.ipAddress ?? '—'}</td>
                <td className="px-3 py-2 text-neutral-600">{item.lastActiveAt ?? item.createdAt}</td>
                <td className="px-3 py-2">
                  <Badge
                    variant="solid"
                    tone={String(item.status).toUpperCase() === 'ACTIVE' ? 'success' : 'neutral'}
                  >
                    {String(item.status)
                      .replace(/_/g, ' ')
                      .toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <Button
                    variant="ghost"
                    disabled={item.current || actingId === item.id}
                    onClick={() => void handleRevoke(item.id)} icon={<Ban size={16} />}>
                    Revoke
                  </Button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-neutral-500">
                  No sessions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Stack direction="horizontal" spacing="sm" className="mt-4">
        <Button variant="neutral-flat" onClick={() => void refetch()} icon={<RefreshCw size={16} />}>
          Refresh
        </Button>
      </Stack>
    </div>
  )
}
