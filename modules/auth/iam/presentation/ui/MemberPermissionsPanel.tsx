'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  Input,
  PageSkeleton,
  Select,
  Stack,
  Typography,
} from '@/shared/ui'
import { UserSearchSelect, useResolveUsers, type PersonIdentity } from '@/modules/platform'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { cn } from '@/utils/cn'
import {
  useMemberPermissionsCatalog,
  useMemberPermissionsEditor,
  type MemberPermissionsScope,
} from '../../hooks/useMemberPermissions'
import type { MemberPermissionCatalogItem } from '../../model/member-permissions'

interface Props {
  scope: MemberPermissionsScope
  memberUserIds: string[]
  title?: string
  description?: string
}

const ALL_TAB = '__ALL__'

function formatModuleLabel(module: string): string {
  const raw = module.trim() || 'General'
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function MemberPermissionsPanel({
  scope,
  memberUserIds,
  title = 'Member permissions',
  description = 'Grant extra permissions beyond the defaults members get when they join. Default permissions are shown locked.',
}: Props) {
  const {
    items,
    loading: catalogLoading,
    error: catalogError,
    forbidden,
    refetch: refetchCatalog,
  } = useMemberPermissionsCatalog(scope)

  const [userId, setUserId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB)
  const [search, setSearch] = useState('')
  const [confirmGrantFull, setConfirmGrantFull] = useState(false)

  const {
    selected,
    loading: snapLoading,
    saving,
    isDirty,
    toggle,
    setMany,
    save,
  } = useMemberPermissionsEditor(scope, userId || null)

  const { labelFor, personFor } = useResolveUsers(memberUserIds)
  const memberPeople = useMemo(
    () =>
      memberUserIds.map(personFor).filter((person): person is PersonIdentity => Boolean(person)),
    [memberUserIds, personFor]
  )

  const editableItems = useMemo(() => items.filter((r) => !r.baseline), [items])

  const isHeld = useCallback(
    (row: MemberPermissionCatalogItem) =>
      Boolean(row.baseline) || selected.has(row.permissionActionId),
    [selected]
  )

  const confirmDiscardUnsaved = useCallback(() => {
    if (!isDirty) return true
    return window.confirm('You have unsaved permission changes. Leave without saving?')
  }, [isDirty])

  useEffect(() => {
    if (!isDirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    if (!isDirty) return
    const onDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as Element | null)?.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return
      }
      try {
        const url = new URL(href, window.location.href)
        if (url.origin !== window.location.origin) return
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return
        }
      } catch {
        return
      }
      if (!confirmDiscardUnsaved()) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('click', onDocumentClick, true)
    return () => document.removeEventListener('click', onDocumentClick, true)
  }, [confirmDiscardUnsaved, isDirty])

  const handleMemberChange = (nextUserId: string) => {
    if (nextUserId === userId) return
    if (!confirmDiscardUnsaved()) return
    setUserId(nextUserId)
  }

  const query = search.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    if (!query) return items
    return items.filter((item) => {
      const moduleKey = item.module?.trim() || 'General'
      const groupLabel = formatModuleLabel(moduleKey).toLowerCase()
      const groupMatches = groupLabel.includes(query) || moduleKey.toLowerCase().includes(query)
      if (groupMatches) return true
      return (
        item.title.toLowerCase().includes(query) ||
        (item.description ?? '').toLowerCase().includes(query)
      )
    })
  }, [items, query])

  const grouped = useMemo(() => {
    const map = new Map<string, MemberPermissionCatalogItem[]>()
    for (const item of filteredItems) {
      const key = item.module?.trim() || 'General'
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredItems])

  const tabs = useMemo(() => {
    const moduleTabs = grouped.map(([module, rows]) => {
      const enabled = rows.filter(isHeld).length
      return {
        id: module,
        label: formatModuleLabel(module),
        enabled,
        total: rows.length,
      }
    })
    return [
      {
        id: ALL_TAB,
        label: 'All',
        enabled: filteredItems.filter(isHeld).length,
        total: filteredItems.length,
      },
      ...moduleTabs,
    ]
  }, [filteredItems, grouped, isHeld])

  useEffect(() => {
    if (activeTab === ALL_TAB) return
    if (!grouped.some(([module]) => module === activeTab)) {
      setActiveTab(ALL_TAB)
    }
  }, [activeTab, grouped])

  const visibleRows = useMemo(() => {
    if (activeTab === ALL_TAB) return filteredItems
    return grouped.find(([module]) => module === activeTab)?.[1] ?? []
  }, [activeTab, filteredItems, grouped])

  const editableVisibleIds = useMemo(
    () => visibleRows.filter((r) => !r.baseline).map((r) => r.permissionActionId),
    [visibleRows]
  )

  const selectedCount = selected.size
  const editableTotal = editableItems.length
  const heldCount = items.filter(isHeld).length
  const totalCount = items.length
  const allGranted =
    editableTotal > 0 && editableItems.every((r) => selected.has(r.permissionActionId))

  const handleSave = async () => {
    try {
      await save()
      toast.success('Permissions updated')
      void refetchCatalog()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleConfirmGrantFull = () => {
    setMany(
      editableItems.map((r) => r.permissionActionId),
      true
    )
    setConfirmGrantFull(false)
    toast.success('All grantable permissions selected — remember to save')
  }

  if (catalogLoading && items.length === 0) {
    return <PageSkeleton variant="split" />
  }

  if (forbidden) {
    return (
      <Card className="border border-neutral-200 bg-neutral-50 p-4">
        <Typography variant="small" tone="muted">
          You cannot grant permissions on this resource. Only owners with delegable access can.
        </Typography>
      </Card>
    )
  }

  if (catalogError) {
    return (
      <Typography variant="small" tone="error">
        {catalogError}
      </Typography>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="border border-neutral-200 bg-neutral-50 p-4">
        <Typography as="h2" size="md" weight="semibold" className="mb-1">
          {title}
        </Typography>
        <Typography variant="small" tone="muted">
          No grantable permissions available for your account on this resource.
        </Typography>
      </Card>
    )
  }

  return (
    <Stack direction="vertical" spacing="lg">
      <div>
        <Typography as="h2" size="md" weight="semibold">
          {title}
        </Typography>
        <Typography variant="small" tone="muted" className="mt-1 max-w-2xl">
          {description}
        </Typography>
      </div>

      <Card className="border border-neutral-200 bg-neutral-50 p-4">
        <Typography variant="small" weight="medium" className="mb-2">
          Who are you granting to?
        </Typography>
        <div className="max-w-md">
          <UserSearchSelect
            label="Member"
            value={userId}
            onChange={handleMemberChange}
            seedPeople={memberPeople}
            allowRemoteSearch={false}
          />
        </div>
        {userId ? (
          <Typography variant="small" tone="muted" className="mt-2">
            Editing: <span className="font-medium text-neutral-800">{labelFor(userId)}</span>
            {' · '}
            {heldCount} of {totalCount} permissions allowed
            {editableTotal > 0 ? (
              <>
                {' · '}
                {selectedCount} extra grantable
              </>
            ) : null}
            {isDirty ? (
              <>
                {' · '}
                <span className="font-medium text-warning">Unsaved changes</span>
              </>
            ) : null}
          </Typography>
        ) : null}
      </Card>

      {!userId ? (
        <Card className="border border-dashed border-neutral-300 bg-white p-8 text-center">
          <Typography variant="small" tone="muted">
            Select a member above to review and tick permissions.
          </Typography>
        </Card>
      ) : snapLoading ? (
        <PageSkeleton variant="split" />
      ) : (
        <>
          <div className="w-full max-w-lg">
            <Input
              size="md"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search permissions or groups…"
              aria-label="Search permissions or groups"
              fullWidth
            />
          </div>

          <div className="md:hidden">
            <Select
              value={activeTab}
              onValueChange={setActiveTab}
              options={tabs.map((tab) => ({
                value: tab.id,
                label: `${tab.label} (${tab.enabled}/${tab.total})`,
              }))}
              className="w-full"
              aria-label="Permission group"
            />
          </div>

          <div className="flex h-[min(36rem,calc(100vh-14rem))] flex-col border border-neutral-200 bg-white md:flex-row">
            <nav
              className="hidden w-52 shrink-0 overflow-y-auto border-b border-neutral-200 md:block md:border-b-0 md:border-r"
              aria-label="Permission groups"
            >
              <ul className="py-1">
                {tabs.map((tab) => {
                  const active = activeTab === tab.id
                  const complete = tab.total > 0 && tab.enabled === tab.total
                  return (
                    <li key={tab.id}>
                      <button
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 border-l-2 px-3 py-2 text-left text-sm transition-colors',
                          active
                            ? 'bg-primary/5 border-l-primary font-medium text-primary'
                            : 'border-l-transparent text-neutral-700 hover:bg-neutral-50'
                        )}
                      >
                        <span className="min-w-0 truncate">{tab.label}</span>
                        <Badge
                          variant="soft"
                          size="sm"
                          tone={complete ? 'success' : active ? 'primary' : 'neutral'}
                          className="shrink-0 px-1.5 py-0 text-[11px] leading-none"
                        >
                          {tab.enabled}/{tab.total}
                        </Badge>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <section className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Typography variant="small" weight="semibold">
                    {activeTab === ALL_TAB ? 'All permissions' : formatModuleLabel(activeTab)}
                  </Typography>
                  <Badge variant="soft" tone="neutral" size="sm">
                    {visibleRows.filter(isHeld).length}/{visibleRows.length}
                  </Badge>
                </div>
                {editableVisibleIds.length > 0 ? (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      const allOn = editableVisibleIds.every((id) => selected.has(id))
                      setMany(editableVisibleIds, !allOn)
                    }}
                  >
                    {editableVisibleIds.every((id) => selected.has(id))
                      ? 'Clear grantable in this group'
                      : 'Select all grantable in this group'}
                  </button>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {visibleRows.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Typography variant="small" tone="muted">
                      {query
                        ? `No permissions match “${search.trim()}”.`
                        : 'No permissions in this group.'}
                    </Typography>
                  </div>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {visibleRows.map((row) => {
                      const locked = Boolean(row.baseline)
                      const checked = isHeld(row)
                      return (
                        <li key={row.permissionActionId}>
                          <label
                            className={cn(
                              'flex gap-2.5 px-4 py-2.5 transition-colors',
                              locked ? 'bg-neutral-50/80 cursor-default' : 'cursor-pointer',
                              !locked && checked ? 'bg-primary/5' : null,
                              !locked && !checked ? 'hover:bg-neutral-50' : null
                            )}
                          >
                            <div className="pt-0.5">
                              <Checkbox
                                size="sm"
                                checked={checked}
                                disabled={locked}
                                onChange={(e) => {
                                  if (locked) return
                                  toggle(row.permissionActionId, e.target.checked)
                                }}
                                aria-label={
                                  locked
                                    ? `${row.title} (default, cannot change)`
                                    : `Allow ${row.title}`
                                }
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Typography
                                  variant="small"
                                  weight="medium"
                                  className="text-neutral-900"
                                >
                                  {row.title}
                                </Typography>
                                {locked ? (
                                  <Badge variant="soft" tone="neutral" size="sm">
                                    Default
                                  </Badge>
                                ) : null}
                                {activeTab === ALL_TAB || query ? (
                                  <Badge variant="soft" tone="neutral" size="sm">
                                    {formatModuleLabel(row.module || 'General')}
                                  </Badge>
                                ) : null}
                              </div>
                              <Typography
                                variant="small"
                                tone="muted"
                                className="mt-0.5 leading-relaxed"
                              >
                                {locked
                                  ? `${row.description || 'Included when the member joined.'} Cannot be removed here.`
                                  : row.description || 'No description available.'}
                              </Typography>
                            </div>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border border-neutral-200 bg-white px-4 py-3 shadow-sm">
            <Typography variant="small" tone="muted">
              {isDirty ? (
                <>
                  Unsaved changes for{' '}
                  <span className="font-medium text-neutral-800">{labelFor(userId)}</span>
                  {' · '}
                  {selectedCount} extra selected — Save to apply
                </>
              ) : (
                <>
                  {heldCount} permission{heldCount === 1 ? '' : 's'} for{' '}
                  <span className="font-medium text-neutral-800">{labelFor(userId)}</span>
                  {selectedCount > 0 ? ` · ${selectedCount} extra` : ''}
                </>
              )}
            </Typography>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="bg-neutral-100 hover:bg-neutral-200"
                disabled={allGranted}
                onClick={() => setConfirmGrantFull(true)}
              >
                Grant full
              </Button>
              <Button
                size="sm"
                variant="primary"
                loading={saving}
                disabled={!isDirty}
                onClick={() => void handleSave()}
              >
                Save permissions
              </Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmGrantFull}
        onClose={() => setConfirmGrantFull(false)}
        title="Grant all permissions?"
        message={`Select every grantable permission (${editableTotal}) for ${
          userId ? labelFor(userId) : 'this member'
        }. Default join permissions stay as they are. You still need to press Save to apply.`}
        confirmLabel="Grant full"
        onConfirm={handleConfirmGrantFull}
      />
    </Stack>
  )
}
