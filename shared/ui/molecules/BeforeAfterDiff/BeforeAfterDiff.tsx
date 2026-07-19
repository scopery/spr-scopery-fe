'use client'

import React, { useState } from 'react'
import { cn } from '@/utils/cn'
import { Typography } from '../../atoms/Typography'
import { Button } from '../../atoms/Button'
import type { BeforeAfterDiffProps } from './BeforeAfterDiff.types'

/**
 * BeforeAfterDiff — typed field diff with optional raw JSON tab.
 */
export function BeforeAfterDiff({
  fields,
  rawBefore,
  rawAfter,
  showRawTab = false,
  className,
}: BeforeAfterDiffProps) {
  const [tab, setTab] = useState<'fields' | 'raw'>('fields')

  return (
    <div className={cn('flex flex-col gap-sm', className)}>
      {showRawTab ? (
        <div className="flex gap-xs">
          <Button
            size="sm"
            variant={tab === 'fields' ? 'primary' : 'ghost'}
            onClick={() => setTab('fields')}
          >
            Fields
          </Button>
          <Button
            size="sm"
            variant={tab === 'raw' ? 'primary' : 'ghost'}
            onClick={() => setTab('raw')}
          >
            JSON
          </Button>
        </div>
      ) : null}

      {tab === 'fields' ? (
        <div className="divide-y divide-neutral-200 border border-neutral-200">
          {fields.length === 0 ? (
            <Typography variant="small" tone="muted" className="p-md">
              No field changes
            </Typography>
          ) : (
            fields.map((f) => (
              <div key={f.path} className="grid grid-cols-3 gap-sm p-sm text-sm">
                <Typography variant="small" weight="medium">
                  {f.label}
                </Typography>
                <Typography variant="small" tone="muted" className="line-through">
                  {f.before ?? '—'}
                </Typography>
                <Typography variant="small" tone="success">
                  {f.after ?? '—'}
                </Typography>
              </div>
            ))
          )}
        </div>
      ) : (
        <pre className="overflow-auto border border-neutral-200 bg-neutral-50 p-md text-xs">
          {JSON.stringify({ before: rawBefore, after: rawAfter }, null, 2)}
        </pre>
      )}
    </div>
  )
}

BeforeAfterDiff.displayName = 'BeforeAfterDiff'
