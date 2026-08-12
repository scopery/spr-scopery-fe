'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PageSkeleton, Select, Stack, Typography } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { useApplicationWorkbench } from '../hooks/useApplicationWorkbench'
import { useApplicationRelatedFunctions } from '../hooks/useApplicationRelatedFunctions'
import { useStructureRelations } from '../hooks/useStructureRelations'
import {
  getArchitectureDeleteBlockReason,
  isArchitectureNodeDeletable,
} from '../model/architecture-delete.rules'
import type {
  ArchitectureCatalogNode,
  BrowseCatalogNode,
} from '../model/architecture-workbench'
import { ArchitectureCatalogTable } from './ArchitectureCatalogTable'
import { CatalogAddBar } from './CatalogAddBar'
import type { CatalogAddKind, CatalogBulkCreateInput } from './CatalogBulkAddModal'
import * as traceabilityApi from '../api/traceability.api'
import { NodeDetailInspector, type NodeEditPayload } from './NodeDetailInspector'
import { SimpleExcelImportPanel } from './SimpleExcelImportPanel'
import { OverallStructurePanel } from './OverallStructurePanel'
import {
  API_ENDPOINT_IMPORT_SPEC,
  COMPONENT_IMPORT_SPEC,
  DATA_ENTITY_IMPORT_SPEC,
  MODULE_IMPORT_SPEC,
  SCREEN_IMPORT_SPEC,
} from '../lib/excelImportSpecs'

type MainTab = 'browse' | 'structure' | 'import'
type ImportKind = 'modules' | 'screens' | 'apis' | 'components' | 'entities'

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: 'browse', label: 'Browse' },
  { id: 'structure', label: 'Structure' },
  { id: 'import', label: 'Import' },
]

const IMPORT_OPTIONS: { value: ImportKind; label: string }[] = [
  { value: 'modules', label: 'Modules' },
  { value: 'screens', label: 'Screens' },
  { value: 'apis', label: 'API Endpoints' },
  { value: 'components', label: 'Components' },
  { value: 'entities', label: 'Data Entities' },
]

