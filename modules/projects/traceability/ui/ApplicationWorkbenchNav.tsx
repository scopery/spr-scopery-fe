'use client'

import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { WorkbenchSection } from '../model/architecture-workbench'

interface NavItem {
  id: WorkbenchSection
  label: string
  count?: number
}

interface ApplicationWorkbenchNavProps {
  active: WorkbenchSection
  onSelect: (section: WorkbenchSection) => void
  catalogCounts: {
    modules: number
    screens: number
    apis: number
    components: number
    entities: number
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
  active: WorkbenchSection
  onSelect: (section: WorkbenchSection) => void
}) {
  return (
    <div className="mb-md">
      <Typography
        variant="caption"

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

export function ApplicationWorkbenchNav({
  active,
  onSelect,
  catalogCounts,
}: ApplicationWorkbenchNavProps) {
  return (
    <nav aria-label="Application workbench" className="h-full overflow-auto p-sm">
      <NavGroup
        title="Workbench"
        active={active}
        onSelect={onSelect}
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'architectureCatalog', label: 'Architecture Catalog' },
          { id: 'relationshipExplorer', label: 'Relationship Explorer' },
          { id: 'functionalMapping', label: 'Functional Mapping' },
          { id: 'coverage', label: 'Coverage & Gaps' },
          { id: 'unlinked', label: 'Unlinked Items' },
        ]}
      />
      <NavGroup
        title="Catalog"
        active={active}
        onSelect={onSelect}
        items={[
          { id: 'catalogModules', label: 'Modules', count: catalogCounts.modules },
          { id: 'catalogScreens', label: 'Screens', count: catalogCounts.screens },
          { id: 'catalogApis', label: 'API Endpoints', count: catalogCounts.apis },
          { id: 'catalogComponents', label: 'Components', count: catalogCounts.components },
          { id: 'catalogEntities', label: 'Data Entities', count: catalogCounts.entities },
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
