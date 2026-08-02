'use client'

import { Button, Stack, Typography } from '@/shared/ui'
import type { GanttDependency } from '../../domain/model/gantt'

type Props = {
  taskTitle: string
  taskId: string
  dependencies: GanttDependency[]
  canLinkToSelected: boolean
  selectedOtherTitle?: string | null
  onLinkFs: () => void
  onRemove: (depId: string) => void
  onClose: () => void
}

export function TimelineDependenciesPanel({
  taskTitle,
  taskId,
  dependencies,
  canLinkToSelected,
  selectedOtherTitle,
  onLinkFs,
  onRemove,
  onClose,
}: Props) {
  const related = dependencies.filter(
    (d) => d.predecessorTaskId === taskId || d.successorTaskId === taskId
  )

  return (
    <div className="border border-neutral-200 bg-white p-md shadow-sm">
      <Stack direction="vertical" spacing="sm">
        <Stack direction="horizontal" className="items-start justify-between">
          <div>
            <Typography size="sm" weight="medium">
              Dependencies
            </Typography>
            <Typography variant="caption" tone="muted">
              {taskTitle}
            </Typography>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </Stack>

        {related.length === 0 ? (
          <Typography variant="caption" tone="muted">
            No dependencies yet.
          </Typography>
        ) : (
          related.map((d) => (
            <Stack
              key={d.id}
              direction="horizontal"
              spacing="sm"
              className="items-center justify-between text-xs"
            >
              <span>
                {d.predecessorTaskId === taskId ? '→ successor' : '← predecessor'} ·{' '}
                {d.dependencyType}
                {d.lagDays ? ` · lag ${d.lagDays}d` : ''}
              </span>
              <Button size="sm" variant="ghost" tone="error" onClick={() => onRemove(d.id)}>
                Remove
              </Button>
            </Stack>
          ))
        )}

        {canLinkToSelected && (
          <Button size="sm" variant="outline" onClick={onLinkFs}>
            Link FS to “{selectedOtherTitle}”
          </Button>
        )}
        {!canLinkToSelected && (
          <Typography variant="caption" tone="muted">
            Select two tasks (this + another) to create a Finish-to-Start link.
          </Typography>
        )}
      </Stack>
    </div>
  )
}

