'use client'

import { useMemo } from 'react'
import { toast } from 'sonner'
import { JsonImportModal, Typography } from '@/shared/ui'
import { formatJsonImportIssues } from '@/shared/lib/jsonImportValidation'
import { FIELD_VALIDATION_IMPORT_MAX_ITEMS } from '../../domain/model/validation-import'
import type { FieldValidationImportRefs } from '../../domain/model/validation-import'
import {
  resolveFieldValidationImports,
  validateFieldValidationJsonImport,
} from '../../domain/rules/validation-import.validation'
import { useFieldValidationJsonImport } from '../hooks/useFieldValidationJsonImport'
import { buildFieldValidationImportGuide } from './validation-import.guide'

export function FieldValidationJsonImportModal({
  open,
  onClose,
  workspaceId,
  screenId,
  refs,
  onImported,
}: {
  open: boolean
  onClose: () => void
  workspaceId: string
  screenId: string
  refs: FieldValidationImportRefs
  onImported?: () => void
}) {
  const { importValidations } = useFieldValidationJsonImport(workspaceId, screenId)
  const fieldKeys = useMemo(() => refs.fields.map((f) => f.fieldKey).filter(Boolean), [refs.fields])
  const ruleCodes = useMemo(() => refs.ruleTypes.map((t) => t.code).filter(Boolean), [refs.ruleTypes])
  const modeCodes = useMemo(() => refs.modes.map((m) => m.modeCode).filter(Boolean), [refs.modes])
  const guide = useMemo(
    () =>
      buildFieldValidationImportGuide({
        fieldKeys,
        ruleTypeCodes: ruleCodes,
        modeCodes,
      }),
    [fieldKeys, ruleCodes, modeCodes]
  )

  return (
    <JsonImportModal
      open={open}
      onClose={onClose}
      title="JSON import — Validations"
      size="xl"
      guide={guide}
      description="Paste rules for fields on this screen. Open the format guide for field rules, system ruleTypeCode values, and ruleParamJson examples. Client checks keys first, then POSTs one rule at a time."
      maxItems={FIELD_VALIDATION_IMPORT_MAX_ITEMS}
      extra={
        <div className="space-y-1">
          <Typography variant="caption" tone="muted">
            Fields on this screen: {fieldKeys.length ? fieldKeys.join(', ') : 'none yet'}
          </Typography>
          <Typography variant="caption" tone="muted">
            Rule types: {ruleCodes.length ? ruleCodes.join(', ') : 'none loaded'}
          </Typography>
        </div>
      }
      validate={(raw) => {
        const shape = validateFieldValidationJsonImport(raw)
        if (!shape.ok) return shape
        return resolveFieldValidationImports(shape.items, refs)
      }}
      onImport={async (items) => {
        const result = await importValidations(items)
        if (result.created > 0) onImported?.()
        if (result.failed.length === 0) {
          toast.success(
            result.created === 1 ? 'Added 1 validation' : `Added ${result.created} validations`
          )
          return
        }
        const summary =
          result.created > 0
            ? `Added ${result.created}, ${result.failed.length} failed.`
            : `Import failed — ${result.failed.length} rule${result.failed.length === 1 ? '' : 's'} not created.`
        throw new Error(
          `${summary}\n${formatJsonImportIssues(
            result.failed.map((item, index) => ({
              path: item.fieldKey ? `items[${index}].fieldKey` : `items[${index}]`,
              message: item.message,
            }))
          )}`
        )
      }}
    />
  )
}
