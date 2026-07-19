'use client'

import { Stack, Typography } from '@/shared/ui'
import { FEATURES } from '@/config/features'

const PLANNED_TYPES = [
  'PROJECT_SUMMARY',
  'RAID_LIST',
  'REQUIREMENTS_TABLE',
  'DECISION_LOG',
  'STAKEHOLDER_MAP',
] as const

/**
 * Smart Blocks — typed live embeds.
 * No BE `/smart-blocks/*` surface exists yet (W41-GAP-API-09). Keep gated.
 */
export function SmartBlocksPanel() {
  return (
    <Stack direction="vertical" spacing="xs" className="border border-neutral-200 p-sm">
      <Typography variant="h4">Smart blocks</Typography>
      {!FEATURES.wave41SmartBlocks ? (
        <Typography variant="caption" tone="muted">
          Deferred until BE ships typed `/smart-blocks/types|preview|resolve|snapshot` APIs
          (GAP-09). Flag: FEATURES.wave41SmartBlocks.
        </Typography>
      ) : (
        <>
          <Typography variant="caption" tone="muted">
            Insert a live typed embed. Preview/resolve calls are not wired yet.
          </Typography>
          <ul className="divide-y divide-neutral-200">
            {PLANNED_TYPES.map((type) => (
              <li key={type} className="py-xs text-sm text-neutral-600">
                {type.replaceAll('_', ' ')}
              </li>
            ))}
          </ul>
        </>
      )}
    </Stack>
  )
}
