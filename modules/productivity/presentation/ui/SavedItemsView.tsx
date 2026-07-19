'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  PageSkeleton,
  Stack,
  Typography
} from '@/shared/ui'
import { useSavedItems } from '../hooks/useSavedItems'

export function SavedItemsView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    favorites,
    recent,
    savedViews,
    savedSearches,
    pins,
    navPrefs,
    loading,
    error,
  } = useSavedItems(workspaceId)

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="lg" className="p-lg">
      <Typography variant="h2">Saved Items</Typography>

      <section>
        <Typography variant="h4" className="mb-sm">
          Favorites
        </Typography>
        {favorites.length === 0 ? (
          <Typography tone="muted">No favorites yet.</Typography>
        ) : (
          <ul className="space-y-xs">
            {favorites.map((f) => (
              <li key={f.id}>
                {f.href ? (
                  <Link href={f.href} className="text-sm hover:underline">
                    {f.title}
                  </Link>
                ) : (
                  <Typography variant="small">{f.title}</Typography>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <Typography variant="h4" className="mb-sm">
          Recent
        </Typography>
        {recent.length === 0 ? (
          <Typography tone="muted">No recent items.</Typography>
        ) : (
          <ul className="space-y-xs">
            {recent.map((r) => (
              <li key={r.id}>
                {r.href ? (
                  <Link href={r.href} className="text-sm hover:underline">
                    {r.title}
                  </Link>
                ) : (
                  <Typography variant="small">{r.title}</Typography>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <Typography variant="h4" className="mb-sm">
          Saved views
        </Typography>
        {savedViews.length === 0 ? (
          <Typography tone="muted">No saved views.</Typography>
        ) : (
          <ul className="space-y-xs">
            {savedViews.map((v) => (
              <li key={v.id}>
                <Typography variant="small">{v.name}</Typography>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <Typography variant="h4" className="mb-sm">
          Saved searches
        </Typography>
        {savedSearches.length === 0 ? (
          <Typography tone="muted">No saved searches.</Typography>
        ) : (
          <ul className="space-y-xs">
            {savedSearches.map((s) => (
              <li key={s.id}>
                <Typography variant="small">
                  {[s.name, s.query].filter(Boolean).join(' · ')}
                </Typography>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <Typography variant="h4" className="mb-sm">
          Pins
        </Typography>
        {pins.length === 0 ? (
          <Typography tone="muted">No pins.</Typography>
        ) : (
          <ul className="space-y-xs">
            {pins.map((p) => (
              <li key={p.id}>
                <Typography variant="small">{p.title ?? p.id}</Typography>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <Typography variant="h4" className="mb-sm">
          Navigation preferences
        </Typography>
        <Typography variant="caption" tone="muted">
          {navPrefs ? `${Object.keys(navPrefs).length} preference keys` : 'No preferences'}
        </Typography>
      </section>
    </Stack>
  )
}
