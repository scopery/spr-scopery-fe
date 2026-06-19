'use client'

import { useState } from 'react'
import { Modal, Input, Textarea, Select, Checkbox, Button, Typography } from '@/shared/ui'
import { adminTemplatesApi } from '@/modules/admin'
import { normalizeQuestionTypeForApi } from '@/utils/questionType'
import { toast } from 'sonner'
import { getProblemToastMessage, getFieldErrors } from '@/shared/lib/errorHandling'
import { SECTION_OPTIONS, Q_TYPE_OPTIONS } from '../lib/template-detail-utils'

export function QuestionFormModal({
  templateId,
  question,
  onClose,
  onSuccess,
}: {
  templateId: string
  question: adminTemplatesApi.SystemQuestion | null
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = !!question
  const [section, setSection] = useState(question?.section ?? 'overview')
  const [prompt, setPrompt] = useState(question?.prompt ?? '')
  const [qType, setQType] = useState(question?.q_type ?? 'text')
  const [required, setRequired] = useState(question?.required ?? false)
  const [helpText, setHelpText] = useState(question?.help_text ?? '')
  const [tagsStr, setTagsStr] = useState(
    Array.isArray(question?.tags) ? question.tags.join(', ') : ''
  )
  const [answerSchema, setAnswerSchema] = useState(
    question?.answer_schema ? JSON.stringify(question.answer_schema, null, 2) : '{}'
  )
  const [visibilityLogic, setVisibilityLogic] = useState(
    question?.visibility_logic != null ? JSON.stringify(question.visibility_logic, null, 2) : ''
  )
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error('Prompt is required')
      return
    }
    setLoading(true)
    setFieldErrors({})
    try {
      let parsedSchema: Record<string, unknown> = {}
      try {
        parsedSchema = answerSchema.trim() ? JSON.parse(answerSchema) : {}
      } catch {
        toast.error('Invalid JSON in answer_schema')
        setLoading(false)
        return
      }
      let parsedVisibility: unknown = null
      if (visibilityLogic.trim()) {
        try {
          parsedVisibility = JSON.parse(visibilityLogic)
        } catch {
          toast.error('Invalid JSON in visibility_logic')
          setLoading(false)
          return
        }
      }
      const tags = tagsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      if (isEdit && question) {
        await adminTemplatesApi.updateAdminQuestion(question.id, {
          section,
          prompt: prompt.trim(),
          q_type: normalizeQuestionTypeForApi(qType),
          required,
          help_text: helpText.trim() || null,
          answer_schema: parsedSchema,
          visibility_logic: parsedVisibility ?? undefined,
          tags: tags.length ? tags : undefined,
        })
        toast.success('Question updated')
      } else {
        await adminTemplatesApi.addTemplateQuestion(templateId, {
          section,
          tags: tags.length ? tags : undefined,
          q_type: normalizeQuestionTypeForApi(qType),
          prompt: prompt.trim(),
          help_text: helpText.trim() || null,
          required,
          answer_schema: parsedSchema,
          visibility_logic: parsedVisibility ?? undefined,
        })
        toast.success('Question created')
      }
      onSuccess()
    } catch (err) {
      const errors = getFieldErrors(err)
      if (Object.keys(errors).length > 0) setFieldErrors(errors)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const sectionOptions = SECTION_OPTIONS.some((o) => o.value === section)
    ? SECTION_OPTIONS
    : [{ value: section, label: section }, ...SECTION_OPTIONS]
  const qTypeOptions = Q_TYPE_OPTIONS.some((o) => o.value === qType)
    ? Q_TYPE_OPTIONS
    : [{ value: qType, label: qType }, ...Q_TYPE_OPTIONS]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl">
        <Typography as="h2" weight="semibold" className="mb-4">
          {isEdit ? 'Edit question' : 'Add question'}
        </Typography>
        <div className="space-y-4">
          <div>
            <Typography variant="small" className="mb-1.5 block">
              Section
            </Typography>
            <Select
              options={sectionOptions}
              value={section}
              onValueChange={(v: string) => setSection(v)}
              className="w-full"
              disabled={isEdit}
            />
          </div>
          <Input
            label="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Question text"
            fullWidth
            required
            error={fieldErrors.prompt}
          />
          <div>
            <Typography variant="small" className="mb-1.5 block">
              Type
            </Typography>
            <Select
              options={qTypeOptions}
              value={qType}
              onValueChange={(v: string) => setQType(v)}
              className="w-full"
              disabled={isEdit}
            />
          </div>
          <Checkbox
            id="required"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            label="Required"
            size="sm"
          />
          <Input
            label="Tags (comma-separated)"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="scope, risk"
            fullWidth
          />
          <Textarea
            label="Help text (optional)"
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            placeholder="Additional guidance"
            fullWidth
          />
          <div>
            <Typography variant="small" className="mb-1.5 block">
              Answer schema (JSON)
            </Typography>
            <Textarea
              value={answerSchema}
              onChange={(e) => setAnswerSchema(e.target.value)}
              placeholder='{} or {"enum": ["a","b"]}'
              fullWidth
              className="font-mono text-sm"
            />
            {fieldErrors.answer_schema && (
              <Typography variant="small" tone="error" className="mt-1">
                {fieldErrors.answer_schema}
              </Typography>
            )}
          </div>
          <div>
            <Typography variant="small" className="mb-1.5 block">
              Visibility logic (JSON, optional)
            </Typography>
            <Textarea
              value={visibilityLogic}
              onChange={(e) => setVisibilityLogic(e.target.value)}
              placeholder="{}"
              fullWidth
              className="font-mono text-sm"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
