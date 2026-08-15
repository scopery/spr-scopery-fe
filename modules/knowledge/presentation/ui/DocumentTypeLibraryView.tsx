'use client'

import { PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useDocumentTypes } from '../hooks/useDocumentTypes'

export function DocumentTypeLibraryView() {
  const { items, loading, error } = useDocumentTypes()

  if (loading) return <PageSkeleton variant="list" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="sm">
      <Typography as="h1" size="md" weight="medium">
        Document Type Library
      </Typography>
      {items.length === 0 ? (
        <Typography tone="muted">No document types yet.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="p-md">
              <Typography variant="small" weight="medium">
                {item.name}
              </Typography>
              <Typography variant="caption" tone="muted">
                {[item.code, item.status].filter(Boolean).join(' · ')}
              </Typography>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