export function ApplicationWorkbenchView() {
  const { workspaceId, applicationId } = useParams<{
    workspaceId: string
    applicationId: string
  }>()
  const {
    application,
    modules,
    screens,
    apiEndpoints,
    components,
    dataEntities,
    communications,
    loading,
    error,
    refetch,
    createModule,
    updateModule,
    removeModule,
    createScreen,
    updateScreen,
    removeScreen,
    createEndpoint,
    updateEndpoint,
    removeEndpoint,
    createComponent,
    updateComponent,
    removeComponent,
    createEntity,
    updateEntity,
    removeEntity,
    createCommunication,
    updateCommunication,
    removeCommunication,
  } = useApplicationWorkbench(workspaceId, applicationId)

  const [tab, setTab] = useState<MainTab>('browse')
  const [importKind, setImportKind] = useState<ImportKind>('modules')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const { items: relatedFunctionNodes } = useApplicationRelatedFunctions(
    workspaceId,
    applicationId,
    tab === 'browse'
  )
  const {
    items: structureRelations,
    refetch: refetchStructureRelations,
  } = useStructureRelations(workspaceId, applicationId)

  useEffect(() => {
    if (tab === 'browse') void refetchStructureRelations()
  }, [tab, refetchStructureRelations])

  const handleSubmitBulk = useCallback(
    async (kind: CatalogAddKind, items: CatalogBulkCreateInput[]) => {
      switch (kind) {
        case 'MODULE':
          return traceabilityApi.submitAppModulesBulk(
            workspaceId,
            applicationId,
            items.map((i) => ({
              code: i.code,
              name: i.name,
              description: i.extra ?? null,
            }))
          )
        case 'SCREEN':
          return traceabilityApi.submitScreensBulk(
            workspaceId,
            applicationId,
            items.map((i) => ({
              code: i.code,
              name: i.name,
              routePath: i.extra ?? null,
            }))
          )
        case 'API_ENDPOINT':
          return traceabilityApi.submitApiEndpointsBulk(
            workspaceId,
            applicationId,
            items.map((i) => ({
              method: i.code.toUpperCase(),
              pathPattern: i.name,
              name: i.extra ?? null,
            }))
          )
        case 'COMPONENT':
          return traceabilityApi.submitAppComponentsBulk(
            workspaceId,
            applicationId,
            items.map((i) => ({
              code: i.code,
              name: i.name,
              componentType: i.extra ?? null,
            }))
          )
        case 'DATA_ENTITY':
          return traceabilityApi.submitDataEntitiesBulk(
            workspaceId,
            applicationId,
            items.map((i) => ({
              code: i.code,
              name: i.name,
              tableName: i.extra ?? null,
            }))
          )
        case 'COMMUNICATION':
          throw new Error('Bulk create is not available for Communication yet — use Single add')
        default:
          throw new Error(`Unsupported catalog kind: ${kind}`)
      }
    },
    [workspaceId, applicationId]
  )

  const architectureNodes = useMemo<ArchitectureCatalogNode[]>(() => {
    return [
      ...modules.map((m) => ({
        id: m.id,
        type: 'MODULE' as const,
        code: m.code,
        name: m.name,
        status: m.status,
        secondary: m.description ?? null,
      })),
      ...screens.map((s) => ({
        id: s.id,
        type: 'SCREEN' as const,
        code: s.code,
        name: s.name,
        status: s.status,
        secondary: s.routePath ?? null,
      })),
      ...apiEndpoints.map((e) => ({
        id: e.id,
        type: 'API_ENDPOINT' as const,
        code: e.method,
        name: e.pathPattern,
        status: e.status,
        secondary: e.name ?? null,
      })),
      ...components.map((c) => ({
        id: c.id,
        type: 'COMPONENT' as const,
        code: c.code,
        name: c.name,
        status: c.status,
        secondary: c.componentType ?? null,
      })),
      ...dataEntities.map((e) => ({
        id: e.id,
        type: 'DATA_ENTITY' as const,
        code: e.code,
        name: e.name,
        status: e.status,
        secondary: e.tableName ?? null,
      })),
      ...communications.map((c) => ({
        id: c.id,
        type: 'COMMUNICATION' as const,
        code: c.code,
        name: c.name,
        status: c.status,
        secondary: c.triggerKey ?? null,
      })),
    ]
  }, [modules, screens, apiEndpoints, components, dataEntities, communications])

  const catalogNodes = useMemo<BrowseCatalogNode[]>(
    () => [...architectureNodes, ...relatedFunctionNodes],
    [architectureNodes, relatedFunctionNodes]
  )

  const selectedNode = useMemo(() => {
    if (!selectedKey) return null
    return catalogNodes.find((n) => `${n.type}:${n.id}` === selectedKey) ?? null
  }, [catalogNodes, selectedKey])

  // Clear selection only after catalog has data and the node is truly gone
  // (avoid wiping FUNCTION selection while related-functions reload).
  useEffect(() => {
    if (selectedKey && catalogNodes.length > 0 && !selectedNode) setSelectedKey(null)
  }, [selectedKey, selectedNode, catalogNodes.length])

  if (loading && !application) {
    return <PageSkeleton variant="list" className="h-full p-4" />
  }
  if (error && !application) {
    return (
      <Stack direction="vertical" spacing="md" className="p-4">
        <Typography tone="error">{error}</Typography>
        <Link href={ROUTES.workspace.applications(workspaceId)} className="text-sm underline">
          Back to applications
        </Link>
      </Stack>
    )
  }
  if (!application) {
    return (
      <Stack direction="vertical" spacing="md" className="p-4">
        <Typography tone="muted">Application not found.</Typography>
        <Link href={ROUTES.workspace.applications(workspaceId)} className="text-sm underline">
          Back to applications
        </Link>
      </Stack>
    )
  }

  const closeInspector = () => setSelectedKey(null)

  const saveNode = async (node: BrowseCatalogNode, payload: NodeEditPayload) => {
    switch (node.type) {
      case 'FUNCTION':
        return
      case 'MODULE':
        await updateModule(node.id, {
          name: payload.name,
          description: payload.secondary ?? null,
        })
        break
      case 'SCREEN':
        await updateScreen(node.id, {
          name: payload.name,
          routePath: payload.secondary ?? null,
        })
        break
      case 'API_ENDPOINT': {
        const current = apiEndpoints.find((e) => e.id === node.id)
        await updateEndpoint(node.id, {
          method: current?.method ?? node.code,
          pathPattern: payload.name,
          name: payload.secondary ?? current?.name ?? payload.name,
        })
        break
      }
      case 'COMPONENT':
        await updateComponent(node.id, {
          name: payload.name,
          componentType: payload.secondary ?? null,
        })
        break
      case 'DATA_ENTITY':
        await updateEntity(node.id, {
          name: payload.name,
          tableName: payload.secondary ?? null,
        })
        break
      case 'COMMUNICATION':
        await updateCommunication(node.id, {
          name: payload.name,
          triggerKey: payload.secondary ?? null,
        })
        break
    }
  }

  const deleteNode = async (
    node: BrowseCatalogNode,
    relations: typeof structureRelations = structureRelations
  ) => {
    const blockReason = getArchitectureDeleteBlockReason(node, relations)
    if (blockReason) throw new Error(blockReason)

    switch (node.type) {
      case 'MODULE':
        await removeModule(node.id)
        break
      case 'SCREEN':
        await removeScreen(node.id)
        break
      case 'API_ENDPOINT':
        await removeEndpoint(node.id)
        break
      case 'COMPONENT':
        await removeComponent(node.id)
        break
      case 'DATA_ENTITY':
        await removeEntity(node.id)
        break
      case 'COMMUNICATION':
        await removeCommunication(node.id)
        break
      default:
        throw new Error('This node type cannot be deleted here')
    }
  }

  const handleBulkDeleteNodes = async (nodes: BrowseCatalogNode[]) => {
    const relations = await refetchStructureRelations()
    let ok = 0
    let failed = 0
    let blocked = 0
    for (const node of nodes) {
      const blockReason = getArchitectureDeleteBlockReason(node, relations)
      if (blockReason) {
        blocked += 1
        continue
      }
      try {
        await deleteNode(node, relations)
        ok += 1
        if (selectedKey === `${node.type}:${node.id}`) setSelectedKey(null)
      } catch {
        failed += 1
      }
    }
    if (ok > 0) toast.success(`Deleted ${ok} node${ok === 1 ? '' : 's'}`)
    if (blocked > 0) {
      toast.error(
        `${blocked} skipped — unlink structure relations on the Structure tab first`
      )
    }
    if (failed > 0) toast.error(`${failed} could not be deleted`)
    await refetch({ silent: true })
  }

  const handleDeleteNode = async (node: BrowseCatalogNode) => {
    const relations = await refetchStructureRelations()
    await deleteNode(node, relations)
    setSelectedKey(null)
    await refetch({ silent: true })
  }

  const selectedDeleteBlockReason = selectedNode
    ? getArchitectureDeleteBlockReason(selectedNode, structureRelations)
    : null

  return (
    <div className="flex h-full min-h-0 flex-col px-3 py-3 lg:px-4 lg:py-3">
      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col">
        <header className="shrink-0">
          <Link
            href={ROUTES.workspace.applications(workspaceId)}
            className="text-xs text-neutral-500 hover:text-neutral-800"
          >
            ← Applications
          </Link>

          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 pb-2">
            <div className="min-w-0">
              <Typography as="h1" size="md" weight="medium" className="truncate">
                {application.name}
              </Typography>
              <Typography variant="caption" tone="muted" className="mt-0.5">
                {application.code}
                {catalogNodes.length
                  ? ` · ${catalogNodes.length} node${catalogNodes.length === 1 ? '' : 's'}`
                  : ''}
              </Typography>
            </div>
          </div>

          <nav aria-label="Workbench" className="mt-1 flex gap-0.5 border-b border-neutral-200">
            {MAIN_TABS.map((t) => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => {
                    setTab(t.id)
                    if (t.id !== 'browse') setSelectedKey(null)
                  }}
                  className={cn(
                    'border-b-2 px-2.5 py-1.5 text-sm transition-colors',
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  )}
                >
                  {t.label}
                </button>
              )
            })}
          </nav>
        </header>

        {error ? (
          <Typography tone="error" className="mt-2 shrink-0">
            {error}
          </Typography>
        ) : null}

        <div className="mt-2 min-h-0 flex-1">
          {tab === 'browse' ? (
            <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(260px,360px)] overflow-hidden border border-neutral-200 bg-white">
              {/* Left: catalog — independent scroll */}
              <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-neutral-200">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-100 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    {relatedFunctionNodes.length > 0 ? (
                      <Typography variant="caption" tone="muted">
                        {relatedFunctionNodes.length} function
                        {relatedFunctionNodes.length === 1 ? '' : 's'} linked to this app’s
                        modules (all projects).
                      </Typography>
                    ) : modules.length > 0 ? (
                      <Typography variant="caption" tone="muted">
                        No functions assigned to this app’s modules yet. Map them on Structure.
                      </Typography>
                    ) : null}
                  </div>
                  <CatalogAddBar
                    onCreate={async ({ kind, code, name, extra }) => {
                      const opts = { refresh: false as const }
                      switch (kind) {
                        case 'MODULE':
                          await createModule(
                            {
                              code,
                              name,
                              description: extra ?? null,
                            },
                            opts
                          )
                          break
                        case 'SCREEN':
                          await createScreen(
                            {
                              code,
                              name,
                              routePath: extra ?? null,
                            },
                            opts
                          )
                          break
                        case 'API_ENDPOINT':
                          await createEndpoint(
                            {
                              method: code.toUpperCase(),
                              pathPattern: name,
                              name: extra ?? null,
                            },
                            opts
                          )
                          break
                        case 'COMPONENT':
                          await createComponent(
                            {
                              code,
                              name,
                              componentType: extra ?? null,
                            },
                            opts
                          )
                          break
                        case 'DATA_ENTITY':
                          await createEntity(
                            {
                              code,
                              name,
                              tableName: extra ?? null,
                            },
                            opts
                          )
                          break
                        case 'COMMUNICATION':
                          await createCommunication(
                            {
                              code,
                              name,
                              triggerKey: extra ?? null,
                            },
                            opts
                          )
                          break
                      }
                    }}
                    onSubmitBulk={handleSubmitBulk}
                    onBatchComplete={() => refetch({ silent: true })}
                  />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                  <ArchitectureCatalogTable
                    nodes={catalogNodes}
                    selectedId={selectedNode?.id ?? null}
                    selectedKey={selectedKey}
                    onSelect={(node) => setSelectedKey(`${node.type}:${node.id}`)}
                    onBulkDelete={handleBulkDeleteNodes}
                    isNodeDeletable={(node) =>
                      isArchitectureNodeDeletable(node, structureRelations)
                    }
                  />
                </div>
              </div>

              {/* Right: detail — fills height, scrolls inside */}
              <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-neutral-50/50">
                {selectedNode ? (
                  <NodeDetailInspector
                    node={selectedNode}
                    workspaceId={workspaceId}
                    screen={
                      selectedNode.type === 'SCREEN'
                        ? (screens.find((s) => s.id === selectedNode.id) ?? null)
                        : null
                    }
                    relatedFunctions={relatedFunctionNodes}
                    onClose={closeInspector}
                    onSave={selectedNode.type === 'FUNCTION' ? undefined : saveNode}
                    onDelete={
                      selectedNode.type === 'FUNCTION' || selectedDeleteBlockReason
                        ? undefined
                        : handleDeleteNode
                    }
                    deleteBlockedReason={
                      selectedNode.type === 'FUNCTION'
                        ? null
                        : selectedDeleteBlockReason
                    }
                    onSelectFunction={(fn) => setSelectedKey(`${fn.type}:${fn.id}`)}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
                    <Typography weight="medium">Select a node</Typography>
                    <Typography variant="small" tone="muted" className="mt-1 max-w-xs">
                      Pick a row on the left to view details or edit.
                    </Typography>
                  </div>
                )}
              </aside>
            </div>
          ) : null}

          {tab === 'structure' ? (
            <div className="h-full min-h-0 overflow-hidden border border-neutral-300 bg-white">
              <OverallStructurePanel
                workspaceId={workspaceId}
                applicationId={applicationId}
                showModeSwitcher
              />
            </div>
          ) : null}

          {tab === 'import' ? (
            <div className="h-full min-h-0 overflow-y-auto border border-neutral-200 bg-white p-3">
              <Stack direction="vertical" spacing="md">
                <div className="max-w-xs">
                  <Select
                    value={importKind}
                    onValueChange={(v: string) => setImportKind(v as ImportKind)}
                    options={IMPORT_OPTIONS}
                    placeholder="What to import"
                  />
                </div>
                <Typography variant="small" tone="muted">
                  One file → one async bulk job. Prefer Catalog Add / JSON Import when available.
                </Typography>

                {importKind === 'modules' ? (
                  <SimpleExcelImportPanel
                    title="Import modules"
                    spec={MODULE_IMPORT_SPEC}
                    onSubmitBulk={(rows) =>
                      traceabilityApi.submitAppModulesBulk(
                        workspaceId,
                        applicationId,
                        rows.map((row) => ({
                          code: row.code,
                          name: row.name,
                          description: row.description || null,
                        }))
                      )
                    }
                    onComplete={() => void refetch({ silent: true })}
                  />
                ) : null}
                {importKind === 'screens' ? (
                  <SimpleExcelImportPanel
                    title="Import screens"
                    spec={SCREEN_IMPORT_SPEC}
                    onSubmitBulk={(rows) =>
                      traceabilityApi.submitScreensBulk(
                        workspaceId,
                        applicationId,
                        rows.map((row) => ({
                          code: row.code,
                          name: row.name,
                          routePath: row.routePath || null,
                        }))
                      )
                    }
                    onComplete={() => void refetch({ silent: true })}
                  />
                ) : null}
                {importKind === 'apis' ? (
                  <SimpleExcelImportPanel
                    title="Import API endpoints"
                    spec={API_ENDPOINT_IMPORT_SPEC}
                    uniqueKeys={['method', 'pathPattern']}
                    onSubmitBulk={(rows) =>
                      traceabilityApi.submitApiEndpointsBulk(
                        workspaceId,
                        applicationId,
                        rows.map((row) => ({
                          method: row.method.toUpperCase(),
                          pathPattern: row.pathPattern,
                          name: row.name || null,
                        }))
                      )
                    }
                    onComplete={() => void refetch({ silent: true })}
                  />
                ) : null}
                {importKind === 'components' ? (
                  <SimpleExcelImportPanel
                    title="Import components"
                    spec={COMPONENT_IMPORT_SPEC}
                    onSubmitBulk={(rows) =>
                      traceabilityApi.submitAppComponentsBulk(
                        workspaceId,
                        applicationId,
                        rows.map((row) => ({
                          code: row.code,
                          name: row.name,
                          componentType: row.componentType || null,
                          description: row.description || null,
                        }))
                      )
                    }
                    onComplete={() => void refetch({ silent: true })}
                  />
                ) : null}
                {importKind === 'entities' ? (
                  <SimpleExcelImportPanel
                    title="Import data entities"
                    spec={DATA_ENTITY_IMPORT_SPEC}
                    onSubmitBulk={(rows) =>
                      traceabilityApi.submitDataEntitiesBulk(
                        workspaceId,
                        applicationId,
                        rows.map((row) => ({
                          code: row.code,
                          name: row.name,
                          tableName: row.tableName || null,
                          description: row.description || null,
                        }))
                      )
                    }
                    onComplete={() => void refetch({ silent: true })}
                  />
                ) : null}
              </Stack>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
