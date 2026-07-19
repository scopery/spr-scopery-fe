'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ChevronDown, ChevronUp, Pencil, Plus, Save, Sparkles, Trash2 } from 'lucide-react'
import { Typography, Button, Badge, Input, Textarea, Select, ConfirmDialog, PageSkeleton } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import * as questionsApi from '@/modules/projects/questions/api/questions.api'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import { useProjectQuestions } from '@/modules/projects/questions/hooks/useProjectQuestions'
import type { ProjectQuestion } from '@/modules/projects/questions/model/questions'
import { canEditProject } from '@/modules/permissions/access/lib/permissions'
import { ApiError, getProblemCode } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import { AIGenerateQuestionsModal } from './AIGenerateQuestionsModal'
import { FEATURES } from '@/config/features'

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

function questionToSections(questions: ProjectQuestion[]): Record<string, ProjectQuestion[]> {
  const sorted = [...questions].sort((a, b) => {
    const sec = (a.section || '').localeCompare(b.section || '')
    if (sec !== 0) return sec
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
    {} as Record<string, ProjectQuestion[]>
  )
}

export function ProjectQuestionsView() {
  const params = useParams()
  const orgId = params.workspaceId as string
  const projectId = params.projectId as string

  const { project, loading: projectLoading } = useProject(orgId, projectId)
  const {
    activeQuestions,
    loading: questionsLoading,
    refetch: refetchQuestions,
  } = useProjectQuestions(orgId, projectId)

  const loading = projectLoading || questionsLoading
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editQuestion, setEditQuestion] = useState<ProjectQuestion | null>(null)
  const [confirmArchive, setConfirmArchive] = useState<ProjectQuestion | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false)

  const canEdit = project ? canEditProject(project.my_role) : false

  const sections = questionToSections(activeQuestions)

  const handleArchive = async () => {
    if (!orgId || !projectId || !confirmArchive || !canEdit) return
    setActionLoading(true)
    try {
      await questionsApi.archiveProjectQuestion(orgId, projectId, confirmArchive.id)
      toast.success('Question archived')
      refetchQuestions()
    } catch {
      toast.error('Failed to archive')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReorder = async (
    section: string,
    questions: ProjectQuestion[],
    fromIdx: number,
    direction: 'up' | 'down'
  ) => {
    if (!orgId || !projectId || !canEdit) return
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1
    if (toIdx < 0 || toIdx >= questions.length) return
    const reordered = [...questions]
    ;[reordered[fromIdx], reordered[toIdx]] = [reordered[toIdx], reordered[fromIdx]]
    const orderedIds = reordered.map((q) => q.id)
    setActionLoading(true)
    try {
      await questionsApi.reorderProjectQuestions(orgId, projectId, {
        section,
        ordered_ids: orderedIds,
      })
      toast.success('Order updated')
      refetchQuestions()
    } catch {
      toast.error('Failed to reorder')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <PageSkeleton variant="list" />
    )
  }

  if (!project) {
    return (
      <div>
        <Typography tone="error">Project not found</Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={orgId}
        project={{ id: projectId, name: project.name }}
        current="Questions"
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Questions
          </Typography>
          <Typography variant="small" tone="muted" className="mt-0.5">
            Manage elicitation questions for this project
          </Typography>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {FEATURES.aiGenerateQuestions && (
              <Button
                variant="neutral-flat"
                onClick={() => setAiGenerateOpen(true)}
                className="gap-1"
              >
                <Sparkles size={16} />
                AI Generate Questions
              </Button>
            )}
            <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
              <Plus size={16} />
              Add question
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {Object.entries(sections).map(([section, questions]) => (
          <div key={section} className="overflow-hidden">
            <div className="border-b border-neutral-500 px-4 py-2">
              <Typography weight="semibold" className="capitalize">
                {section}
              </Typography>
            </div>
            <ul className="divide-y divide-neutral-200">
              {questions.map((q, idx) => (
                <li key={q.id} className="hover:bg-neutral-50/50 flex items-center gap-4 px-4 py-3">
                  {canEdit && (
                    <div className="flex flex-col gap-0">
                      <button
                        type="button"
                        onClick={() => handleReorder(section, questions, idx, 'up')}
                        disabled={idx === 0 || actionLoading}
                        className="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-30"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorder(section, questions, idx, 'down')}
                        disabled={idx === questions.length - 1 || actionLoading}
                        className="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-30"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Typography weight="medium">{q.prompt}</Typography>
                    <div className="mt-1 flex gap-2">
                      <Badge variant="soft">
                        {q.q_type}
                      </Badge>
                      {q.required && (
                        <Badge tone="warning">
                          Required
                        </Badge>
                      )}
                      {q.source !== 'manual' && (
                        <Badge variant="soft" tone="default">
                          {q.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex shrink-0 gap-2">
                      {q.source === 'manual' && (
                        <Button variant="ghost" onClick={() => setEditQuestion(q)} icon={<Pencil size={16} />}>
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        tone="error"
                        onClick={() => setConfirmArchive(q)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {Object.keys(sections).length === 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
          <Typography tone="muted">No active questions. Add one to get started.</Typography>
          {canEdit && (
            <Button variant="primary" className="mt-4" onClick={() => setCreateModalOpen(true)} icon={<Plus size={16} />}>
              Add question
            </Button>
          )}
        </div>
      )}

      {createModalOpen && (
        <QuestionFormModal
          orgId={orgId}
          projectId={projectId}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false)
            refetchQuestions()
          }}
        />
      )}

      {editQuestion && (
        <QuestionFormModal
          orgId={orgId}
          projectId={projectId}
          question={editQuestion}
          onClose={() => setEditQuestion(null)}
          onSuccess={() => {
            setEditQuestion(null)
            refetchQuestions()
          }}
        />
      )}

      {confirmArchive && (
        <ConfirmDialog
          open={!!confirmArchive}
          onClose={() => setConfirmArchive(null)}
          title="Archive question"
          message={`Archive "${confirmArchive.prompt}"? It will no longer appear in sessions.`}
          confirmLabel="Archive"
          variant="danger"
          onConfirm={handleArchive}
          loading={actionLoading}
        />
      )}

      {FEATURES.aiGenerateQuestions && aiGenerateOpen && (
        <AIGenerateQuestionsModal
          open={aiGenerateOpen}
          onClose={() => setAiGenerateOpen(false)}
          orgId={orgId}
          projectId={projectId}
          project={project}
          onSuccess={refetchQuestions}
        />
      )}
    </div>
  )
}

function QuestionFormModal({
  orgId,
  projectId,
  question,
  onClose,
  onSuccess,
}: {
  orgId: string
  projectId: string
  question?: ProjectQuestion | null
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = !!question
  const [section, setSection] = useState(question?.section ?? 'overview')
  const [prompt, setPrompt] = useState(question?.prompt ?? '')
  const [qType, setQType] = useState(question?.q_type ?? 'text')
  const [required, setRequired] = useState(question?.required ?? false)
  const [helpText, setHelpText] = useState(question?.help_text ?? '')
  const [answerSchema, setAnswerSchema] = useState(
    question?.answer_schema ? JSON.stringify(question.answer_schema, null, 2) : '{}'
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error('Prompt is required')
      return
    }
    setLoading(true)
    try {
      let parsedSchema: Record<string, unknown> = {}
      try {
        parsedSchema = answerSchema.trim() ? JSON.parse(answerSchema) : {}
      } catch {
        toast.error('Invalid JSON in answer_schema')
        setLoading(false)
        return
      }
      if (isEdit && question) {
        await questionsApi.updateProjectQuestion(orgId, projectId, question.id, {
          section,
          prompt: prompt.trim(),
          q_type: qType,
          required,
          help_text: helpText.trim() || null,
          answer_schema: parsedSchema,
        })
        toast.success('Question updated')
      } else {
        await questionsApi.createProjectQuestion(orgId, projectId, {
          section,
          prompt: prompt.trim(),
          q_type: qType,
          required,
          help_text: helpText.trim() || null,
          answer_schema: parsedSchema,
        })
        toast.success('Question created')
      }
      onSuccess()
    } catch (err) {
      if (err instanceof ApiError && getProblemCode(err) === 'TEMPLATE_QUESTION_IMMUTABLE') {
        toast.error('Template questions cannot be edited')
      } else {
        toast.error(err instanceof ApiError ? err.problem.detail : 'Failed to save')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <Typography as="h2" weight="semibold" className="mb-4">
          {isEdit ? 'Edit question' : 'Add question'}
        </Typography>
        <div className="space-y-4">
          <Input
            label="Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="overview"
            fullWidth
            disabled={isEdit}
          />
          <Input
            label="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Question text"
            fullWidth
            required
          />
          <div>
            <Typography variant="small" className="mb-1.5 block">
              Type
            </Typography>
            <Select
              options={Q_TYPE_OPTIONS}
              value={qType}
              onValueChange={(v: string) => setQType(v)}
              className="w-full"
              disabled={isEdit}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
            />
            <label htmlFor="required" className="text-sm">
              Required
            </label>
          </div>
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
              placeholder='{"enum": ["a","b"]} or {"options": [{"value":"x","label":"X"}]}'
              fullWidth
              className="font-mono text-sm"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading} icon={<Save size={16} />}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
