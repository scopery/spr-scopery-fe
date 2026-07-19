'use client'

import {
  useMemo,
  useState
} from 'react'
import { useParams } from 'next/navigation'
import {
  Button,
  EntityReferencePicker,
  PageSkeleton,
  Stack,
  Typography
} from '@/shared/ui'

import type { EntityReferenceOption } from '@/shared/ui'
import { useDefects } from '../hooks/useDefects'

export function TestRunExecutionView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { items, loading, error } = useDefects(projectId)
  const [defectLink, setDefectLink] = useState<EntityReferenceOption | null>(null)
  const [stepStatus, setStepStatus] = useState<'PASS' | 'FAIL' | null>(null)

  const defectOptions = useMemo(
    () =>
      items.map((d) => ({
        id: d.id,
        type: 'DEFECT',
        code: d.code,
        title: d.title,
        status: d.status,
      })),
    [items]
  )

  if (loading) return <PageSkeleton variant="detail" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Test Run Execution</Typography>
      <Typography tone="muted">
        Execute steps with pass/fail, actual results, and optional defect creation. Links
        Requirement → Test Case → Result → Defect → Release.
      </Typography>
      <div className="border border-neutral-200 p-md">
        <Typography variant="small" weight="medium">
          Step 1 — Preconditions
        </Typography>
        <Typography variant="caption" tone="muted">
          Record actual outcome, then mark Pass / Fail.
        </Typography>
        <div className="mt-sm flex gap-sm">
          <Button
            size="sm"
            variant={stepStatus === 'PASS' ? 'primary' : 'outline'}
            onClick={() => setStepStatus('PASS')}
          >
            Pass
          </Button>
          <Button
            size="sm"
            variant={stepStatus === 'FAIL' ? 'primary' : 'outline'}
            tone="error"
            onClick={() => setStepStatus('FAIL')}
          >
            Fail
          </Button>
        </div>
        {stepStatus ? (
          <Typography variant="caption" className="mt-sm" tone="muted">
            Recorded: {stepStatus}
          </Typography>
        ) : null}
      </div>
      <Typography variant="h4">Link defect</Typography>
      <EntityReferencePicker
        options={defectOptions}
        value={defectLink}
        onChange={setDefectLink}
        emptyLabel={
          defectOptions.length === 0
            ? 'No defects yet — open Defect Center to create'
            : 'Select a defect'
        }
      />
    </Stack>
  )
}
