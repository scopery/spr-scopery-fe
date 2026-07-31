'use client'

import { useEffect, useState } from 'react'
import { SearchableSelect, Typography } from '@/shared/ui'
import { decisionsApi } from '@/modules/projects/decisions'
import { raidApi } from '@/modules/projects/raid'
import { tasksApi } from '@/modules/projects/task'

export type ProjectRecordType = 'TASK' | 'DECISION' | 'RAID_ITEM'

interface ProjectRecordSearchSelectProps {
  projectId: string
  recordType: ProjectRecordType | string
  value: string
  onChange: (recordId: string) => void
  label?: string
}

export function ProjectRecordSearchSelect({
  projectId,
  recordType,
  value,
  onChange,
  label = 'Record',
}: ProjectRecordSearchSelectProps) {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId || !['TASK', 'DECISION', 'RAID_ITEM'].includes(recordType)) {
      setOptions([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const load = async () => {
      if (recordType === 'TASK') {
        const response = await tasksApi.listTasks(projectId, { page: 0, size: 200 })
        return response.items.map((item) => ({
          value: item.id,
          label: `${item.code} · ${item.title}`,
        }))
      }
      if (recordType === 'DECISION') {
        const items = await decisionsApi.listDecisions(projectId)
        return items.map((item) => ({
          value: item.id,
          label: `${item.code} · ${item.title}`,
        }))
      }
      const items = await raidApi.listRaidItems(projectId)
      return items.map((item) => ({
        value: item.id,
        label: `${item.code} · ${item.title}`,
      }))
    }
    void load()
      .then((next) => {
        if (!cancelled) setOptions(next)
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load records')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId, recordType])

  return (
    <div className="space-y-1">
      <Typography variant="small" weight="medium">
        {label}
      </Typography>
      <SearchableSelect
        value={value}
        options={options}
        disabled={loading || !options.length}
        placeholder={loading ? 'Loading records…' : `Select ${label.toLowerCase()}`}
        searchPlaceholder={`Search ${label.toLowerCase()}…`}
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
