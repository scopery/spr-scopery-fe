'use client'

import { useMemo } from 'react'
import { SearchableSelect, Typography } from '@/shared/ui'
import { useProjectTasks } from '../hooks/useProjectTasks'

interface TaskSearchSelectProps {
  projectId: string
  value: string
  onChange: (taskId: string) => void
  label?: string
  optional?: boolean
}

export function TaskSearchSelect({
  projectId,
  value,
  onChange,
  label = 'Task',
  optional = false,
}: TaskSearchSelectProps) {
  const { tasks, loading, error } = useProjectTasks(projectId)
  const options = useMemo(
    () => [
      ...(optional ? [{ value: '', label: 'No task' }] : []),
      ...tasks.map((task) => ({
        value: task.id,
        label: `${task.code} · ${task.title}`,
      })),
    ],
    [tasks, optional]
  )

  return (
    <div className="space-y-1">
      <Typography variant="small" weight="medium">
        {label}
        {optional ? ' (optional)' : ''}
      </Typography>
      <SearchableSelect
        value={value}
        options={options}
        disabled={loading || !projectId}
        placeholder={
          !projectId ? 'Select project first' : loading ? 'Loading tasks…' : 'Select task'
        }
        searchPlaceholder="Search task…"
        onValueChange={onChange}
      />
      {error ? (
        <Typography variant="caption" tone="error" className="block">
          {error}
        </Typography>
      ) : null}
    </div>
  )
}
