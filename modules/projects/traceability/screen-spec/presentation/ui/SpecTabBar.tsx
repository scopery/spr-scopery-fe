'use client'

import { cn } from '@/utils/cn'

export function SpecTabBar<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: Array<{ id: T; label: string }>
  value: T
  onChange: (id: T) => void
  label: string
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-neutral-200" role="tablist" aria-label={label}>
      {tabs.map((item) => {
        const active = value === item.id
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
