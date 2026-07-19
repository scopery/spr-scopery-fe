'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as organizationsApi from '../../infrastructure/api/external-organizations.api'
import * as contactsApi from '../../infrastructure/api/external-contacts.api'
import type { ExternalOrganization } from '../../domain/model/external-organization'
import type { ExternalContact } from '../../domain/model/external-contact'
import type { CreateExternalOrganizationPayload } from '../../domain/model/external-organization'
import type { CreateExternalContactPayload } from '../../domain/model/external-contact'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useClientsContacts(workspaceId: string | null, options?: { canManage?: boolean }) {
  const canManage = options?.canManage ?? false
  const [organizations, setOrganizations] = useState<ExternalOrganization[]>([])
  const [contacts, setContacts] = useState<ExternalContact[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingOrg, setCreatingOrg] = useState(false)
  const [creatingContact, setCreatingContact] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [orgs, contactList] = await Promise.all([
        organizationsApi.listExternalOrganizations(workspaceId),
        contactsApi.listExternalContacts(workspaceId),
      ])
      setOrganizations(orgs)
      setContacts(contactList)
      setSelectedOrgId((prev) => {
        if (prev && orgs.some((o) => o.id === prev)) return prev
        return orgs[0]?.id ?? null
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load clients & contacts'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const filteredOrganizations = useMemo(() => {
    const q = search.trim().toLowerCase()
    return organizations.filter((org) => {
      if (typeFilter && org.organizationType !== typeFilter) return false
      if (!q) return true
      return (
        org.name.toLowerCase().includes(q) ||
        org.code.toLowerCase().includes(q) ||
        org.organizationType.toLowerCase().includes(q)
      )
    })
  }, [organizations, search, typeFilter])

  const selectedOrganization =
    organizations.find((o) => o.id === selectedOrgId) ?? filteredOrganizations[0] ?? null

  const selectedContacts = useMemo(() => {
    if (!selectedOrganization) return []
    return contacts.filter((c) => c.organizationId === selectedOrganization.id)
  }, [contacts, selectedOrganization])

  const createOrganization = useCallback(
    async (payload: CreateExternalOrganizationPayload) => {
      if (!workspaceId || !canManage) return
      setCreatingOrg(true)
      try {
        const created = await organizationsApi.createExternalOrganization(workspaceId, payload)
        toast.success('Organization created')
        await load()
        setSelectedOrgId(created.id)
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setCreatingOrg(false)
      }
    },
    [workspaceId, canManage, load]
  )

  const createContact = useCallback(
    async (payload: CreateExternalContactPayload) => {
      if (!workspaceId || !canManage) return
      setCreatingContact(true)
      try {
        const created = await contactsApi.createExternalContact(workspaceId, {
          ...payload,
          organizationId: payload.organizationId ?? selectedOrganization?.id,
        })
        toast.success('Contact created')
        await load()
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setCreatingContact(false)
      }
    },
    [workspaceId, canManage, load, selectedOrganization?.id]
  )

  return {
    organizations: filteredOrganizations,
    allOrganizations: organizations,
    contacts,
    selectedOrganization,
    selectedContacts,
    selectedOrgId: selectedOrganization?.id ?? null,
    setSelectedOrgId,
    typeFilter,
    setTypeFilter,
    search,
    setSearch,
    loading,
    error,
    canManage,
    creatingOrg,
    creatingContact,
    createOrganization,
    createContact,
    refetch: load,
  }
}
