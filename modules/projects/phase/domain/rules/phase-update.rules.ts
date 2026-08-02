import type { ProjectPhase, UpdateProjectPhasePayload } from '../model/phase'

type PhaseUpdateSource = Pick<
  ProjectPhase,
  'code' | 'name' | 'description' | 'displayOrder' | 'plannedStartDate' | 'plannedEndDate'
>

function nonBlank(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * BE UpdateProjectPhaseRequest requires name + displayOrder (primitive int).
 * Omitting displayOrder deserializes as 0 and can 500 on unique (project_id, display_order).
 * Empty-string name must not win over the current phase name (`??` does not treat "" as missing).
 */
export function mergePhaseUpdatePayload(
  current: PhaseUpdateSource | null | undefined,
  patch: UpdateProjectPhasePayload
): UpdateProjectPhasePayload {
  const name =
    nonBlank(patch.name) ??
    nonBlank(current?.name) ??
    nonBlank(current?.code) ??
    'Phase'

  return {
    name,
    description:
      patch.description !== undefined ? patch.description : (current?.description ?? null),
    displayOrder: patch.displayOrder ?? current?.displayOrder ?? 1,
    plannedStartDate:
      patch.plannedStartDate !== undefined
        ? patch.plannedStartDate
        : (current?.plannedStartDate ?? null),
    plannedEndDate:
      patch.plannedEndDate !== undefined
        ? patch.plannedEndDate
        : (current?.plannedEndDate ?? null),
  }
}
