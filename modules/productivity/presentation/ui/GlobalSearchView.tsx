'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input, Skeleton, Stack, Typography } from '@/shared/ui'
import { useGlobalSearch } from '../hooks/useGlobalSearch'

export function GlobalSearchView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { items, loading, error, search } = useGlobalSearch(workspaceId)
  const [value, setValue] = useState('')

  return (
    <Stack direction="vertical" spacing="md" className="px-3 py-3 lg:px-4 lg:py-3">
      <Typography as="h1" size="md" weight="medium">
        Search
      </Typography>
      <Input
        fullWidth
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          void search(e.target.value)
        }}
        placeholder="Search documents, projects, requirements…"
        aria-label="Global search"
        prefix={<Search size={16} className="text-neutral-400" aria-hidden />}
      />
      {loading ? (
        <div
          className="space-y-3 border border-neutral-200 p-md"
          aria-busy="true"
          aria-label="Searching"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton variant="text" width="45%" height={14} />
              <Skeleton variant="text" width="30%" height={12} />
            </div>
          ))}
        </div>
      ) : null}
      {error ? <Typography tone="error">{error}</Typography> : null}
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {items.map((item) => (
          <li key={`${item.kind}:${item.id}`} className="p-md">
            {item.href ? (
              <Link href={item.href} className="hover:underline">
                <Typography variant="small" weight="medium">
                  {item.title}
                </Typography>
              </Link>
            ) : (
              <Typography variant="small" weight="medium">
                {item.title}
              </Typography>
            )}
            <Typography variant="caption" tone="muted">
              {[item.kind, item.subtitle].filter(Boolean).join(' · ')}
            </Typography>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
