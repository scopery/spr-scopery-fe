'use client'

import { Plus } from 'lucide-react'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  DataTable,
  Input,
  Typography,
  Stack,
  Textarea,
  Badge,
  Switch,
  Spinner,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useControlledListDetail, useControlledValues } from '@/modules/controlled-lists'
import type { ControlledList } from '@/modules/controlled-lists'

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function isListLocked(list?: ControlledList | null): boolean {
  if (!list) return false
  if (typeof list.locked === 'boolean') return list.locked
  if (typeof list.is_locked === 'boolean') return list.is_locked
  return false
}

export function ControlledListDetailView() {
  const params = useParams()
  const searchParams = useSearchParams()

  const orgId = (params?.workspaceId as string) ?? ''
  const listId = (params?.listId as string) ?? ''
  const projectId = searchParams.get('projectId') ?? undefined

  const { list, loading: listLoading, error: listError, fetchDetail } = useControlledListDetail()

  const { values, loading: valuesLoading, error: valuesError, createValue } = useControlledValues()

  useEffect(() => {
    if (!orgId || !listId) return
    fetchDetail(orgId, listId)
  }, [orgId, listId, fetchDetail])

  const locked = isListLocked(list)

  const [valueKey, setValueKey] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState<string>('')
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const disabledReason = locked
    ? 'List is locked. Adding or editing values is disabled.'
    : 'Values listing endpoint is not available. You can add values and see only those created in this session.'

  const handleSubmit = async () => {
    if (!orgId || !listId || locked) return
    const next: Record<string, string> = {}
    if (!valueKey.trim()) next.value_key = 'Value key is required'
    if (!label.trim()) next.label = 'Label is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    try {
      const sort = sortOrder.trim() !== '' ? Number.parseInt(sortOrder, 10) : undefined
      await createValue(orgId, listId, {
        value_key: valueKey.trim(),
        label: label.trim(),
        description: description.trim() || undefined,
        sort_order: Number.isNaN(sort) ? undefined : sort,
        is_active: isActive,
      })
      setValueKey('')
      setLabel('')
      setDescription('')
      setSortOrder('')
      setIsActive(true)
      setErrors({})
    } catch {
      // Error already captured in valuesError and surfaced below.
    }
  }

  const listsPath = ROUTES.workspace.settingsControlledLists(orgId, projectId)

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <Card className="border-b border-neutral-200 p-xl">
        <Stack direction="vertical" spacing="md">
          <Stack
            direction="horizontal"
            justify="between"
            align="center"
            className="flex-wrap gap-md"
          >
            <Stack direction="horizontal" spacing="md" align="center">
              <Link href={listsPath} className="text-neutral-600 hover:text-neutral-900">
                <Typography variant="small">← Back to controlled lists</Typography>
              </Link>
              <Stack direction="vertical" spacing="xs">
                <Typography as="h1" size="2xl" weight="bold">
                  {list?.name ?? 'Controlled list'}
                </Typography>
                <Typography variant="small" tone="muted">
                  {list?.list_key}
                </Typography>
              </Stack>
              {locked && (
                <Badge tone="warning" variant="soft">
                  Locked
                </Badge>
              )}
            </Stack>
          </Stack>

          {(listError || valuesError) && (
            <Box padding="md" className="border-error/20 bg-error/5 rounded-lg border" role="alert">
              <Typography tone="error" variant="small">
                {listError ?? valuesError}
              </Typography>
            </Box>
          )}

          {!listError && (
            <Box
              padding="md"
              className="border-warning/20 bg-warning/5 rounded-lg border"
              role="status"
            >
              <Typography tone="warning" variant="small">
                Values listing endpoint is not available. This page shows only values created or
                updated in this session.
              </Typography>
            </Box>
          )}
        </Stack>
      </Card>

      <Box padding="xl" className="mx-auto max-w-5xl space-y-xl">
        <Card className="border border-neutral-200 p-lg">
          <Stack direction="vertical" spacing="md">
            <Typography as="h2" size="base" weight="semibold">
              List info
            </Typography>
            {listLoading ? (
              <Box display="flex" className="justify-center py-md">
                <Spinner size="sm" />
              </Box>
            ) : (
              <>
                <Typography variant="small" tone="muted">
                  {list?.description}
                </Typography>
                <Typography variant="small" tone="muted">
                  Updated at: {formatDate(list?.updated_at)}
                </Typography>
              </>
            )}
          </Stack>
        </Card>

        <Card className="border border-neutral-200 p-lg">
          <Stack direction="vertical" spacing="md">
            <Stack direction="horizontal" justify="between" align="center">
              <Typography as="h2" size="base" weight="semibold">
                Add value
              </Typography>
            </Stack>
            <Typography variant="small" tone="muted">
              {disabledReason}
            </Typography>
            <Stack direction="vertical" spacing="md">
              <Input
                label="Value key"
                type="text"
                required
                disabled={locked}
                value={valueKey}
                onChange={(e) => setValueKey(e.target.value)}
                error={errors.value_key}
                placeholder="E.g. APPROVED"
                fullWidth
              />
              <Input
                label="Label"
                type="text"
                required
                disabled={locked}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                error={errors.label}
                placeholder="Human-friendly label"
                fullWidth
              />
              <Textarea
                label="Description (optional)"
                disabled={locked}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain how this value is used"
                fullWidth
              />
              <Input
                label="Sort order (optional)"
                type="number"
                disabled={locked}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="1, 2, 3..."
                fullWidth
              />
              <Stack direction="horizontal" spacing="sm" align="center">
                <Switch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={locked}
                  aria-label="Is active"
                />
                <Typography variant="small" tone="muted">
                  Active
                </Typography>
              </Stack>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={locked}
                aria-label="Add value"
                icon={<Plus size={16} />}
              >
                Add value
              </Button>
            </Stack>
          </Stack>
        </Card>

        <Card className="border border-neutral-200 p-lg">
          <Stack direction="vertical" spacing="md">
            <Typography as="h2" size="base" weight="semibold">
              Values
            </Typography>
            {valuesLoading && values.length === 0 ? (
              <Card className="border border-neutral-200 bg-neutral-50 p-lg text-center">
                <Spinner size="sm" />
              </Card>
            ) : (
              <DataTable
                ariaLabel="Controlled list values"
                rows={values}
                rowKey={(value) => value.id}
                emptyMessage="No values to display yet. Listing endpoint is not available; values shown here are only those created in this session."
                columns={[
                  { id: 'key', header: 'Key', accessor: (v) => v.value_key || '—', kind: 'code' },
                  { id: 'label', header: 'Label', accessor: (v) => v.label || '—' },
                  {
                    id: 'description',
                    header: 'Description',
                    accessor: (v) => v.description ?? '—',
                  },
                  { id: 'sort', header: 'Sort', accessor: (v) => v.sort_order ?? '—' },
                  {
                    id: 'active',
                    header: 'Active',
                    cell: (v) => (
                      <Badge tone={v.is_active === false ? 'warning' : 'success'} variant="soft">
                        {v.is_active === false ? 'Inactive' : 'Active'}
                      </Badge>
                    ),
                  },
                  { id: 'updated', header: 'Updated', accessor: (v) => formatDate(v.updated_at) },
                  {
                    id: 'actions',
                    header: 'Actions',
                    accessor: () => 'Edit / Delete coming in later phase',
                  },
                ]}
              />
            )}
          </Stack>
        </Card>
      </Box>
    </main>
  )
}
