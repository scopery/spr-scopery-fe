'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import * as catalogApi from '../api/functional-catalog.api'
import * as api from '../api/traceability.api'
import type {
  OverallStructureResponse,
  StructureCandidatesResponse,
  StructureFocus,
} from '../model/overall-structure'
import {
  normalizeStructureCandidates,
  StructureFocusType,
} from '../model/overall-structure'
import {
  actionNeedsProject,
  resolveStructureAssignAction,
  type StructureAssignDragPayload,
} from '../model/structure-assign.rules'
import { mergeDataEntitiesIntoTree } from '../model/structure-entity-merge'
import { mergeFunctionalItemsIntoTree } from '../model/structure-function-merge'

const UNDO_MS = 7000

export function useOverallStructure(
  workspaceId: string | null,
  applicationId: string | null,
  projectId: string | null
) {
  const [tree, setTree] = useState<OverallStructureResponse | null>(null)
  const [candidates, setCandidates] = useState<StructureCandidatesResponse | null>(null)
  const [focus, setFocus] = useState<StructureFocus | null>(null)
  const [loading, setLoading] = useState(false)
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)

  const loadTree = useCallback(async () => {
    if (!workspaceId || !applicationId) {
      setTree(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.getOverallStructure(workspaceId, applicationId)
      let next: OverallStructureResponse = {
        ...res,
        modules: (res.modules ?? []).map((m) => ({
          ...m,
          functions: m.functions ?? [],
          entities: m.entities ?? [],
          scopedNfrs: m.scopedNfrs ?? [],
        })),
        unassignedFunctions: res.unassignedFunctions ?? [],
        unassignedEntities: res.unassignedEntities ?? [],
        applicationNfrs: res.applicationNfrs ?? [],
      }

      // Map Entity → Module ownership from catalog when overall-structure omits it
      try {
        const listed = await api.listDataEntities(workspaceId, applicationId)
        next = mergeDataEntitiesIntoTree(next, listed.items)
      } catch {
        // keep BE tree entities as-is
      }

      // Map Functions from project catalog (BE tree only has module-assigned FRs).
      if (projectId) {
        try {
          const listed = await catalogApi.listFunctionalItems(projectId)
          next = mergeFunctionalItemsIntoTree(next, listed.items)
        } catch {
          // keep BE tree functions as-is
        }
      }

      setTree(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overall structure')
      setTree(null)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, applicationId, projectId])

  useEffect(() => {
    void loadTree()
  }, [loadTree])

  const loadCandidates = useCallback(async (opts?: { silent?: boolean }) => {
    if (!workspaceId || !applicationId || !focus) {
      setCandidates(null)
      return
    }
    if (!opts?.silent) setCandidatesLoading(true)
    try {
      let raw: StructureCandidatesResponse | Record<string, unknown> | null = null
      try {
        raw = await api.getOverallStructureCandidates(workspaceId, applicationId, {
          focusType: focus.type,
          focusId: focus.id,
        })
      } catch {
        raw = null
      }

      let next = normalizeStructureCandidates(raw, focus)

      // Always map Entity candidates from catalog for Module focus (ownership via moduleId).
      if (focus.type === StructureFocusType.Module) {
        try {
          const listed = await api.listDataEntities(workspaceId, applicationId)
          next = {
            ...next,
            entities: listed.items.map((e) => ({
              id: e.id,
              kind: StructureFocusType.Entity,
              code: e.code,
              name: e.name,
              secondary: e.tableName ?? (e.moduleId ? 'Owned elsewhere' : 'Unassigned'),
              alreadyLinked: e.moduleId === focus.id,
              hasExistingLink: Boolean(e.moduleId),
            })),
          }
        } catch {
          // keep normalized entities
        }
      }

      // BE candidates omit Functions/NFRs — always load from selected project catalog.
      if (focus.type === StructureFocusType.Module && projectId) {
        try {
          const [fr, nfr] = await Promise.all([
            catalogApi.listFunctionalItems(projectId),
            catalogApi.listNonFunctionalItems(projectId),
          ])
          next = {
            ...next,
            functions: fr.items.map((fi) => ({
              id: fi.id,
              kind: StructureFocusType.Function,
              code: fi.code,
              name: fi.title,
              secondary: fi.moduleId
                ? fi.moduleId === focus.id
                  ? 'Assigned here'
                  : 'Assigned elsewhere'
                : 'Unassigned',
              description: fi.description ?? null,
              alreadyLinked: fi.moduleId === focus.id,
              hasExistingLink: Boolean(fi.moduleId),
              projectId: fi.projectId,
            })),
            nfrs: nfr.items.map((item) => ({
              id: item.id,
              kind: StructureFocusType.Nfr,
              code: item.code,
              name: item.title,
              secondary: item.category ?? null,
              description: item.description ?? null,
              alreadyLinked: false,
              hasExistingLink: false,
              projectId: item.projectId,
            })),
          }
        } catch {
          // keep normalized functions/nfrs
        }
      }

      setCandidates(next)
    } catch {
      setCandidates(null)
    } finally {
      if (!opts?.silent) setCandidatesLoading(false)
    }
  }, [workspaceId, applicationId, focus, projectId])

  useEffect(() => {
    void loadCandidates()
  }, [loadCandidates])

  const requireProject = useCallback(() => {
    if (!projectId) {
      setAssignError('Select a project to map Functions / NFRs.')
      return false
    }
    return true
  }, [projectId])

  const runAssign = useCallback(
    async (payload: StructureAssignDragPayload, focusNode: StructureFocus) => {
      if (!workspaceId || !applicationId) throw new Error('Missing workspace/application')
      const action = resolveStructureAssignAction(payload.kind, focusNode, payload.id)
      if (!action) throw new Error('That drop is not allowed for the current focus.')
      if (payload.id === focusNode.id) {
        throw new Error('Cannot assign a node to itself.')
      }
      if (actionNeedsProject(action) && !projectId) {
        throw new Error('Select a project to map Functions / NFRs.')
      }

      switch (action) {
        case 'link-screen-to-function': {
          await catalogApi.linkFunctionScreen(projectId!, focusNode.id, {
            screenId: payload.id,
          })
          return {
            undo: async () => {
              await catalogApi.unlinkFunctionScreen(projectId!, focusNode.id, payload.id)
            },
            summary: `Linked ${payload.label}`,
          }
        }
        case 'link-api-to-function': {
          await catalogApi.linkFunctionApiEndpoint(projectId!, focusNode.id, {
            apiEndpointId: payload.id,
          })
          return {
            undo: async () => {
              await catalogApi.unlinkFunctionApiEndpoint(
                projectId!,
                focusNode.id,
                payload.id
              )
            },
            summary: `Linked ${payload.label}`,
          }
        }
        case 'link-component-to-screen': {
          await api.linkScreenComponent(workspaceId, focusNode.id, {
            componentId: payload.id,
          })
          return {
            undo: async () => {
              await api.unlinkScreenComponent(workspaceId, focusNode.id, payload.id)
            },
            summary: `Linked ${payload.label}`,
          }
        }
        case 'move-function-to-module': {
          const pid = payload.projectId || projectId!
          const fi = await catalogApi.getFunctionalItem(pid, payload.id)
          const prevModuleId = fi.moduleId ?? null
          await catalogApi.updateFunctionalItem(pid, payload.id, {
            title: fi.title,
            description: fi.description,
            priority: fi.priority,
            status: fi.status,
            type: fi.type,
            acceptanceCriteria: fi.acceptanceCriteria,
            moduleId: focusNode.id,
          })
          return {
            undo: async () => {
              await catalogApi.updateFunctionalItem(pid, payload.id, {
                title: fi.title,
                description: fi.description,
                priority: fi.priority,
                status: fi.status,
                type: fi.type,
                acceptanceCriteria: fi.acceptanceCriteria,
                moduleId: prevModuleId,
              })
            },
            summary: `Assigned ${payload.label}`,
          }
        }
        case 'move-entity-to-module': {
          const entities = await api.listDataEntities(workspaceId, applicationId)
          const entity = entities.items.find((e) => e.id === payload.id)
          if (!entity) throw new Error('Entity not found')
          const prevModuleId = entity.moduleId ?? null
          if (prevModuleId === focusNode.id) {
            return { undo: async () => undefined, summary: `${payload.label} already assigned` }
          }
          await api.updateDataEntity(workspaceId, applicationId, payload.id, {
            name: entity.name,
            description: entity.description,
            tableName: entity.tableName,
            moduleId: focusNode.id,
          })
          return {
            undo: async () => {
              await api.updateDataEntity(workspaceId, applicationId, payload.id, {
                name: entity.name,
                description: entity.description,
                tableName: entity.tableName,
                moduleId: prevModuleId,
              })
            },
            summary: `Assigned ${payload.label}`,
          }
        }
        case 'scope-nfr-to-target': {
          if (focusNode.type === StructureFocusType.Nfr) {
            const targetType =
              payload.kind === StructureFocusType.Module
                ? 'MODULE'
                : payload.kind === StructureFocusType.Function
                  ? 'FUNCTION'
                  : 'SCREEN'
            await catalogApi.linkNfrScopeTarget(projectId!, focusNode.id, {
              targetId: payload.id,
              targetType,
            })
            return {
              undo: async () => {
                await catalogApi.unlinkNfrScopeTarget(
                  projectId!,
                  focusNode.id,
                  payload.id
                )
              },
              summary: `Scoped to ${payload.label}`,
            }
          }
          await catalogApi.linkNfrScopeTarget(projectId!, payload.id, {
            targetId: focusNode.id,
            targetType: focusNode.type,
          })
          return {
            undo: async () => {
              await catalogApi.unlinkNfrScopeTarget(projectId!, payload.id, focusNode.id)
            },
            summary: `Scoped ${payload.label}`,
          }
        }
      }
    },
    [workspaceId, applicationId, projectId]
  )

  const assignFromDrag = useCallback(
    async (payload: StructureAssignDragPayload) => {
      if (!focus) {
        setAssignError('Select a focus node first')
        return
      }
      const action = resolveStructureAssignAction(payload.kind, focus, payload.id)
      if (!action) {
        setAssignError('That drop is not allowed for the current focus.')
        return
      }
      if (payload.id === focus.id) {
        setAssignError('Cannot assign a node to itself.')
        return
      }
      if (actionNeedsProject(action) && !requireProject()) return

      setAssigning(true)
      setAssignError(null)
      try {
        const result = await runAssign(payload, focus)
        await loadTree()
        await loadCandidates({ silent: true })
        if (result) {
          toast.success(result.summary, {
            duration: UNDO_MS,
            action: {
              label: 'Undo',
              onClick: () => {
                void (async () => {
                  await result.undo()
                  await loadTree()
                  await loadCandidates({ silent: true })
                  toast.message('Undone')
                })()
              },
            },
          })
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setAssignError(
            err.message || 'Conflict while saving — refresh the page and try again.'
          )
        } else {
          setAssignError(err instanceof Error ? err.message : 'Assign failed')
        }
      } finally {
        setAssigning(false)
      }
    },
    [focus, requireProject, runAssign, loadTree, loadCandidates]
  )

  const assignMany = useCallback(
    async (payloads: StructureAssignDragPayload[]) => {
      if (!focus || !payloads.length) return { ok: 0, failed: 0 }
      setAssigning(true)
      setAssignError(null)
      const undos: Array<() => Promise<void>> = []
      let ok = 0
      let failed = 0
      try {
        for (const payload of payloads) {
          const action = resolveStructureAssignAction(payload.kind, focus, payload.id)
          if (!action || payload.id === focus.id) {
            failed += 1
            continue
          }
          if (actionNeedsProject(action) && !projectId) {
            failed += 1
            continue
          }
          try {
            const result = await runAssign(payload, focus)
            if (result) {
              undos.push(result.undo)
              ok += 1
            }
          } catch {
            failed += 1
          }
        }
        await loadTree()
        await loadCandidates({ silent: true })
        if (ok > 0) {
          toast.success(`Assigned ${ok} item${ok === 1 ? '' : 's'}`, {
            duration: UNDO_MS,
            action: {
              label: 'Undo',
              onClick: () => {
                void (async () => {
                  for (const u of undos.reverse()) await u()
                  await loadTree()
                  await loadCandidates({ silent: true })
                  toast.message('Bulk assign undone')
                })()
              },
            },
          })
        }
        if (failed > 0) {
          setAssignError(`${failed} item${failed === 1 ? '' : 's'} could not be assigned`)
        }
        return { ok, failed }
      } finally {
        setAssigning(false)
      }
    },
    [focus, projectId, runAssign, loadTree, loadCandidates]
  )

  const unlinkScreenFromFunction = useCallback(
    async (functionId: string, screenId: string, fnProjectId?: string | null) => {
      const pid = fnProjectId || projectId
      if (!pid) {
        setAssignError('Select a project to unlink.')
        return
      }
      setAssigning(true)
      try {
        await catalogApi.unlinkFunctionScreen(pid, functionId, screenId)
        await loadTree()
        await loadCandidates({ silent: true })
        toast.success('Screen unlinked', {
          duration: UNDO_MS,
          action: {
            label: 'Undo',
            onClick: () => {
              void (async () => {
                await catalogApi.linkFunctionScreen(pid, functionId, { screenId })
                await loadTree()
                await loadCandidates({ silent: true })
                toast.message('Restored')
              })()
            },
          },
        })
      } catch (err) {
        setAssignError(err instanceof Error ? err.message : 'Unlink failed')
      } finally {
        setAssigning(false)
      }
    },
    [projectId, loadTree, loadCandidates]
  )

  const unlinkApiFromFunction = useCallback(
    async (functionId: string, apiEndpointId: string, fnProjectId?: string | null) => {
      const pid = fnProjectId || projectId
      if (!pid) {
        setAssignError('Select a project to unlink.')
        return
      }
      setAssigning(true)
      try {
        await catalogApi.unlinkFunctionApiEndpoint(pid, functionId, apiEndpointId)
        await loadTree()
        await loadCandidates({ silent: true })
        toast.success('API unlinked', {
          duration: UNDO_MS,
          action: {
            label: 'Undo',
            onClick: () => {
              void (async () => {
                await catalogApi.linkFunctionApiEndpoint(pid, functionId, {
                  apiEndpointId,
                })
                await loadTree()
                await loadCandidates({ silent: true })
                toast.message('Restored')
              })()
            },
          },
        })
      } catch (err) {
        setAssignError(err instanceof Error ? err.message : 'Unlink failed')
      } finally {
        setAssigning(false)
      }
    },
    [projectId, loadTree, loadCandidates]
  )

  const unlinkComponentFromScreen = useCallback(
    async (screenId: string, componentId: string) => {
      if (!workspaceId) return
      setAssigning(true)
      try {
        await api.unlinkScreenComponent(workspaceId, screenId, componentId)
        await loadTree()
        await loadCandidates({ silent: true })
        toast.success('Component unlinked', {
          duration: UNDO_MS,
          action: {
            label: 'Undo',
            onClick: () => {
              void (async () => {
                await api.linkScreenComponent(workspaceId, screenId, { componentId })
                await loadTree()
                await loadCandidates({ silent: true })
                toast.message('Restored')
              })()
            },
          },
        })
      } catch (err) {
        setAssignError(err instanceof Error ? err.message : 'Unlink failed')
      } finally {
        setAssigning(false)
      }
    },
    [workspaceId, loadTree, loadCandidates]
  )

  const unlinkEntityFromModule = useCallback(
    async (entityId: string, moduleId: string) => {
      if (!workspaceId || !applicationId) return
      setAssigning(true)
      try {
        const listed = await api.listDataEntities(workspaceId, applicationId)
        const entity = listed.items.find((e) => e.id === entityId)
        if (!entity) throw new Error('Entity not found')
        await api.updateDataEntity(workspaceId, applicationId, entityId, {
          name: entity.name,
          description: entity.description,
          tableName: entity.tableName,
          moduleId: null,
        })
        await loadTree()
        await loadCandidates({ silent: true })
        toast.success('Entity unassigned', {
          duration: UNDO_MS,
          action: {
            label: 'Undo',
            onClick: () => {
              void (async () => {
                await api.updateDataEntity(workspaceId, applicationId, entityId, {
                  name: entity.name,
                  description: entity.description,
                  tableName: entity.tableName,
                  moduleId,
                })
                await loadTree()
                await loadCandidates({ silent: true })
                toast.message('Restored')
              })()
            },
          },
        })
      } catch (err) {
        setAssignError(err instanceof Error ? err.message : 'Unlink failed')
      } finally {
        setAssigning(false)
      }
    },
    [workspaceId, applicationId, loadTree, loadCandidates]
  )

  return {
    tree,
    candidates,
    focus,
    setFocus,
    loading,
    candidatesLoading,
    assigning,
    error,
    assignError,
    setAssignError,
    refetch: loadTree,
    assignFromDrag,
    assignMany,
    unlinkScreenFromFunction,
    unlinkApiFromFunction,
    unlinkComponentFromScreen,
    unlinkEntityFromModule,
  }
}
