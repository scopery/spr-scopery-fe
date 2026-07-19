'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { Badge, Button, Input, Modal, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { useProjectTemplates } from '../hooks/useProjectTemplates'
import type { ProjectTemplate, ProjectTemplateVersion } from '../../domain/model/project-template'

export function ProjectTemplatesLibraryView() {
  const [keyword, setKeyword] = useState('')
  const { items, loading, error, activate, deactivate, archive, loadVersions, apply } =
    useProjectTemplates({ keyword: keyword.trim() || undefined })

  const [applyTarget, setApplyTarget] = useState<ProjectTemplate | null>(null)
  const [versions, setVersions] = useState<ProjectTemplateVersion[]>([])
  const [versionId, setVersionId] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [projectName, setProjectName] = useState('')
  const [applying, setApplying] = useState(false)

  const openApply = async (t: ProjectTemplate) => {
    setApplyTarget(t)
    setProjectCode(t.code)
    setProjectName(t.name)
    setVersionId('')
    try {
      const vs = await loadVersions(t.id)
      setVersions(vs.filter((v) => v.status === 'PUBLISHED' || v.status === 'ACTIVE'))
      if (vs[0]) setVersionId(vs[0].id)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      setVersions([])
    }
  }

  if (loading && items.length === 0) return <PageSkeleton variant="list" />

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Project templates
        </Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Library lifecycle, apply-to-workspace, and structure builder.
        </Typography>
      </div>

      <div className="mb-4 w-64">
        <Input
          fullWidth
          placeholder="Search…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Scope</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="min-w-[14rem] px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    No templates
                  </Typography>
                </td>
              </tr>
            ) : (
              items.map((t) => (
                <tr key={t.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <Typography as="span" variant="small" className="font-mono">
                      {t.code}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3">{t.scope}</td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">{t.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Stack direction="horizontal" spacing="sm" className="flex-wrap">
                      <Button size="sm" variant="secondary" as={NextLink} href={ADMIN_ROUTES.projectTemplateBuilder(t.id)}>
                        Builder
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => void openApply(t)}>
                        Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void activate(t.id).catch((e) => toast.error(getProblemToastMessage(e)))
                        }
                      >
                        Activate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void deactivate(t.id).catch((e) =>
                            toast.error(getProblemToastMessage(e))
                          )
                        }
                      >
                        Deactivate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void archive(t.id).catch((e) => toast.error(getProblemToastMessage(e)))
                        }
                      >
                        Archive
                      </Button>
                    </Stack>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!applyTarget}
        onClose={() => setApplyTarget(null)}
        title={`Apply ${applyTarget?.name ?? 'template'}`}
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setApplyTarget(null), variant: 'ghost' },
          {
            label: 'Create project',
            variant: 'primary',
            loading: applying,
            onClick: () => {
              if (!applyTarget || !versionId || !workspaceId.trim() || !projectCode.trim() || !projectName.trim())
                return
              setApplying(true)
              void apply(applyTarget.id, versionId, {
                workspaceId: workspaceId.trim(),
                projectCode: projectCode.trim(),
                projectName: projectName.trim(),
                includeTemplateTasks: true,
                includeTemplateDependencies: true,
                copyEstimateHours: true,
              })
                .then(() => {
                  toast.success('Project created from template')
                  setApplyTarget(null)
                })
                .catch((e) => toast.error(getProblemToastMessage(e)))
                .finally(() => setApplying(false))
            },
          },
        ]}
      >
        <div className="space-y-3">
          <Input
            label="Workspace ID"
            fullWidth
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
          />
          <Input
            label="Project code"
            fullWidth
            value={projectCode}
            onChange={(e) => setProjectCode(e.target.value)}
          />
          <Input
            label="Project name"
            fullWidth
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <div>
            <Typography variant="small" className="mb-1.5">
              Template version
            </Typography>
            <select
              className="h-10 w-full border border-neutral-200 bg-white px-2 text-sm"
              value={versionId}
              onChange={(e) => setVersionId(e.target.value)}
            >
              {versions.length === 0 ? (
                <option value="">No published versions</option>
              ) : (
                versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (#{v.versionNumber}) — {v.status}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
