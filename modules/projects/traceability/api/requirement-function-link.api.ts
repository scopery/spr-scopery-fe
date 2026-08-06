/**
 * Requirement ↔ Function linking — aligned with BE contract:
 * 1) POST .../functional-items/{id}/requirements — junction, idempotent 200
 * 2) POST .../trace-links COVERS — separate; may still 409 if edge exists
 *
 * BE LinkRequirementToFunctionAction no longer creates COVERS.
 */

import { TraceLinkType } from '@/modules/quality/domain/enums/quality.enum'
import { isRequirementLinkConflict } from '../domain/rules/requirement-link.rules'
import * as traceApi from './traceability.api'
import * as useCaseApi from './use-case.api'

export async function linkRequirementToFunctionWithCovers(
  projectId: string,
  functionalItemId: string,
  requirementId: string
): Promise<void> {
  // Junction — BE returns 200 even when already linked (idempotent).
  await useCaseApi.linkRequirementToFunction(
    projectId,
    functionalItemId,
    { requirementId },
    { skipErrorToast: true }
  )

  // COVERS edge for traceability / Spec Pack — soft-ignore duplicate.
  try {
    await traceApi.createTraceLink(
      projectId,
      {
        sourceType: 'REQUIREMENT',
        sourceId: requirementId,
        targetType: 'FUNCTIONAL_ITEM',
        targetId: functionalItemId,
        linkType: TraceLinkType.Covers,
      },
      { skipErrorToast: true }
    )
  } catch (err: unknown) {
    if (!isRequirementLinkConflict(err)) throw err
  }
}
