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
import { adminTemplatesApi } from '@/modules/admin'
import { useAdminTemplateDetail } from '@/modules/admin'
import { normalizeQuestionTypeForApi } from '@/utils/questionType'
import { toast } from 'sonner'
import { getProblemToastMessage, getFieldErrors } from '@/shared/lib/errorHandling'
import { cn } from '@/utils/cn'

import {
  SECTION_ORDER,
  sectionSortIndex,
  statusBadgeTone,
  questionsBySection,
  orderedSectionEntries,
  SECTION_OPTIONS,
  Q_TYPE_OPTIONS,
} from '../lib/template-detail-utils'
import { QuestionFormModal } from './QuestionFormModal'
import { AddQuestionByJsonModal } from './AddQuestionByJsonModal'

type TabId = 'overview' | 'questions' | 'json'

export function AdminTemplateDetailView() {
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
  const [editQuestion, setEditQuestion] = useState<adminTemplatesApi.SystemQuestion | null>(null)
  const [archiveConfirm, setArchiveConfirm] = useState<adminTemplatesApi.SystemQuestion | null>(
    null
  )
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
      await adminTemplatesApi.updateTemplate(templateId, {
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
      await adminTemplatesApi.publishTemplate(templateId)
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
      const created = await adminTemplatesApi.duplicateTemplate(templateId)
      toast.success('Template duplicated')
      router.push(ROUTES.admin.template(created.id))
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setDuplicating(false)
    }
  }

  const handleArchive = async (q: adminTemplatesApi.SystemQuestion) => {
    setActionLoading(true)
    try {
      await adminTemplatesApi.updateAdminQuestion(q.id, { status: 'archived' })
      toast.success('Question archived')
      refetchTemplate()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActionLoading(false)
      setArchiveConfirm(null)
    }
  }

  const handleUnarchive = async (q: adminTemplatesApi.SystemQuestion) => {
    setActionLoading(true)
    try {
      await adminTemplatesApi.updateAdminQuestion(q.id, { status: 'active' })
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
    questions: adminTemplatesApi.SystemQuestion[],
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
      await adminTemplatesApi.updateAdminQuestion(moved.id, { position: newPosition })
      await adminTemplatesApi.updateAdminQuestion(other.id, { position: swapPosition })
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
        <Link href={ROUTES.admin.templates} className="mt-2 inline-block text-primary">
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
    <div className="mx-auto p-6">
      <Link
        href={ROUTES.admin.templates}
        className="mb-4 inline-flex items-center gap-1 text-primary hover:underline"
      >
        <CircleArrowOutUpLeft size={20} />
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
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
        <div className="bg-warning/10 border-warning/30 mb-4 border p-3 text-sm text-neutral-700">
          Add at least one active question to publish this template.
        </div>
      )}

      <div className="mb-4 border-b border-neutral-200">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                '-mb-px px-4 py-2 text-sm',
                tab === t.id
                  ? 'border border-b-0 border-neutral-200 bg-white text-primary'
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
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveOverview}
                loading={overviewSaving}
              >
                Save changes
              </Button>
            </>
          ) : (
            <>
              <div>
                <Typography variant="small" tone="muted">
                  Name
                </Typography>
                <Typography>{template.name}</Typography>
              </div>
              <div>
                <Typography variant="small" tone="muted">
                  Version
                </Typography>
                <Typography>{template.version || '—'}</Typography>
              </div>
            </>
          )}
          <div>
            <Typography variant="small" tone="muted">
              ID
            </Typography>
            <Typography variant="small" className="font-mono">
              {template.id}
            </Typography>
          </div>
          <div>
            <Typography variant="small" tone="muted">
              Created at
            </Typography>
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
                  <th className="w-20 px-4 py-2 text-sm font-normal text-neutral-700">Required</th>
                  <th className="px-4 py-2 text-sm font-normal text-neutral-700">Tags</th>
                  <th className="w-20 px-4 py-2 text-sm font-normal text-neutral-700">Status</th>
                  <th className="w-20 px-4 py-2 text-sm font-normal text-neutral-700">Position</th>
                  {isDraft && (
                    <th className="w-32 px-4 py-2 text-sm font-normal text-neutral-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {orderedSectionEntries(questionsBySec).flatMap(([section, questions]) =>
                  questions.map((q) => (
                    <tr
                      key={q.id}
                      className="hover:bg-neutral-50/50 border-b border-neutral-100 last:border-0"
                    >
                      <td className="px-4 py-2 text-sm">{section}</td>
                      <td className="px-4 py-2 text-sm">{q.prompt}</td>
                      <td className="px-4 py-2 text-sm">{q.q_type}</td>
                      <td className="px-4 py-2 text-sm">{q.required ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2 text-sm">
                        {Array.isArray(q.tags) ? q.tags.join(', ') : '—'}
                      </td>
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
              <div className="px-4 py-8 text-center text-sm text-neutral-500">
                No questions yet. {isDraft && 'Add a question to get started.'}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'json' && (
        <pre className="max-h-[60vh] overflow-auto border border-neutral-200 bg-neutral-50 p-4 text-xs">
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
          <div className="w-full max-w-sm bg-white p-6 shadow-xl">
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
