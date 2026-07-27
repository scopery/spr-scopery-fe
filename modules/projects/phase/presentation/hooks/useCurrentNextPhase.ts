'use client'

import { useMemo } from 'react'
import type { ProjectPhase } from '../../domain/model/phase'
import type { ProjectTask } from '../../../task/domain/model/task'
import { buildProjectPhaseWatchRow } from '../../domain/rules/phase-watch.rules'
import type { PhaseWatchProjectRow } from '../../domain/model/phase-watch'

function todayIsoDate() {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export function useCurrentNextPhase(input: {
  projectId: string
  projectName: string
  projectCode?: string | null
  phases: ProjectPhase[]
  tasks: ProjectTask[]
}): PhaseWatchProjectRow {
  return useMemo(
    () =>
      buildProjectPhaseWatchRow({
        projectId: input.projectId,
        projectName: input.projectName,
        projectCode: input.projectCode,
        phases: input.phases,
        tasks: input.tasks,
        todayIso: todayIsoDate(),
      }),
    [input.projectId, input.projectName, input.projectCode, input.phases, input.tasks]
  )
}
