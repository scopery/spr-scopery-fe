'use client'

import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

export type FunctionalCatalogSection =
  | 'overview'
  | 'mapping'
  | 'coverage'
  | 'unlinked'
  | 'catalogFr'
  | 'catalogNfr'
  | 'toolsImport'

interface NavItem {
  id: FunctionalCatalogSection
  label: string
  count?: number
}

interface FunctionalCatalogNavProps {
  active: FunctionalCatalogSection
  onSelect: (section: FunctionalCatalogSection) => void
  counts: {
    fr: number
    nfr: number
    unanchoredFr: number
  }
}

function NavGroup({
  title,
  items,
  active,
  onSelect,
}: {
  title: string
  items: NavItem[]
  active: FunctionalCatalogSection
  onSelect: (section: FunctionalCatalogSection) => void
}) {
  return (
    <div className="mb-md">
      <Typography
        variant="caption"
        weight="medium"
        tone="muted"
        className="mb-xs block px-sm uppercase tracking-wide"
      >
        {title}
      </Typography>
      <ul className="space-y-xs">
        {items.map((item) => {
          const isActive = active === item.id
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  'flex w-full items-center justify-between px-sm py-xs text-left text-sm',
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-800 hover:bg-neutral-100'
                )}
              >
                <span>{item.label}</span>
                {typeof item.count === 'number' ? (
                  <span className={cn('text-xs', isActive ? 'text-neutral-300' : 'text-neutral-500')}>
                    {item.count}
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function FunctionalCatalogNav({
  active,
  onSelect,
  counts,
}: FunctionalCatalogNavProps) {
  return (
    <nav aria-label="Functional catalog" className="h-full overflow-auto p-sm">
      <NavGroup
        title="Workbench"
        active={active}
        onSelect={onSelect}
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'mapping', label: 'Functional Mapping' },
          { id: 'coverage', label: 'Coverage & Gaps' },
          { id: 'unlinked', label: 'Unanchored FRs', count: counts.unanchoredFr },
        ]}
      />
      <NavGroup
        title="Catalog"
        active={active}
        onSelect={onSelect}
        items={[
          { id: 'catalogFr', label: 'Functional Items', count: counts.fr },
          { id: 'catalogNfr', label: 'Non-functional', count: counts.nfr },
        ]}
      />
      <NavGroup
        title="Tools"
        active={active}
        onSelect={onSelect}
        items={[{ id: 'toolsImport', label: 'Import' }]}
      />
    </nav>
  )
}
