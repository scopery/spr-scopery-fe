'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button, Input, Modal, PageSkeleton, Typography } from '@/shared/ui'
import { useResourceCatalog } from '../hooks/useResourceCatalog'

export function ResourceRolesSkillsView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    roles,
    skills,
    loading,
    error,
    creatingRole,
    creatingSkill,
    createRole,
    createSkill,
  } = useResourceCatalog(workspaceId)

  const [roleModal, setRoleModal] = useState(false)
  const [skillModal, setSkillModal] = useState(false)
  const [roleForm, setRoleForm] = useState({ name: '', description: '' })
  const [skillForm, setSkillForm] = useState({ name: '', description: '' })

  if (loading) return <PageSkeleton variant="list" />
  if (error) {
    return (
      <div className="border border-error/30 bg-error/5 p-4">
        <Typography variant="small" tone="error">
          {error}
        </Typography>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Resource Roles & Skills
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Capacity planning catalog only. These are not IAM roles or cost roles.
          Edit/archive is unavailable until the backend adds those endpoints.
        </Typography>
      </div>

      <div className="mb-8 border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <Typography weight="semibold" variant="small">
            Resource Roles ({roles.length})
          </Typography>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setRoleModal(true)}
          >
            Add role
          </Button>
        </div>
        {roles.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Typography tone="muted" variant="small">
              No resource roles yet.
            </Typography>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {roles.map((role) => (
              <li key={role.id} className="px-4 py-3">
                <Typography weight="medium" variant="small">
                  {role.name}
                </Typography>
                {role.description ? (
                  <Typography variant="caption" tone="muted">
                    {role.description}
                  </Typography>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <Typography weight="semibold" variant="small">
            Resource Skills ({skills.length})
          </Typography>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setSkillModal(true)}
          >
            Add skill
          </Button>
        </div>
        {skills.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Typography tone="muted" variant="small">
              No resource skills yet.
            </Typography>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {skills.map((skill) => (
              <li key={skill.id} className="px-4 py-3">
                <Typography weight="medium" variant="small">
                  {skill.name}
                </Typography>
                {skill.description ? (
                  <Typography variant="caption" tone="muted">
                    {skill.description}
                  </Typography>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={roleModal}
        onClose={() => setRoleModal(false)}
        title="Add resource role"
        size="sm"
        actions={[
          { label: 'Cancel', onClick: () => setRoleModal(false), variant: 'ghost' },
          {
            label: 'Create',
            variant: 'primary',
            loading: creatingRole,
            onClick: async () => {
              await createRole({
                name: roleForm.name.trim(),
                description: roleForm.description.trim() || undefined,
              })
              setRoleModal(false)
              setRoleForm({ name: '', description: '' })
            },
          },
        ]}
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Name"
            value={roleForm.name}
            onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Description"
            value={roleForm.description}
            onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
      </Modal>

      <Modal
        open={skillModal}
        onClose={() => setSkillModal(false)}
        title="Add resource skill"
        size="sm"
        actions={[
          { label: 'Cancel', onClick: () => setSkillModal(false), variant: 'ghost' },
          {
            label: 'Create',
            variant: 'primary',
            loading: creatingSkill,
            onClick: async () => {
              await createSkill({
                name: skillForm.name.trim(),
                description: skillForm.description.trim() || undefined,
              })
              setSkillModal(false)
              setSkillForm({ name: '', description: '' })
            },
          },
        ]}
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Name"
            value={skillForm.name}
            onChange={(e) => setSkillForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Description"
            value={skillForm.description}
            onChange={(e) => setSkillForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
