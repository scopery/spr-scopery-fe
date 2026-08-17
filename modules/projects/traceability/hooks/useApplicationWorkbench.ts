'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../api/traceability.api'
import type {
  CreateRegistryApiEndpointBody,
  CreateRegistryAppComponentBody,
  CreateRegistryAppModuleBody,
  CreateRegistryDataEntityBody,
  CreateCommunicationSpecBody,
  CreateRegistryScreenBody,
  RegistryApiEndpoint,
  RegistryAppComponent,
  RegistryAppModule,
  RegistryApplication,
  RegistryDataEntity,
  CommunicationSpecification,
  RegistryScreen,
  UpdateRegistryApiEndpointBody,
  UpdateRegistryAppComponentBody,
  UpdateRegistryAppModuleBody,
  UpdateRegistryDataEntityBody,
  UpdateCommunicationSpecBody,
  UpdateRegistryApplicationBody,
  UpdateRegistryScreenBody,
} from '../model/application-registry'

type LoadOpts = { silent?: boolean }
type MutateOpts = { refresh?: boolean }

async function withConflictRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const retryable =
        err instanceof ApiError &&
        err.status === 409 &&
        err.problem.code === 'RESOURCE_CONFLICT' &&
        i < attempts - 1
      if (!retryable) throw err
      await new Promise((r) => setTimeout(r, 150 * (i + 1)))
    }
  }
  throw lastErr
}

