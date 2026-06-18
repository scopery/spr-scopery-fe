'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Copy,
  Upload,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  ChevronUp,
  ChevronDown,
  CircleArrowOutUpLeft,
  FileJson,
} from 'lucide-react'
import {
  Typography,
  Button,
  Badge,
  ContentLoader,
  Input,
  Textarea,
  Select,
  Checkbox,
  Modal,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import * as templateService from '@/services/template.service'
import { useAdminTemplateDetail } from '@/hooks/useAdminTemplates'
import { normalizeQuestionTypeForApi } from '@/utils/questionType'
import { toast } from 'sonner'
import { getProblemToastMessage, getFieldErrors } from '@/shared/lib/errorHandling'
import { cn } from '@/utils'

/** Display order of sections (not alphabetical). */
const SECTION_ORDER = ['overview', 'scope', 'risks', 'timeline', 'assumptions', 'general']

function sectionSortIndex(section: string): number {
  const i = SECTION_ORDER.indexOf(section || 'general')
  return i >= 0 ? i : SECTION_ORDER.length
}

const SECTION_OPTIONS = [
  { value: 'overview', label: 'Overview' },
  { value: 'scope', label: 'Scope' },
  { value: 'risks', label: 'Risks' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'assumptions', label: 'Assumptions' },
  { value: 'general', label: 'General' },
]

const Q_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'single_select', label: 'Single select' },
  { value: 'multi_select', label: 'Multi select' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'json', label: 'JSON' },
]

function statusBadgeTone(status: string): 'info' | 'success' | 'neutral' | 'warning' {
  switch (status) {
    case 'draft':
      return 'info'
    case 'published':
      return 'success'
    case 'deprecated':
      return 'warning'
    default:
      return 'neutral'
  }
}

