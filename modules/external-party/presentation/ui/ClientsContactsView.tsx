'use client'

import { Plus } from 'lucide-react'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge, Button, Input, Select, Stack, Typography, PageSkeleton } from '@/shared/ui'
import { useClientsContacts } from '../hooks/useClientsContacts'
import { ExternalOrganizationType } from '../../domain/enums/external-party.enum'
import { contactDisplayName, isPrimaryContact } from '../../domain/rules/external-party.rules'
import { cn } from '@/utils/cn'

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: ExternalOrganizationType.Client, label: 'Client' },
  { value: ExternalOrganizationType.Vendor, label: 'Vendor' },
  { value: ExternalOrganizationType.Other, label: 'Other' },
]

const CREATE_TYPE_OPTIONS = [
  { value: ExternalOrganizationType.Client, label: 'Client' },
  { value: ExternalOrganizationType.Vendor, label: 'Vendor' },
  { value: ExternalOrganizationType.Other, label: 'Other' },
]

interface ClientsContactsViewProps {
  canManage?: boolean
  title?: string
  description?: string
}

export function ClientsContactsView({
  canManage = false,
  title = 'Clients & Contacts',
  description = 'External organizations and contacts available in this workspace.',
}: ClientsContactsViewProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    organizations,
    selectedOrganization,
    selectedContacts,
    setSelectedOrgId,
    typeFilter,
    setTypeFilter,
    search,
    setSearch,
    loading,
    error,
    creatingOrg,
    creatingContact,
    createOrganization,
    createContact,
  } = useClientsContacts(workspaceId, { canManage })

  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showCreateContact, setShowCreateContact] = useState(false)
  const [orgForm, setOrgForm] = useState({
    code: '',
    name: '',
    organizationType: ExternalOrganizationType.Client,
  })
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    primaryFlag: false,
  })

  if (loading) {
    return (
      <PageSkeleton variant="split" />
    )
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
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            {title}
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            {description}
          </Typography>
        </div>
        {canManage ? (
          <Button variant="primary" onClick={() => setShowCreateOrg(true)} icon={<Plus size={16} />}>
            Add organization
          </Button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code"
          />
        </div>
        <div className="w-44">
          <Select
            value={typeFilter}
            onValueChange={(v: string) => setTypeFilter(v)}
            options={TYPE_OPTIONS}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 px-4 py-3">
            <Typography weight="semibold" variant="small">
              Organizations ({organizations.length})
            </Typography>
          </div>
          {organizations.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Typography tone="muted" variant="small">
                No external organizations yet.
              </Typography>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {organizations.map((org) => (
                <li key={org.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedOrgId(org.id)}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-neutral-50',
                      selectedOrganization?.id === org.id && 'bg-neutral-50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Typography weight="medium" variant="small">
                        {org.name}
                      </Typography>
                      <Badge tone="neutral">
                        {org.organizationType}
                      </Badge>
                    </div>
                    <Typography variant="small" tone="muted" className="font-mono text-xs">
                      {org.code}
                    </Typography>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-neutral-200 bg-white">
          {!selectedOrganization ? (
            <div className="px-4 py-16 text-center">
              <Typography tone="muted" variant="small">
                Select an organization to view contacts.
              </Typography>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-4 py-4">
                <div>
                  <Typography as="h2" size="lg" weight="semibold">
                    {selectedOrganization.name}
                  </Typography>
                  <Typography variant="small" tone="muted" className="mt-1 font-mono text-xs">
                    {selectedOrganization.code} · {selectedOrganization.status}
                  </Typography>
                </div>
                {canManage ? (
                  <Button variant="outline" onClick={() => setShowCreateContact(true)} icon={<Plus size={16} />}>
                    Add contact
                  </Button>
                ) : null}
              </div>

              <div className="px-4 py-4">
                <Typography weight="semibold" variant="small" className="mb-3">
                  Contacts
                </Typography>
                {selectedContacts.length === 0 ? (
                  <div className="border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center">
                    <Typography tone="muted" variant="small">
                      This organization has no contacts yet.
                    </Typography>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-neutral-50 text-neutral-600">
                        <tr>
                          <th className="px-3 py-2 font-medium">Name</th>
                          <th className="px-3 py-2 font-medium">Email</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          <th className="px-3 py-2 font-medium">Primary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedContacts.map((contact) => (
                          <tr key={contact.id} className="border-t border-neutral-100">
                            <td className="px-3 py-2">{contactDisplayName(contact)}</td>
                            <td className="px-3 py-2">{contact.email ?? '—'}</td>
                            <td className="px-3 py-2">{contact.status}</td>
                            <td className="px-3 py-2">
                              {isPrimaryContact(contact) ? (
                                <Badge tone="success">
                                  Primary
                                </Badge>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {canManage && showCreateOrg ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md bg-white p-6 shadow-lg">
            <Typography as="h2" size="lg" weight="semibold" className="mb-4">
              Add organization
            </Typography>
            <Stack direction="vertical" spacing="md">
              <Input
                label="Code"
                value={orgForm.code}
                onChange={(e) => setOrgForm((f) => ({ ...f, code: e.target.value }))}
              />
              <Input
                label="Name"
                value={orgForm.name}
                onChange={(e) => setOrgForm((f) => ({ ...f, name: e.target.value }))}
              />
              <div>
                <Typography variant="small" tone="muted" className="mb-1.5">
                  Type
                </Typography>
                <Select
                  value={orgForm.organizationType}
                  onValueChange={(v: string) =>
                    setOrgForm((f) => ({ ...f, organizationType: v as typeof f.organizationType }))
                  }
                  options={CREATE_TYPE_OPTIONS}
                />
              </div>
              <Stack direction="horizontal" spacing="sm">
                <Button
                  variant="primary"
                  disabled={creatingOrg || !orgForm.code.trim() || !orgForm.name.trim()}
                  onClick={() =>
                    void createOrganization({
                      code: orgForm.code.trim(),
                      name: orgForm.name.trim(),
                      organizationType: orgForm.organizationType,
                    }).then(() => {
                      setShowCreateOrg(false)
                      setOrgForm({
                        code: '',
                        name: '',
                        organizationType: ExternalOrganizationType.Client,
                      })
                    })
                  }
                >
                  {creatingOrg ? 'Creating…' : 'Create'}
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateOrg(false)}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </div>
        </div>
      ) : null}

      {canManage && showCreateContact && selectedOrganization ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md bg-white p-6 shadow-lg">
            <Typography as="h2" size="lg" weight="semibold" className="mb-1">
              Add contact
            </Typography>
            <Typography variant="small" tone="muted" className="mb-4">
              For {selectedOrganization.name}
            </Typography>
            <Stack direction="vertical" spacing="md">
              <Input
                label="First name"
                value={contactForm.firstName}
                onChange={(e) => setContactForm((f) => ({ ...f, firstName: e.target.value }))}
              />
              <Input
                label="Last name"
                value={contactForm.lastName}
                onChange={(e) => setContactForm((f) => ({ ...f, lastName: e.target.value }))}
              />
              <Input
                label="Email (optional)"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={contactForm.primaryFlag}
                  onChange={(e) =>
                    setContactForm((f) => ({ ...f, primaryFlag: e.target.checked }))
                  }
                />
                Primary contact
              </label>
              <Stack direction="horizontal" spacing="sm">
                <Button
                  variant="primary"
                  disabled={
                    creatingContact ||
                    !contactForm.firstName.trim() ||
                    !contactForm.lastName.trim()
                  }
                  onClick={() =>
                    void createContact({
                      organizationId: selectedOrganization.id,
                      firstName: contactForm.firstName.trim(),
                      lastName: contactForm.lastName.trim(),
                      email: contactForm.email.trim() || undefined,
                      primaryFlag: contactForm.primaryFlag,
                    }).then(() => {
                      setShowCreateContact(false)
                      setContactForm({
                        firstName: '',
                        lastName: '',
                        email: '',
                        primaryFlag: false,
                      })
                    })
                  }
                >
                  {creatingContact ? 'Creating…' : 'Create'}
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateContact(false)}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function AdminClientsContactsView() {
  return (
    <ClientsContactsView
      canManage
      title="Clients & Contacts"
      description="Create and manage external organizations and contacts for this workspace."
    />
  )
}
