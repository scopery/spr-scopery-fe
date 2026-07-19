'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as projectsApi from '../api/projects.api'
import type { ProjectLifecycleAction } from '../domain/rules/project.rules'
import type { ProjectDetail } from '../model/project'

export function useProjectLifecycle(onDone?: (project: ProjectDetail) => void) {
  const [actingId, setActingId] = useState<string | null>(null)

  const runLifecycle = useCallback(
    async (projectId: string, action: ProjectLifecycleAction) => {
      setActingId(projectId)
      try {
        let result: ProjectDetail
        if (action === 'activate') result = await projectsApi.activateProject(projectId)
        else if (action === 'hold') result = await projectsApi.holdProject(projectId)
        else if (action === 'complete') result = await projectsApi.completeProject(projectId)
        else result = await projectsApi.archiveProject(projectId)
        toast.success(
          action === 'activate'
            ? 'Project activated'
            : action === 'hold'
              ? 'Project put on hold'
              : action === 'complete'
                ? 'Project completed'
                : 'Project archived'
        )
        onDone?.(result)
        return result
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setActingId(null)
      }
    },
    [onDone]
  )

  return { actingId, runLifecycle }
}