function questionsBySection(questions: templateService.SystemQuestion[]) {
  const sorted = [...questions].sort((a, b) => {
    const orderA = sectionSortIndex(a.section || '')
    const orderB = sectionSortIndex(b.section || '')
    if (orderA !== orderB) return orderA - orderB
    const posA = a.position ?? 0
    const posB = b.position ?? 0
    if (posA !== posB) return posA - posB
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
  return sorted.reduce(
    (acc, q) => {
      const s = q.section || 'general'
      if (!acc[s]) acc[s] = []
      acc[s].push(q)
      return acc
    },
    {} as Record<string, templateService.SystemQuestion[]>
  )
}

/** Iterate section keys in SECTION_ORDER so table order is consistent. */
function orderedSectionEntries(
  bySection: Record<string, templateService.SystemQuestion[]>
): [string, templateService.SystemQuestion[]][] {
  const order = [...SECTION_ORDER]
  const rest = Object.keys(bySection).filter((k) => !SECTION_ORDER.includes(k))
  rest.sort()
  for (const k of rest) order.push(k)
  return order.filter((k) => bySection[k]?.length).map((k) => [k, bySection[k]])
}

type TabId = 'overview' | 'questions' | 'json'

export default function AdminTemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.templateId as string

  const { template, loading, refetch: refetchTemplate } = useAdminTemplateDetail(templateId)
  const [tab, setTab] = useState<TabId>('overview')
  const [overviewSaving, setOverviewSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [nameEdit, setNameEdit] = useState(template?.name ?? '')
  const [versionEdit, setVersionEdit] = useState(template?.version ?? '')
  const [addQuestionOpen, setAddQuestionOpen] = useState(false)
  const [addByJsonOpen, setAddByJsonOpen] = useState(false)
  const [editQuestion, setEditQuestion] = useState<templateService.SystemQuestion | null>(null)
  const [archiveConfirm, setArchiveConfirm] = useState<templateService.SystemQuestion | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (template) {
      setNameEdit(template.name)
      setVersionEdit(template.version ?? '')
    }
  }, [template])

  const isDraft = template?.status === 'draft'
  const questionsBySec = useMemo(
    () => (template?.questions ? questionsBySection(template.questions) : {}),
    [template?.questions]
  )
  const activeCount = useMemo(
    () => (template?.questions ?? []).filter((q) => q.status === 'active').length,
    [template?.questions]
  )

  const handleSaveOverview = async () => {
    if (!templateId || !isDraft) return
    setOverviewSaving(true)
    try {
      await templateService.updateTemplate(templateId, {
        name: nameEdit.trim(),
        version: versionEdit.trim() || undefined,
      })
      toast.success('Template updated')
      await refetchTemplate()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setOverviewSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!templateId) return
    setPublishing(true)
    try {
      await templateService.publishTemplate(templateId)
      await refetchTemplate()
      toast.success('Template published')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setPublishing(false)
    }
  }

  const handleDuplicate = async () => {
    if (!templateId) return
    setDuplicating(true)
    try {
      const created = await templateService.duplicateTemplate(templateId)
      toast.success('Template duplicated')
      router.push(ROUTES.admin.template(created.id))
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setDuplicating(false)
    }
  }

  const handleArchive = async (q: templateService.SystemQuestion) => {
    setActionLoading(true)
    try {
      await templateService.updateAdminQuestion(q.id, { status: 'archived' })
      toast.success('Question archived')
      refetchTemplate()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActionLoading(false)
      setArchiveConfirm(null)
    }
  }

  const handleUnarchive = async (q: templateService.SystemQuestion) => {
    setActionLoading(true)
    try {
      await templateService.updateAdminQuestion(q.id, { status: 'active' })
      toast.success('Question restored')
      refetchTemplate()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleReorder = async (
    section: string,
    questions: templateService.SystemQuestion[],
    fromIdx: number,
    direction: 'up' | 'down'
  ) => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1
    if (toIdx < 0 || toIdx >= questions.length) return
    const moved = questions[fromIdx]
    const other = questions[toIdx]
    const newPosition = other.position ?? toIdx * 1000
    const swapPosition = moved.position ?? fromIdx * 1000
    setActionLoading(true)
    try {
      await templateService.updateAdminQuestion(moved.id, { position: newPosition })
      await templateService.updateAdminQuestion(other.id, { position: swapPosition })
      toast.success('Order updated')
      refetchTemplate()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && !template) {
    return (
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="p-6">
        <Typography tone="error">Template not found.</Typography>
        <Link href={ROUTES.admin.templates} className="text-primary mt-2 inline-block">
          Back to templates
        </Link>
      </div>
    )
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'questions', label: 'Questions' },
    { id: 'json', label: 'JSON' },
  ]

  return (
    <div className="p-6 mx-auto">
      <Link
        href={ROUTES.admin.templates}
        className="inline-flex items-center gap-1 text-primary hover:underline mb-4"
      >
        <CircleArrowOutUpLeft size={20} />
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Typography as="h1" size="xl" weight="bold">
              {template.name}
            </Typography>
            <Badge tone={statusBadgeTone(template.status)} size="sm">
              {template.status}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <Button
              variant="primary"
              size="sm"
              onClick={handlePublish}
              loading={publishing}
              disabled={activeCount < 1}
              className="gap-1"
            >
              <Upload size={16} />
              Publish
            </Button>
          )}
          <Button
            variant="neutral-flat"
            size="sm"
            onClick={handleDuplicate}
            loading={duplicating}
            className="gap-1"
          >
            <Copy size={16} />
            Duplicate
          </Button>
        </div>
      </div>

      {isDraft && activeCount < 1 && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/30 text-sm text-neutral-700">
          Add at least one active question to publish this template.
        </div>
      )}

      <div className="border-b border-neutral-200 mb-4">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'px-4 py-2 text-sm -mb-px',
                tab === t.id
                  ? 'bg-white border border-neutral-200 border-b-0 text-primary'
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          {isDraft ? (
            <>
              <Input
                label="Name"
                value={nameEdit}
                onChange={(e) => setNameEdit(e.target.value)}
                fullWidth
              />
              <Input
                label="Version"
                value={versionEdit}
                onChange={(e) => setVersionEdit(e.target.value)}
                placeholder="e.g. 1.0"
                fullWidth
              />
              <Button variant="primary" size="sm" onClick={handleSaveOverview} loading={overviewSaving}>
                Save changes
              </Button>
            </>
          ) : (
            <>
              <div>
                <Typography variant="small" tone="muted">Name</Typography>
                <Typography>{template.name}</Typography>
              </div>
              <div>
                <Typography variant="small" tone="muted">Version</Typography>
                <Typography>{template.version || '—'}</Typography>
              </div>
            </>
          )}
          <div>
            <Typography variant="small" tone="muted">ID</Typography>
            <Typography variant="small" className="font-mono">{template.id}</Typography>
          </div>
          <div>
            <Typography variant="small" tone="muted">Created at</Typography>
            <Typography variant="small">
              {template.created_at ? new Date(template.created_at).toLocaleString() : '—'}
            </Typography>
          </div>
        </div>
      )}

      {tab === 'questions' && (
        <div>
          {isDraft && (
            <div className="mb-4 flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAddQuestionOpen(true)}
                className="gap-1"
              >
                <Plus size={16} />
                Add question
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddByJsonOpen(true)}
                className="gap-1"
              >
                Add by JSON
              </Button>
            </div>
          )}
          <div className="overflow-hidden bg-white">
            <table className="w-full text-left">
              <thead className="border-b border-neutral-500">
                <tr>
                  <th className="px-4 py-2 text-sm font-normal text-neutral-700">Section</th>
                  <th className="px-4 py-2 text-sm font-normal text-neutral-700">Prompt</th>
                  <th className="px-4 py-2 text-sm font-normal text-neutral-700">Type</th>
                  <th className="px-4 py-2 text-sm font-normal text-neutral-700 w-20">Required</th>
                  <th className="px-4 py-2 text-sm font-normal text-neutral-700">Tags</th>
                  <th className="px-4 py-2 text-sm font-normal text-neutral-700 w-20">Status</th>
                  <th className="px-4 py-2 text-sm font-normal text-neutral-700 w-20">Position</th>
                  {isDraft && (
                    <th className="px-4 py-2 text-sm font-normal text-neutral-700 w-32">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {orderedSectionEntries(questionsBySec).flatMap(([section, questions]) =>
                  questions.map((q) => (
                    <tr key={q.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                      <td className="px-4 py-2 text-sm">{section}</td>
                      <td className="px-4 py-2 text-sm">{q.prompt}</td>
                      <td className="px-4 py-2 text-sm">{q.q_type}</td>
                      <td className="px-4 py-2 text-sm">{q.required ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2 text-sm">{Array.isArray(q.tags) ? q.tags.join(', ') : '—'}</td>
                      <td className="px-4 py-2">
                        <Badge tone={q.status === 'active' ? 'success' : 'neutral'} size="sm">
                          {q.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-sm">{q.position ?? '—'}</td>
                      {isDraft && (
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditQuestion(q)}
                              className="gap-0.5 p-1"
                              aria-label="Edit question"
                            >
                              <Pencil size={14} />
                            </Button>
                            {q.status === 'active' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setArchiveConfirm(q)}
                                className="gap-0.5 p-1"
                                aria-label="Archive"
                              >
                                <Archive size={14} />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnarchive(q)}
                                disabled={actionLoading}
                                className="gap-0.5 p-1"
                                aria-label="Restore"
                              >
                                <ArchiveRestore size={14} />
                              </Button>
                            )}
                            {q.status === 'active' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleReorder(section, questions, questions.indexOf(q), 'up')
                                  }
                                  disabled={actionLoading || questions.indexOf(q) === 0}
                                  className="gap-0.5 p-1"
                                  aria-label="Move up"
                                >
                                  <ChevronUp size={14} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleReorder(section, questions, questions.indexOf(q), 'down')
                                  }
                                  disabled={
                                    actionLoading || questions.indexOf(q) === questions.length - 1
                                  }
                                  className="gap-0.5 p-1"
                                  aria-label="Move down"
                                >
                                  <ChevronDown size={14} />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {template.questions.length === 0 && (
              <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                No questions yet. {isDraft && 'Add a question to get started.'}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'json' && (
        <pre className="p-4 bg-neutral-50 border border-neutral-200 text-xs overflow-auto max-h-[60vh]">
          {JSON.stringify(template, null, 2)}
        </pre>
      )}

      {addQuestionOpen && (
        <QuestionFormModal
          templateId={templateId}
          question={null}
          onClose={() => setAddQuestionOpen(false)}
          onSuccess={() => {
            setAddQuestionOpen(false)
            refetchTemplate()
          }}
        />
      )}
      {addByJsonOpen && (
        <AddQuestionByJsonModal
          templateId={templateId}
          onClose={() => setAddByJsonOpen(false)}
          onSuccess={() => {
            setAddByJsonOpen(false)
            refetchTemplate()
          }}
        />
      )}
      {editQuestion && (
        <QuestionFormModal
          templateId={templateId}
          question={editQuestion}
          onClose={() => setEditQuestion(null)}
          onSuccess={() => {
            setEditQuestion(null)
            refetchTemplate()
          }}
        />
      )}

      {archiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white shadow-xl max-w-sm w-full p-6">
            <Typography weight="semibold" className="mb-2">
              Archive this question?
            </Typography>
            <Typography variant="small" tone="muted" className="mb-4">
              Archived questions are not included when publishing. You can restore them later.
            </Typography>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setArchiveConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                tone="error"
                onClick={() => handleArchive(archiveConfirm)}
                loading={actionLoading}
              >
                Archive
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionFormModal({
  templateId,
  question,
  onClose,
  onSuccess,
}: {
  templateId: string
  question: templateService.SystemQuestion | null
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
        await templateService.updateAdminQuestion(question.id, {
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
        await templateService.addTemplateQuestion(templateId, {
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
      <div className="bg-white shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <Typography as="h2" weight="semibold" className="mb-4">
          {isEdit ? 'Edit question' : 'Add question'}
        </Typography>
        <div className="space-y-4">
          <div>
            <Typography variant="small" className="mb-1.5 block">Section</Typography>
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
            <Typography variant="small" className="mb-1.5 block">Type</Typography>
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
            <Typography variant="small" className="mb-1.5 block">Answer schema (JSON)</Typography>
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
            <Typography variant="small" className="mb-1.5 block">Visibility logic (JSON, optional)</Typography>
            <Textarea
              value={visibilityLogic}
              onChange={(e) => setVisibilityLogic(e.target.value)}
              placeholder="{}"
              fullWidth
              className="font-mono text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
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

const SAMPLE_QUESTION_JSON = {
  section: 'overview',
  prompt: 'What is the project goal?',
  q_type: 'textarea',
  required: true,
  help_text: 'Optional guidance for the user.',
  tags: ['goal', 'scope'],
  answer_schema: {},
  visibility_logic: null,
  position: 0,
}

function AddQuestionByJsonModal({
  templateId,
  onClose,
  onSuccess,
}: {
  templateId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [jsonTab, setJsonTab] = useState<'template' | 'paste'>('template')
  const [jsonInput, setJsonInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCopySample = () => {
    const text = JSON.stringify(SAMPLE_QUESTION_JSON, null, 2)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result)
        JSON.parse(text)
        setJsonInput(text)
        toast.success('File loaded')
      } catch {
        toast.error('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSubmit = async () => {
    const raw = jsonInput.trim()
    if (!raw) {
      toast.error('Paste JSON or upload a file')
      return
    }
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      toast.error('Invalid JSON')
      return
    }
    const items = Array.isArray(data) ? data : [data]
    if (items.length === 0) {
      toast.error('No question object(s) found')
      return
    }
    setLoading(true)
    let done = 0
    try {
      for (const item of items) {
        if (item === null || typeof item !== 'object') {
          toast.error('Each item must be an object')
          break
        }
        const o = item as Record<string, unknown>
        const section = typeof o.section === 'string' ? o.section : 'general'
        const prompt = typeof o.prompt === 'string' ? o.prompt : ''
        if (!prompt.trim()) {
          toast.error('"prompt" is required for each question')
          break
        }
        const qType = typeof o.q_type === 'string' ? o.q_type : 'text'
        const required = !!o.required
        const helpText = o.help_text != null ? String(o.help_text) : null
        const tags = Array.isArray(o.tags) ? o.tags.map((t) => String(t)) : undefined
        const answerSchema = o.answer_schema != null && typeof o.answer_schema === 'object' ? (o.answer_schema as Record<string, unknown>) : {}
        const visibilityLogic = o.visibility_logic != null ? o.visibility_logic : undefined
        const position = typeof o.position === 'number' ? o.position : undefined
        await templateService.addTemplateQuestion(templateId, {
          section,
          prompt: prompt.trim(),
          q_type: normalizeQuestionTypeForApi(qType),
          required,
          help_text: helpText?.trim() || null,
          tags,
          answer_schema: answerSchema,
          visibility_logic: visibilityLogic,
          position,
        })
        done += 1
      }
      if (done > 0) {
        toast.success(done === 1 ? 'Question created' : `${done} questions created`)
        onSuccess()
      }
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add question by JSON"
      size="lg"
      actions={[{ label: 'Cancel', onClick: onClose, variant: 'secondary' }]}
    >
      <div className="space-y-4">
        <div className="flex border-b border-neutral-200 gap-1">
          <button
            type="button"
            onClick={() => setJsonTab('template')}
            className={cn(
              'px-4 py-2 text-sm -mb-px border-b-2 transition-colors',
              jsonTab === 'template' ? 'border-primary text-primary font-medium' : 'border-transparent text-neutral-600 hover:text-neutral-900'
            )}
          >
            JSON template
          </button>
          <button
            type="button"
            onClick={() => setJsonTab('paste')}
            className={cn(
              'px-4 py-2 text-sm -mb-px border-b-2 transition-colors',
              jsonTab === 'paste' ? 'border-primary text-primary font-medium' : 'border-transparent text-neutral-600 hover:text-neutral-900'
            )}
          >
            Paste / Upload
          </button>
        </div>

        {jsonTab === 'template' && (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            <div className="text-sm text-neutral-700 space-y-2">
              <Typography weight="semibold" className="text-neutral-900">
                Field reference
              </Typography>
              <ul className="list-disc list-inside space-y-1 text-neutral-600">
                <li><strong>section</strong> — string, enum: overview | scope | risks | timeline | assumptions | general</li>
                <li><strong>prompt</strong> — string, required. Question text.</li>
                <li><strong>q_type</strong> — string, enum: text | textarea | single_select | multi_select | number | date | boolean | json</li>
                <li><strong>required</strong> — boolean. Whether the answer is mandatory.</li>
                <li><strong>help_text</strong> — string | null, optional. Guidance shown below the question.</li>
                <li><strong>tags</strong> — string[], optional. e.g. [&quot;scope&quot;, &quot;risk&quot;]</li>
                <li><strong>answer_schema</strong> — object. For text, textarea, number, date, boolean, json use <code className="bg-neutral-100 px-1">&#123;&#125;</code>. For single_select / multi_select use <code className="bg-neutral-100 px-1">&#123; &quot;options&quot;: [&#123;&quot;value&quot;: &quot;a&quot;, &quot;label&quot;: &quot;Label A&quot;&#125;] &#125;</code> or <code className="bg-neutral-100 px-1">&#123; &quot;enum&quot;: [&quot;a&quot;, &quot;b&quot;] &#125;</code>.</li>
                <li><strong>visibility_logic</strong> — object | null, optional. Conditional visibility rules.</li>
                <li><strong>position</strong> — number, optional. Order within section.</li>
              </ul>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Typography variant="small" weight="medium" className="text-neutral-600">
                  Sample (one question)
                </Typography>
                <Button variant="ghost" size="sm" onClick={handleCopySample} className="gap-1">
                  {copied ? 'Copied' : <><Copy size={14} /> Copy</>}
                </Button>
              </div>
              <pre className="p-3 bg-neutral-50 border border-neutral-200 rounded-md text-xs overflow-auto max-h-64 font-mono text-neutral-800">
                {JSON.stringify(SAMPLE_QUESTION_JSON, null, 2)}
              </pre>
            </div>
            <Typography variant="small" tone="muted">
              You can paste a single object or an array of objects to add multiple questions at once.
            </Typography>
          </div>
        )}

        {jsonTab === 'paste' && (
          <div className="space-y-4">
            <div>
              <Typography variant="small" weight="medium" className="text-neutral-600 mb-1 block">
                Paste JSON or upload file
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="sr-only"
                aria-label="Upload JSON file"
              />
              <div className="flex gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1"
                >
                  <FileJson size={14} />
                  Upload .json
                </Button>
              </div>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"section":"overview","prompt":"...","q_type":"text","required":true,"answer_schema":{}}'
                fullWidth
                className="font-mono text-sm min-h-[200px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!jsonInput.trim()}>
                Add question(s)
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
