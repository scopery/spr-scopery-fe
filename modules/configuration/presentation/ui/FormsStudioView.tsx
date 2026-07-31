'use client'

import { Plus } from 'lucide-react'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Badge,
  Button,
  DataTable,
  Input,
  Link,
  Select,
  Typography,
  PageSkeleton,
} from '@/shared/ui'
import { useFormsStudio } from '../hooks/useFormsStudio'

export function FormsStudioView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { objectTypes, forms, loading, creating, createForm } = useFormsStudio(workspaceId)

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ formCode: '', name: '', objectTypeCode: '', formType: '' })

  if (loading) {
    return <PageSkeleton variant="list" />
  }

  const objectTypeOptions = objectTypes.map((t) => ({
    value: t.code,
    label: `${t.name} (${t.code})`,
  }))

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Forms
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Custom forms available to collect structured data in this workspace.
          </Typography>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)} icon={<Plus size={16} />}>
          New form
        </Button>
      </div>

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Forms"
          rows={forms}
          rowKey={(formItem) => formItem.id}
          emptyMessage="No forms yet."
          columns={[
            { id: 'name', header: 'Name', accessor: 'name' },
            { id: 'code', header: 'Code', accessor: 'formCode', kind: 'code' },
            { id: 'object-type', header: 'Object type', accessor: 'objectTypeCode' },
            { id: 'type', header: 'Type', accessor: (formItem) => formItem.formType ?? '—' },
            {
              id: 'status',
              header: 'Status',
              cell: (formItem) => <Badge tone="neutral">{formItem.status}</Badge>,
            },
            {
              id: 'actions',
              header: 'Actions',
              align: 'right',
              cell: (formItem) => (
                <Link
                  href={`/admin/workspaces/${workspaceId}/config/forms/${formItem.id}`}
                  size="sm"
                >
                  Open builder
                </Link>
              ),
            },
          ]}
        />
      </div>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-lg">
            <Typography as="h2" size="md" weight="medium" className="mb-2">
              New form
            </Typography>
            <div className="flex flex-col gap-4">
              <Input
                label="Form code"
                value={form.formCode}
                onChange={(e) => setForm((f) => ({ ...f, formCode: e.target.value }))}
              />
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <div>
                <Typography variant="small" tone="muted" className="mb-1.5">
                  Object type
                </Typography>
                <Select
                  value={form.objectTypeCode}
                  onValueChange={(v: string) => setForm((f) => ({ ...f, objectTypeCode: v }))}
                  options={objectTypeOptions}
                  placeholder="Select object type"
                />
              </div>
              <Input
                label="Form type (optional)"
                value={form.formType}
                onChange={(e) => setForm((f) => ({ ...f, formType: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  disabled={
                    creating || !form.formCode.trim() || !form.name.trim() || !form.objectTypeCode
                  }
                  onClick={() =>
                    void createForm({
                      formCode: form.formCode.trim(),
                      name: form.name.trim(),
                      objectTypeCode: form.objectTypeCode,
                      formType: form.formType.trim() || undefined,
                    }).then(() => {
                      setShowCreate(false)
                      setForm({ formCode: '', name: '', objectTypeCode: '', formType: '' })
                    })
                  }
                >
                  {creating ? 'Creating…' : 'Create'}
                </Button>
                <Button variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
