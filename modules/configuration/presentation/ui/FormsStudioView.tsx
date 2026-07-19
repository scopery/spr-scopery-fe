'use client'

import { Plus } from 'lucide-react'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge, Button, Input, Link, Select, Typography, PageSkeleton } from '@/shared/ui'
import { useFormsStudio } from '../hooks/useFormsStudio'

export function FormsStudioView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { objectTypes, forms, loading, creating, createForm } = useFormsStudio(workspaceId)

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ formCode: '', name: '', objectTypeCode: '', formType: '' })

  if (loading) {
    return (
      <PageSkeleton variant="list" />
    )
  }

  const objectTypeOptions = objectTypes.map((t) => ({ value: t.code, label: `${t.name} (${t.code})` }))

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
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
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Object type</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => (
              <tr key={f.id} className="border-t border-neutral-100">
                <td className="px-3 py-2">{f.name}</td>
                <td className="px-3 py-2 font-mono text-xs">{f.formCode}</td>
                <td className="px-3 py-2">{f.objectTypeCode}</td>
                <td className="px-3 py-2">{f.formType ?? '—'}</td>
                <td className="px-3 py-2">
                  <Badge tone="neutral">
                    {f.status}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/workspaces/${workspaceId}/config/forms/${f.id}`} size="sm">
                    Open builder
                  </Link>
                </td>
              </tr>
            ))}
            {forms.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center">
                  <Typography variant="small" tone="muted">
                    No forms yet.
                  </Typography>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-lg">
            <Typography as="h2" size="lg" weight="semibold" className="mb-4">
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
