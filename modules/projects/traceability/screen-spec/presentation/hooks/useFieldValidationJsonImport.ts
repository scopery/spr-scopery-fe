'use client'

import { useCallback } from 'react'
import { ApiError, getErrorCode } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/screen-spec.api'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import type { ResolvedFieldValidationImport } from '../../domain/model/validation-import'

export interface FieldValidationImportResult {
  created: number
  failed: Array<{ fieldKey: string; message: string }>
}

export function useFieldValidationJsonImport(workspaceId: string | null, screenId: string | null) {
  const importValidations = useCallback(
    async (items: ResolvedFieldValidationImport[]): Promise<FieldValidationImportResult> => {
      if (!workspaceId || !screenId) {
        return { created: 0, failed: [{ fieldKey: '', message: 'Screen is not ready.' }] }
      }
      let created = 0
      const failed: FieldValidationImportResult['failed'] = []
      for (const item of items) {
        try {
          await api.createFieldValidation(workspaceId, screenId, item.fieldId, item.body, {
            skipErrorToast: true,
          })
          created += 1
        } catch (err) {
          const message =
            getErrorCode(err) === 'FIELD_VALIDATION_RULE_PARAM_INVALID'
              ? ScreenSpecMessages.RULE_PARAM_INVALID
              : err instanceof ApiError
                ? err.problem.detail || err.message
                : err instanceof Error
                  ? err.message
                  : 'Failed to add rule'
          failed.push({ fieldKey: item.fieldKey, message })
        }
      }
      return { created, failed }
    },
    [workspaceId, screenId]
  )

  return { importValidations }
}
