'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Input,
  Modal,
  PageSkeleton,
  Stack,
  Textarea,
  Typography,
  DataTable, Card,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useEmailTemplates, useEmailTemplateVersions } from '../hooks/useEmailTemplates'
import * as notificationsApi from '../../infrastructure/api/notifications.api'
import type { EmailTemplate } from '../../domain/model/notification'

export function NadEmailTemplateStudioView() {
  const { items, loading, error, refetch } = useEmailTemplates({ page: 0, size: 100 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected: EmailTemplate | null = items.find((t) => t.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedId && items.length > 0) setSelectedId(items[0].id)
  }, [items, selectedId])

  const {
    items: versions,
    loading: versionsLoading,
    refetch: refetchVersions,
  } = useEmailTemplateVersions(selectedId)

  const [nameDraft, setNameDraft] = useState('')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    setNameDraft(selected?.name ?? '')
  }, [selected?.id, selected?.name])

  const [versionModalOpen, setVersionModalOpen] = useState(false)
  const [subjectTemplate, setSubjectTemplate] = useState('')
  const [htmlBodyTemplate, setHtmlBodyTemplate] = useState('')
  const [textBodyTemplate, setTextBodyTemplate] = useState('')
  const [savingVersion, setSavingVersion] = useState(false)

  const [publishingId, setPublishingId] = useState<string | null>(null)

  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null)
  const [samplePayloadText, setSamplePayloadText] = useState('{}')
  const [previewing, setPreviewing] = useState(false)
  const [previewResult, setPreviewResult] = useState<{
    subject: string
    htmlBody: string
    textBody: string
  } | null>(null)

  if (loading && items.length === 0) return <PageSkeleton variant="split" />

  const openPreview = (versionId: string) => {
    setPreviewVersionId(versionId)
    setSamplePayloadText('{}')
    setPreviewResult(null)
    setPreviewModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Email template studio
        </Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Edit names, draft new versions, and preview rendered output before publishing.
        </Typography>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <Card>
          {items.length === 0 ? (
            <div className="p-4">
              <Typography variant="small" tone="muted">
                No email templates
              </Typography>
            </div>
          ) : (
            <ul>
              {items.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`block w-full border-b border-neutral-100 px-4 py-3 text-left text-sm hover:bg-neutral-50 ${
                      t.id === selectedId ? 'bg-neutral-50 font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{t.name}</span>
                      <Badge tone={t.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                        {t.status}
                      </Badge>
                    </div>
                    <Typography
                      as="span"
                      variant="small"
                      tone="muted"
                      className="mt-0.5 block font-normal"
                    >
                      {t.code}
                    </Typography>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div>
          {!selected ? (
            <Card className="bg-neutral-50 p-6">
              <Typography variant="small" tone="muted">
                Select a template to view details.
              </Typography>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="p-4">
                <Typography variant="small" weight="semibold" className="mb-3">
                  Template
                </Typography>
                <Stack direction="horizontal" spacing="sm" align="end" className="flex-wrap">
                  <div className="w-72">
                    <Input
                      label="Name"
                      fullWidth
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    loading={savingName}
                    disabled={!nameDraft.trim() || nameDraft.trim() === selected.name}
                    onClick={() => {
                      setSavingName(true)
                      void notificationsApi
                        .updateEmailTemplate(selected.id, { name: nameDraft.trim() })
                        .then(() => {
                          toast.success('Template updated')
                          return refetch()
                        })
                        .catch((e) => toast.error(getProblemToastMessage(e)))
                        .finally(() => setSavingName(false))
                    }}
                  >
                    Save name
                  </Button>
                </Stack>
              </Card>

              <Card className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Typography variant="small" weight="semibold">
                    Versions
                  </Typography>
                  <Button size="sm" variant="secondary" onClick={() => setVersionModalOpen(true)}>
                    New draft version
                  </Button>
                </div>
                {versionsLoading ? (
                  <PageSkeleton variant="list" />
                ) : (
                  <div className="overflow-x-auto">
                    <DataTable
                      ariaLabel="Nad Email Template Studio"
                      rows={versions}
                      rowKey={(v) => String(v.id)}
                      emptyMessage="No items."
                      columns={[
                        { id: 'subject', header: 'Subject', accessor: 'subjectTemplate' },
                        {
                          id: 'status',
                          header: 'Status',
                          cell: (v) => (
                            <>
                              <Badge tone={v.status === 'ACTIVE' ? 'success' : 'neutral'}>
                                {v.status}
                              </Badge>
                            </>
                          ),
                        },
                        {
                          id: 'actions',
                          header: 'Actions',
                          cell: (v) => (
                            <>
                              <Stack direction="horizontal" spacing="sm">
                                <Button size="sm" variant="ghost" onClick={() => openPreview(v.id)}>
                                  Preview
                                </Button>
                                {v.status === 'DRAFT' ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    loading={publishingId === v.id}
                                    onClick={() => {
                                      setPublishingId(v.id)
                                      void notificationsApi
                                        .publishEmailTemplateVersion(selected.id, v.id)
                                        .then(() => {
                                          toast.success('Version published')
                                          return refetchVersions()
                                        })
                                        .catch((e) => toast.error(getProblemToastMessage(e)))
                                        .finally(() => setPublishingId(null))
                                    }}
                                  >
                                    Publish
                                  </Button>
                                ) : null}
                              </Stack>
                            </>
                          ),
                        },
                      ]}
                    />
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        title="Create draft version"
        size="lg"
        actions={[
          { label: 'Cancel', onClick: () => setVersionModalOpen(false), variant: 'ghost' },
          {
            label: 'Create',
            variant: 'primary',
            loading: savingVersion,
            onClick: () => {
              if (!selected || !subjectTemplate.trim() || !htmlBodyTemplate.trim()) return
              setSavingVersion(true)
              void notificationsApi
                .createEmailTemplateVersion(selected.id, {
                  subjectTemplate: subjectTemplate.trim(),
                  htmlBodyTemplate: htmlBodyTemplate.trim(),
                  textBodyTemplate: textBodyTemplate.trim() || undefined,
                })
                .then(() => {
                  toast.success('Draft version created')
                  setVersionModalOpen(false)
                  setSubjectTemplate('')
                  setHtmlBodyTemplate('')
                  setTextBodyTemplate('')
                  return refetchVersions()
                })
                .catch((e) => toast.error(getProblemToastMessage(e)))
                .finally(() => setSavingVersion(false))
            },
          },
        ]}
      >
        <div className="space-y-3">
          <Input
            label="Subject template"
            fullWidth
            placeholder="Task overdue: {{task.title}}"
            value={subjectTemplate}
            onChange={(e) => setSubjectTemplate(e.target.value)}
          />
          <Textarea
            label="HTML body template"
            fullWidth
            rows={6}
            value={htmlBodyTemplate}
            onChange={(e) => setHtmlBodyTemplate(e.target.value)}
          />
          <Textarea
            label="Text body template (optional)"
            fullWidth
            rows={4}
            value={textBodyTemplate}
            onChange={(e) => setTextBodyTemplate(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Preview rendered template"
        size="lg"
        actions={[
          { label: 'Close', onClick: () => setPreviewModalOpen(false), variant: 'ghost' },
          {
            label: 'Render preview',
            variant: 'primary',
            loading: previewing,
            onClick: () => {
              if (!previewVersionId) return
              let payload: Record<string, unknown>
              try {
                payload = JSON.parse(samplePayloadText || '{}')
              } catch {
                toast.error('Sample payload must be valid JSON')
                return
              }
              setPreviewing(true)
              void notificationsApi
                .previewEmailTemplate(previewVersionId, payload)
                .then((res) => setPreviewResult(res))
                .catch((e) => toast.error(getProblemToastMessage(e)))
                .finally(() => setPreviewing(false))
            },
          },
        ]}
      >
        <div className="space-y-3">
          <Textarea
            label="Sample payload (JSON)"
            fullWidth
            rows={4}
            value={samplePayloadText}
            onChange={(e) => setSamplePayloadText(e.target.value)}
          />
          {previewResult ? (
            <Card className="space-y-2 bg-neutral-50 p-3">
              <Typography variant="small" weight="semibold">
                Subject: {previewResult.subject}
              </Typography>
              <div>
                <Typography variant="small" tone="muted" className="mb-1">
                  HTML body
                </Typography>
                <Card
                  className="p-3 text-sm"
                  dangerouslySetInnerHTML={{ __html: previewResult.htmlBody }}
                />
              </div>
              {previewResult.textBody ? (
                <div>
                  <Typography variant="small" tone="muted" className="mb-1">
                    Text body
                  </Typography>
                  <pre className="whitespace-pre-wrap border border-neutral-200 bg-white p-3 text-sm">
                    {previewResult.textBody}
                  </pre>
                </div>
              ) : null}
            </Card>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}
