'use client'

import { Send } from 'lucide-react'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Typography, PageSkeleton } from '@/shared/ui'
import { useFormBuilder } from '../hooks/useFormBuilder'
import { useFormSubmission } from '../hooks/useFormSubmission'
import { DynamicFieldRenderer } from './DynamicFieldRenderer'
import { FormFieldSource } from '../../domain/enums/configuration.enum'

export function UserFormSubmitView() {
  const { workspaceId, formId } = useParams<{ workspaceId: string; formId: string }>()
  const router = useRouter()
  const { customFields, form, selectedVersion, fieldGroups, loading } = useFormBuilder(
    workspaceId,
    formId
  )
  const { submit, submitting } = useFormSubmission(workspaceId, formId)
  const [values, setValues] = useState<Record<string, unknown>>({})

  if (loading) {
    return (
      <PageSkeleton variant="form" />
    )
  }

  if (!form || !selectedVersion) {
    return (
      <Typography variant="small" tone="muted">
        This form is not available yet.
      </Typography>
    )
  }

  const handleSubmit = async () => {
    const payload: Record<string, unknown> = {}
    for (const group of fieldGroups) {
      for (const field of group.fields) {
        if (field.fieldSource !== FormFieldSource.CustomField || !field.customFieldDefinitionId) {
          continue
        }
        const def = customFields.find((f) => f.id === field.customFieldDefinitionId)
        if (!def) continue
        payload[def.fieldKey] = values[field.id] ?? null
      }
    }

    await submit({
      formVersionId: selectedVersion.id,
      objectTypeCode: form.objectTypeCode,
      payloadJson: JSON.stringify(payload),
    })
    router.push(`/workspace/${workspaceId}/submissions`)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          {form.name}
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Fill in the fields below and submit.
        </Typography>
      </div>

      <div className="space-y-6">
        {fieldGroups.map((group, idx) => (
          <div key={group.section?.id ?? `unsectioned-${idx}`} className="border border-neutral-200 bg-white p-4">
            {group.section ? (
              <Typography weight="semibold" className="mb-4">
                {group.section.title}
              </Typography>
            ) : null}
            <div className="space-y-4">
              {group.fields.map((field) => {
                const def = customFields.find((f) => f.id === field.customFieldDefinitionId)
                return (
                  <DynamicFieldRenderer
                    key={field.id}
                    formField={field}
                    fieldDefinition={def}
                    value={values[field.id]}
                    onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
                  />
                )
              })}
            </div>
          </div>
        ))}
        {fieldGroups.length === 0 ? (
          <Typography tone="muted" variant="small">
            This form has no fields configured yet.
          </Typography>
        ) : null}
      </div>

      <div className="mt-6">
        <Button variant="primary" disabled={submitting} onClick={() => void handleSubmit()} icon={<Send size={16} />}>
          {submitting ? 'Submitting…' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}
