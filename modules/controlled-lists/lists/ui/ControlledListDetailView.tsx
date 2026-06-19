'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Box,
  Button,
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

  const orgId = (params?.orgId as string) ?? ''
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

  const listsPath = ROUTES.org.settingsControlledLists(orgId, projectId)

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <Box padding="xl" background="white" shadow="sm" className="border-b border-neutral-200">
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
                <Badge tone="warning" variant="soft" size="sm">
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
      </Box>

      <Box padding="xl" className="mx-auto max-w-5xl space-y-xl">
        <Box
          padding="lg"
          background="white"
          radius="lg"
          shadow="sm"
          className="border border-neutral-200"
        >
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
        </Box>

        <Box
          padding="lg"
          background="white"
          radius="lg"
          shadow="sm"
          className="border border-neutral-200"
        >
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
              >
                Add value
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box
          padding="lg"
          background="white"
          radius="lg"
          shadow="sm"
          className="border border-neutral-200"
        >
          <Stack direction="vertical" spacing="md">
            <Typography as="h2" size="base" weight="semibold">
              Values
            </Typography>
            {valuesLoading && values.length === 0 ? (
              <Box
                padding="lg"
                className="rounded-lg border border-neutral-200 bg-neutral-50 text-center"
              >
                <Spinner size="sm" />
              </Box>
            ) : values.length === 0 ? (
              <Box
                padding="lg"
                className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-center"
              >
                <Typography tone="muted" className="mb-sm">
                  No values to display yet.
                </Typography>
                <Typography variant="small" tone="muted">
                  Listing endpoint is not available; values shown here are only those created in
                  this session via this form.
                </Typography>
              </Box>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="p-md text-sm font-semibold text-neutral-700">Key</th>
                      <th className="p-md text-sm font-semibold text-neutral-700">Label</th>
                      <th className="p-md text-sm font-semibold text-neutral-700">Description</th>
                      <th className="p-md text-sm font-semibold text-neutral-700">Sort</th>
                      <th className="p-md text-sm font-semibold text-neutral-700">Active</th>
                      <th className="p-md text-sm font-semibold text-neutral-700">Updated</th>
                      <th className="p-md text-sm font-semibold text-neutral-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {values.map((v) => (
                      <tr key={v.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="p-md">
                          <Typography weight="medium">{v.value_key}</Typography>
                        </td>
                        <td className="p-md">
                          <Typography>{v.label}</Typography>
                        </td>
                        <td className="p-md">
                          <Typography variant="small" tone="muted">
                            {v.description ?? '—'}
                          </Typography>
                        </td>
                        <td className="p-md">
                          <Typography variant="small" tone="muted">
                            {v.sort_order ?? '—'}
                          </Typography>
                        </td>
                        <td className="p-md">
                          <Badge
                            tone={v.is_active === false ? 'warning' : 'success'}
                            variant="soft"
                            size="sm"
                          >
                            {v.is_active === false ? 'Inactive' : 'Active'}
                          </Badge>
                        </td>
                        <td className="p-md">
                          <Typography variant="small" tone="muted">
                            {formatDate(v.updated_at)}
                          </Typography>
                        </td>
                        <td className="p-md">
                          <Typography variant="small" tone="muted">
                            Edit / Delete coming in later phase
                          </Typography>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Stack>
        </Box>
      </Box>
    </main>
  )
}
