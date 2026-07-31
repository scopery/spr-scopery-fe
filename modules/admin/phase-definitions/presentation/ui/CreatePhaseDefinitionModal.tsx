'use client'

import { useState } from 'react'
import { Checkbox, Input, Modal, Select } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { PhaseDefinitionScope } from '../../domain/enums/phase-definition.enum'
import type { CreatePhaseDefinitionPayload } from '../../domain/model/phase-definition'
import { AdminWorkspaceSearchSelect } from '@/modules/admin/workspaces'

const SCOPE_OPTIONS = [
  { value: PhaseDefinitionScope.System, label: 'System' },
  { value: PhaseDefinitionScope.Organization, label: 'Organization' },
  { value: PhaseDefinitionScope.Workspace, label: 'Workspace' },
]

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (
    scope: string,
    body: CreatePhaseDefinitionPayload & { workspaceId?: string }
  ) => Promise<void>
}

export function CreatePhaseDefinitionModal({ open, onClose, onCreate }: Props) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [scope, setScope] = useState<string>(PhaseDefinitionScope.System)
  const [workspaceId, setWorkspaceId] = useState('')
  const [displayOrder, setDisplayOrder] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function handleClose() {
    setCode('')
    setName('')
    setScope(PhaseDefinitionScope.System)
    setWorkspaceId('')
    setDisplayOrder('')
    setIsDefault(false)
    onClose()
  }

  function handleCreate() {
    if (!code.trim() || !name.trim()) return
    if (scope === PhaseDefinitionScope.Workspace && !workspaceId.trim()) return
    setSubmitting(true)
    const body: CreatePhaseDefinitionPayload & { workspaceId?: string } = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      scope,
      ...(displayOrder !== '' ? { displayOrder: Number(displayOrder) } : {}),
      isDefault,
      ...(scope === PhaseDefinitionScope.Workspace ? { workspaceId: workspaceId.trim() } : {}),
    }
    void onCreate(scope, body)
      .then(() => {
        toast.success('Phase definition created')
        handleClose()
      })
      .catch((e) => toast.error(getProblemToastMessage(e)))
      .finally(() => setSubmitting(false))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create phase definition"
      size="sm"
      actions={[
        { label: 'Cancel', onClick: handleClose, variant: 'ghost' },
        {
          label: 'Create',
          loading: submitting,
          variant: 'primary',
          onClick: handleCreate,
        },
      ]}
    >
      <div className="space-y-3">
        <Input
          label="Code"
          fullWidth
          placeholder="e.g. PLANNING"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Input
          label="Name"
          fullWidth
          placeholder="e.g. Planning"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Scope</label>
          <Select
            value={scope}
            onValueChange={setScope}
            options={SCOPE_OPTIONS}
            className="w-full"
          />
        </div>
        {scope === PhaseDefinitionScope.Workspace && (
          <AdminWorkspaceSearchSelect value={workspaceId} onChange={setWorkspaceId} />
        )}
        <Input
          label="Display order"
          fullWidth
          type="number"
          placeholder="e.g. 1"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
        />
        <Checkbox
          id="is-default"
          label="Is default"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
        />
      </div>
    </Modal>
  )
}
