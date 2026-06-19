'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronsUpDown,
  CircleHelp,
  FolderKanban,
  LogOut,
  Plus,
  Search,
  Settings,
  Users,
  FileText,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Link as DesignLink,
  Stack,
  Typography,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/modules/auth'
import { orgApi } from '@/modules/org'
import { accessApi } from '@/modules/permissions'
import { buildDocumentSpacePermissions } from '@/modules/permissions'
import { cn } from '@/utils/cn'
import { HelpGuideModal } from './HelpGuideModal'

interface AppShellProps {
  orgId: string
  children: React.ReactNode
}

function orgInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?'
}

function formatMemberCount(count: number | null) {
  if (count === null) return '…'
  return count === 1 ? '1 member' : `${count} members`
}

export function AppShell({ orgId, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, orgs, logout } = useAuth()
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const [canViewDocumentHub, setCanViewDocumentHub] = useState(true)

  const currentOrg = useMemo(() => orgs.find((org) => org.id === orgId) ?? null, [orgId, orgs])
  const otherOrgs = useMemo(() => orgs.filter((org) => org.id !== orgId), [orgId, orgs])

  const projectsActive =
    pathname === ROUTES.org.projects(orgId) ||
    pathname?.startsWith(ROUTES.org.projects(orgId) + '/')
  const documentHubActive =
    pathname === ROUTES.org.documentHub(orgId) ||
    pathname?.startsWith(ROUTES.org.documentHub(orgId) + '/')

  useEffect(() => {
    setWorkspaceMenuOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!orgId) return
    let cancelled = false
    Promise.all([
      accessApi.getEffectivePermissions(orgId).catch(() => null),
      orgApi.getOrg(orgId).catch(() => null),
    ]).then(([perms, org]) => {
      if (cancelled) return
      const fallback = org ? org.my_role !== 'partner' : false
      const docPerms = buildDocumentSpacePermissions(perms, fallback)
      setCanViewDocumentHub(docPerms.canViewDocumentHub)
    })
    return () => {
      cancelled = true
    }
  }, [orgId])

  useEffect(() => {
    if (!workspaceMenuOpen || !orgId) return
    let cancelled = false
    orgApi
      .getOrgMembers(orgId, { limit: 1, offset: 0 })
      .then((res) => {
        if (!cancelled) setMemberCount(res.page.total)
      })
      .catch(() => {
        if (!cancelled) setMemberCount(null)
      })
    return () => {
      cancelled = true
    }
  }, [workspaceMenuOpen, orgId])

  const handleLogout = async () => {
    await logout()
    window.location.href = ROUTES.auth.login
  }

  const switchOrg = (nextOrgId: string) => {
    setWorkspaceMenuOpen(false)
    router.push(ROUTES.org.projects(nextOrgId))
  }

  return (
    <Box as="div" className="flex min-h-screen flex-col bg-neutral-50">
      <Box
        as="header"
        className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white"
      >
        <Box as="div" className="flex min-w-0 items-center">
          <DesignLink
            as={NextLink}
            href={currentOrg ? ROUTES.org.projects(currentOrg.id) : '/'}
            className="flex shrink-0 items-center rounded-none border-r border-neutral-300 px-6"
            aria-label="Scopery home"
          >
            <Image src="/scopery_logo_v2.png" alt="Scopery" width={20} height={20} />
          </DesignLink>

          {currentOrg && (
            <Box as="div" className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWorkspaceMenuOpen((v) => !v)}
                className={cn(
                  'mx-2 h-8 gap-2 rounded-none px-2 text-neutral-900',
                  workspaceMenuOpen && 'bg-neutral-100'
                )}
                aria-expanded={workspaceMenuOpen}
                aria-haspopup="menu"
                icon={
                  <Avatar size="xs" fallback={orgInitial(currentOrg.name)} alt={currentOrg.name} />
                }
                iconRight={<ChevronsUpDown size={14} className="text-neutral-400" />}
              >
                <Typography
                  as="span"
                  weight="medium"
                  className="max-w-[160px] truncate sm:max-w-[220px]"
                >
                  {currentOrg.name}
                </Typography>
              </Button>

              {workspaceMenuOpen && (
                <>
                  <Box
                    as="div"
                    className="fixed inset-0 z-10"
                    aria-hidden
                    onClick={() => setWorkspaceMenuOpen(false)}
                  />
                  <Box
                    as="div"
                    role="menu"
                    className="absolute left-0 top-full z-20 mt-1 w-72 border border-neutral-200 bg-white shadow-xl"
                  >
                    <Box as="div" padding="md" className="border-b border-neutral-100">
                      <Stack direction="horizontal" spacing="sm" align="start">
                        <Avatar
                          size="sm"
                          fallback={orgInitial(currentOrg.name)}
                          alt={currentOrg.name}
                        />
                        <Stack direction="vertical" spacing="none" className="min-w-0 flex-1">
                          <Stack direction="horizontal" spacing="xs" align="center" wrap>
                            <Typography as="span" weight="semibold" className="truncate">
                              {currentOrg.name}
                            </Typography>
                            <Badge
                              variant="soft"
                              tone="primary"
                              size="sm"
                              className="uppercase tracking-wide"
                            >
                              {currentOrg.my_role}
                            </Badge>
                          </Stack>
                          <Typography as="p" variant="small" tone="muted">
                            {formatMemberCount(memberCount)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>

                    <DesignLink
                      as={NextLink}
                      href={ROUTES.org.members(orgId)}
                      role="menuitem"
                      className="flex items-center gap-2 rounded-none px-4 py-2 text-sm hover:bg-neutral-50"
                      onClick={() => setWorkspaceMenuOpen(false)}
                    >
                      <Users size={14} className="shrink-0 text-neutral-500" />
                      Members
                    </DesignLink>
                    <DesignLink
                      as={NextLink}
                      href={ROUTES.org.settingsTemplates(orgId)}
                      role="menuitem"
                      className="flex items-center gap-2 rounded-none px-4 py-2 text-sm hover:bg-neutral-50"
                      onClick={() => setWorkspaceMenuOpen(false)}
                    >
                      <Settings size={14} className="shrink-0 text-neutral-500" />
                      Templates
                    </DesignLink>
                    <DesignLink
                      as={NextLink}
                      href={ROUTES.org.settings(orgId)}
                      role="menuitem"
                      className="flex items-center gap-2 rounded-none px-4 py-2 text-sm hover:bg-neutral-50"
                      onClick={() => setWorkspaceMenuOpen(false)}
                    >
                      <Settings size={14} className="shrink-0 text-neutral-500" />
                      Workspace settings
                    </DesignLink>

                    {otherOrgs.length > 0 && (
                      <>
                        <Divider className="border-neutral-100" />
                        {otherOrgs.map((org) => (
                          <Button
                            key={org.id}
                            variant="ghost"
                            size="md"
                            role="menuitem"
                            onClick={() => switchOrg(org.id)}
                            className="h-auto w-full justify-start gap-2 rounded-none px-4 py-2 text-sm text-neutral-700"
                            icon={
                              <Avatar size="xs" fallback={orgInitial(org.name)} alt={org.name} />
                            }
                          >
                            <span className="truncate">{org.name}</span>
                          </Button>
                        ))}
                      </>
                    )}

                    <Divider className="border-neutral-100" />
                    <DesignLink
                      as={NextLink}
                      href={ROUTES.onboarding}
                      role="menuitem"
                      className="flex items-center gap-2 rounded-none px-4 py-2 text-sm hover:bg-neutral-50"
                      onClick={() => setWorkspaceMenuOpen(false)}
                    >
                      <Plus size={14} className="shrink-0 text-neutral-500" />
                      New workspace
                    </DesignLink>
                  </Box>
                </>
              )}
            </Box>
          )}

          {currentOrg && (
            <>
              <DesignLink
                as={NextLink}
                href={ROUTES.org.projects(orgId)}
                className={cn(
                  'hidden items-center gap-2 rounded-none border-l border-neutral-300 px-4 text-sm transition-colors sm:flex',
                  projectsActive
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                <FolderKanban size={14} className="text-neutral-500" />
                <Typography as="span" className="font-normal">
                  Projects
                </Typography>
              </DesignLink>
              {canViewDocumentHub && (
                <DesignLink
                  as={NextLink}
                  href={ROUTES.org.documentHub(orgId)}
                  className={cn(
                    'hidden items-center gap-2 rounded-none border-l border-neutral-300 px-4 text-sm transition-colors sm:flex',
                    documentHubActive
                      ? 'bg-neutral-100 text-neutral-900'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  )}
                >
                  <FileText size={14} className="text-neutral-500" />
                  <Typography as="span" className="font-normal">
                    Document Hub
                  </Typography>
                </DesignLink>
              )}
            </>
          )}
        </Box>

        <Box as="div" className="flex items-center gap-2 px-3">
          <Button
            variant="neutral-flat"
            size="sm"
            className="hidden md:inline-flex"
            aria-label="Search"
            icon={<Search size={14} />}
          >
            Search
            <Typography
              as="span"
              variant="small"
              tone="muted"
              className="ml-1 border border-neutral-200 px-1.5 py-0.5 text-[10px]"
            >
              ⌘K
            </Typography>
          </Button>

          {currentOrg && (
            <Button
              as={NextLink}
              href={`${ROUTES.org.projects(orgId)}?create=1`}
              variant="neutral-flat"
              size="sm"
              icon={<Plus size={14} />}
            >
              <span className="hidden sm:inline">New</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => setHelpOpen(true)}
            className="rounded-none text-neutral-500"
            aria-label="Help guide"
            icon={<CircleHelp size={18} />}
          />

          <Box as="div" className="relative">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={() => setUserMenuOpen((v) => !v)}
              className="rounded-none"
              aria-expanded={userMenuOpen}
              aria-label="Account menu"
            >
              <Avatar
                src={profile?.avatar_url ?? undefined}
                alt={profile?.display_name}
                fallback={profile?.display_name?.charAt(0)?.toUpperCase()}
                size="xs"
              />
            </Button>
            {userMenuOpen && (
              <>
                <Box
                  as="div"
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setUserMenuOpen(false)}
                />
                <Box
                  as="div"
                  className="absolute right-0 top-full z-20 mt-1 flex w-52 flex-col border border-neutral-200 bg-white shadow-xl"
                >
                  <DesignLink
                    as={NextLink}
                    href="/onboarding/profile"
                    className="flex items-center gap-2 rounded-none px-4 py-2 text-sm hover:bg-neutral-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings size={14} className="shrink-0 text-neutral-500" />
                    Profile settings
                  </DesignLink>
                  <Button
                    variant="ghost"
                    size="md"
                    icon={<LogOut size={12} />}
                    onClick={() => {
                      setUserMenuOpen(false)
                      void handleLogout()
                    }}
                    className="w-full justify-start rounded-none px-4 py-2 text-sm"
                  >
                    Logout
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>

      <Box as="main" className="min-w-0 flex-1 p-4 lg:p-8">
        {children}
      </Box>

      <HelpGuideModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Box>
  )
}
