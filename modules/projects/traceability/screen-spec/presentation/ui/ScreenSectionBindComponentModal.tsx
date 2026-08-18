'use client'

import { useEffect, useState } from 'react'
import { Modal, SearchableSelect, Typography } from '@/shared/ui'

export function ScreenSectionBindComponentModal({
  open,
  onClose,
  sectionName,
  components,
  saving,
  error,
  onBind,
}: {
  open: boolean
  onClose: () => void
  sectionName: string
  components: Array<{ id: string; code: string; name: string }>
  saving: boolean
  error: string | null
  onBind: (componentId: string) => Promise<void>
}) {
  const [componentId, setComponentId] = useState('')

  useEffect(() => {
    if (!open) return
    setComponentId('')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Bind component · ${sectionName}`}
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: saving ? 'Binding…' : 'Bind',
          onClick: () => void onBind(componentId),
          variant: 'primary',
          disabled: saving || !componentId,
          loading: saving,
        },
      ]}
    >
      <div className="space-y-3">
        <Typography variant="small" tone="muted">
          Copies this component’s fields into this section and tags them as copied. Binding the
          same component twice is rejected. Unlink later deletes those copied fields only — fields
          you added by hand stay.
        </Typography>
        {components.length === 0 ? (
          <Typography variant="small" tone="muted">
            Create a catalog component and add fields on it first.
          </Typography>
        ) : (
          <SearchableSelect
            value={componentId}
            onValueChange={setComponentId}
            options={components.map((c) => ({
              value: c.id,
              label: `${c.code} · ${c.name}`,
            }))}
            placeholder="Component"
            searchPlaceholder="Search component…"
          />
        )}
        {error ? (
          <Typography tone="error" variant="small">
            {error}
          </Typography>
        ) : null}
      </div>
    </Modal>
  )
}
