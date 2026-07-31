'use client'

import { FolderOpen, Plus } from 'lucide-react'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Modal,
  Select,
  Stack,
  Typography,
  PageSkeleton,
} from '@/shared/ui'
import { useRateCardLibrary } from '../hooks/useRateCardLibrary'
import { RateCardScope } from '../../domain/enums/rate-card.enum'
import { ROUTES } from '@/constants/routes'

const SCOPE_OPTIONS = [
  { value: RateCardScope.Workspace, label: 'Workspace' },
  { value: RateCardScope.Organization, label: 'Organization' },
  { value: RateCardScope.Client, label: 'Client' },
  { value: RateCardScope.Project, label: 'Project' },
]

function statusTone(status: string): 'success' | 'neutral' | 'warning' {
  if (status === 'ACTIVE') return 'success'
  if (status === 'DRAFT') return 'warning'
  return 'neutral'
}

export function RateCardLibraryView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const router = useRouter()
  const { rateCards, loading, error, creating, search, setSearch, createRateCard } =
    useRateCardLibrary(workspaceId)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [form, setForm] = useState({
    code: '',
    name: '',
    scope: RateCardScope.Workspace as string,
    defaultCurrencyCode: 'USD',
  })

  if (loading) {
    return <PageSkeleton variant="list" />
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-4">
        <Typography variant="small" className="text-red-700">
          {error}
        </Typography>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Rate Cards
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Rate cards define cost and billing rates by cost role, seniority, and location.
          </Typography>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          icon={<Plus size={16} />}
        >
          New rate card
        </Button>
      </div>

      <div className="mb-4 max-w-sm">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or code"
        />
      </div>

      <Card className="border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Rate cards"
          rows={rateCards}
          rowKey={(card) => card.id}
          emptyMessage="No rate cards yet. Create one to start defining rates."
          columns={[
            { id: 'code', header: 'Code', accessor: (card) => card.code || '—', kind: 'code' },
            { id: 'name', header: 'Name', accessor: (card) => card.name || '—' },
            { id: 'scope', header: 'Scope', accessor: 'scope' },
            { id: 'currency', header: 'Currency', accessor: 'defaultCurrencyCode' },
            {
              id: 'default',
              header: 'Default',
              accessor: (card) => (card.isDefault ? 'Yes' : '—'),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (card) => (
                <Badge variant="solid" tone={statusTone(String(card.status))}>
                  {String(card.status)
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </Badge>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              align: 'right',
              cell: (card) => (
                <Button
                  variant="outline"
                  onClick={() => router.push(ROUTES.admin.workspaceRateCard(workspaceId, card.id))}
                  icon={<FolderOpen size={16} />}
                >
                  Open
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New rate card"
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setShowCreateModal(false), variant: 'ghost' },
          {
            label: creating ? 'Creating…' : 'Create',
            onClick: async () => {
              const created = await createRateCard({
                code: form.code.trim(),
                name: form.name.trim(),
                scope: form.scope,
                defaultCurrencyCode: form.defaultCurrencyCode.trim().toUpperCase(),
              })
              setShowCreateModal(false)
              setForm({
                code: '',
                name: '',
                scope: RateCardScope.Workspace,
                defaultCurrencyCode: 'USD',
              })
              if (created) {
                router.push(ROUTES.admin.workspaceRateCard(workspaceId, created.id))
              }
            },
            variant: 'primary',
            loading: creating,
            disabled: !form.code.trim() || !form.name.trim() || !form.defaultCurrencyCode.trim(),
          },
        ]}
      >
        <Stack direction="vertical" spacing="md">
          <Input
            label="Code"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <div>
            <Typography variant="small" tone="muted" className="mb-1.5">
              Scope
            </Typography>
            <Select
              value={form.scope}
              onValueChange={(v: string) => setForm((f) => ({ ...f, scope: v }))}
              options={SCOPE_OPTIONS}
            />
          </div>
          <Input
            label="Default currency (ISO 4217)"
            value={form.defaultCurrencyCode}
            onChange={(e) => setForm((f) => ({ ...f, defaultCurrencyCode: e.target.value }))}
            placeholder="USD"
          />
        </Stack>
      </Modal>
    </div>
  )
}