export function useApplicationWorkbench(
  workspaceId: string | null,
  applicationId: string | null
) {
  const [application, setApplication] = useState<RegistryApplication | null>(null)
  const [modules, setModules] = useState<RegistryAppModule[]>([])
  const [screens, setScreens] = useState<RegistryScreen[]>([])
  const [apiEndpoints, setApiEndpoints] = useState<RegistryApiEndpoint[]>([])
  const [components, setComponents] = useState<RegistryAppComponent[]>([])
  const [dataEntities, setDataEntities] = useState<RegistryDataEntity[]>([])
  const [communications, setCommunications] = useState<CommunicationSpecification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (opts?: LoadOpts) => {
      if (!workspaceId || !applicationId) return
      if (!opts?.silent) {
        setLoading(true)
      }
      setError(null)
      try {
        const [app, moduleRes, screenRes, endpointRes, componentRes, entityRes, commRes] =
          await Promise.all([
            api.getApplication(workspaceId, applicationId),
            api.listAppModules(workspaceId, applicationId),
            api.listScreens(workspaceId, applicationId),
            api.listApiEndpoints(workspaceId, applicationId),
            api.listAppComponents(workspaceId, applicationId),
            api.listDataEntities(workspaceId, applicationId),
            api.listCommunicationSpecs(workspaceId, applicationId),
          ])
        setApplication(app)
        setModules(moduleRes.items ?? [])
        setScreens(screenRes.items ?? [])
        setApiEndpoints(endpointRes.items ?? [])
        setComponents(componentRes.items ?? [])
        setDataEntities(entityRes.items ?? [])
        setCommunications(commRes.items ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application')
      } finally {
        if (!opts?.silent) {
          setLoading(false)
        }
      }
    },
    [workspaceId, applicationId]
  )

  useEffect(() => {
    void load()
  }, [load])

  const afterCreate = useCallback(
    async (opts?: MutateOpts) => {
      if (opts?.refresh === false) return
      await load({ silent: true })
    },
    [load]
  )

  const updateApplication = useCallback(
    async (body: UpdateRegistryApplicationBody) => {
      if (!workspaceId || !applicationId) return
      await api.updateApplication(workspaceId, applicationId, body)
      await load({ silent: true })
    },
    [workspaceId, applicationId, load]
  )

  const createModule = useCallback(
    async (body: CreateRegistryAppModuleBody, opts?: MutateOpts) => {
      if (!workspaceId || !applicationId) return
      await withConflictRetry(() =>
        api.createAppModule(workspaceId, applicationId, body)
      )
      await afterCreate(opts)
    },
    [workspaceId, applicationId, afterCreate]
  )

  const updateModule = useCallback(
    async (appModuleId: string, body: UpdateRegistryAppModuleBody) => {
      if (!workspaceId || !applicationId) return
      await api.updateAppModule(workspaceId, applicationId, appModuleId, body)
      await load({ silent: true })
    },
    [workspaceId, applicationId, load]
  )

  const removeModule = useCallback(
    async (appModuleId: string) => {
      if (!workspaceId || !applicationId) return
      await api.deleteAppModule(workspaceId, applicationId, appModuleId)
      await load({ silent: true })
    },
    [workspaceId, applicationId, load]
  )

  const createScreen = useCallback(
    async (body: CreateRegistryScreenBody, opts?: MutateOpts) => {
      if (!workspaceId || !applicationId) return
      await withConflictRetry(() => api.createScreen(workspaceId, applicationId, body))
      await afterCreate(opts)
    },
    [workspaceId, applicationId, afterCreate]
  )

  const updateScreenItem = useCallback(
    async (screenId: string, body: UpdateRegistryScreenBody) => {
      if (!workspaceId || !applicationId) return
      await api.updateScreen(workspaceId, applicationId, screenId, body)
      await load({ silent: true })
    },
    [workspaceId, applicationId, load]
  )

  const removeScreen = useCallback(
    async (screenId: string) => {
      if (!workspaceId || !applicationId) return
      await api.deleteScreen(workspaceId, applicationId, screenId)
      await load({ silent: true })
    },
    [workspaceId, applicationId, load]
  )

  const createEndpoint = useCallback(
    async (body: CreateRegistryApiEndpointBody, opts?: MutateOpts) => {
      if (!workspaceId || !applicationId) return
      await withConflictRetry(() =>
        api.createApiEndpoint(workspaceId, applicationId, body)
      )
      await afterCreate(opts)
    },
    [workspaceId, applicationId, afterCreate]
  )

  const updateEndpoint = useCallback(
    async (endpointId: string, body: UpdateRegistryApiEndpointBody) => {
      if (!workspaceId || !applicationId) return
      await api.updateApiEndpoint(workspaceId, applicationId, endpointId, body)
      await load({ silent: true })
    },
    [workspaceId, applicationId, load]
  )

  const removeEndpoint = useCallback(
    async (endpointId: string) => {
      if (!workspaceId || !applicationId) return
      await api.deleteApiEndpoint(workspaceId, applicationId, endpointId)
      await load({ silent: true })
    },
    [workspaceId, applicationId, load]
  )

  const createComponent = useCallback(
    async (body: CreateRegistryAppComponentBody, opts?: MutateOpts) => {
      if (!workspaceId || !applicationId) return
      await withConflictRetry(() =>
        api.createAppComponent(workspaceId, applicationId, body)
      )
      await afterCreate(opts)
    },
    [workspaceId, applicationId, afterCreate]
  )

  const updateComponent = useCallback(
    async (appComponentId: string, body: UpdateRegistryAppComponentBody) => {
      if (!workspaceId || !applicationId) return
      await api.updateAppComponent(workspaceId, applicationId, appComponentId, body)
      await load({ silent: true })
    },
    [workspaceId, applicationId, load]
  )

  const removeComponent = useCallback(
    async (appComponentId: string) => {
      if (!workspaceId || !applicationId) return
      await api.deleteAppComponent(workspaceId, applicationId, appComponentId)
      await load({ silent: true })
    },
    [workspaceId, applicationId, load]
  )

  const createEntity = useCallback(
    async (body: CreateRegistryDataEntityBody, opts?: MutateOpts) => {
      if (!workspaceId || !applicationId) return
      await withConflictRetry(() =>
        api.createDataEntity(workspaceId, applicationId, body)
      )
      await afterCreate(opts)
    },
    [workspaceId, applicationId, afterCreate]
  )

  const updateEntity = useCallback(
    async (dataEntityId: string, body: UpdateRegistryDataEntityBody) => {
      if (!workspaceId || !applicationId) return
      await api.updateDataEntity(workspaceId, applicationId, dataEntityId, body)
      await load({ silent: true })
    },
    [workspaceId, applicationId, load]
  )

  const removeEntity = useCallback(
    async (dataEntityId: string) => {
      if (!workspaceId || !applicationId) return
      await api.deleteDataEntity(workspaceId, applicationId, dataEntityId)
      await load({ silent: true })
    },
    [workspaceId, applicationId, load]
  )

  const createCommunication = useCallback(
    async (body: CreateCommunicationSpecBody, opts?: MutateOpts) => {
      if (!workspaceId || !applicationId) return
      await withConflictRetry(() =>
        api.createCommunicationSpec(workspaceId, applicationId, body)
      )
      await afterCreate(opts)
    },
    [workspaceId, applicationId, afterCreate]
  )

  const updateCommunication = useCallback(
    async (communicationSpecId: string, body: UpdateCommunicationSpecBody) => {
      if (!workspaceId || !applicationId) return
      await api.updateCommunicationSpec(workspaceId, applicationId, communicationSpecId, body)
      await load({ silent: true })
    },
    [workspaceId, applicationId, load]
  )

  const removeCommunication = useCallback(
    async (communicationSpecId: string) => {
      if (!workspaceId || !applicationId) return
      await api.archiveCommunicationSpec(workspaceId, applicationId, communicationSpecId)
      await load({ silent: true })
    },
    [workspaceId, applicationId, load]
  )

  return {
    application,
    modules,
    screens,
    apiEndpoints,
    components,
    dataEntities,
    communications,
    loading,
    error,
    refetch: load,
    updateApplication,
    createModule,
    updateModule,
    removeModule,
    createScreen,
    updateScreen: updateScreenItem,
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
  }
}
