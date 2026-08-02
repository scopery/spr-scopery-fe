'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { BookOpen, ChevronsUpDown, LogOut, Settings } from 'lucide-react'
import { Typography, Avatar, Button, Link as DesignLink, Box } from '@/shared/ui'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import {
  ADMIN_DIRECTORY_GROUPS,
  ADMIN_DIRECTORY_ITEMS,
  getAdminModuleForPath,
  isAdminDirectoryItemActive,
} from '@/modules/admin'
import { ROUTES } from '@/constants/routes'
import { AdminAppModeSwitch } from './AdminAppModeSwitch'
import { HelpGuideModal } from './HelpGuideModal'
import { cn } from '@/utils/cn'

interface AdminShellProps {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const { profile, logout } = useAuth()
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const currentModule = getAdminModuleForPath(pathname)
  const currentModuleLabel = currentModule?.label ?? 'Overview'

  const handleLogout = async () => {
    await logout()
    window.location.href = ROUTES.auth.login
  }

  useEffect(() => {
    setAdminMenuOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  return (
    <Box as="div" className="flex h-screen flex-col overflow-hidden">
      <Box
        as="header"
        className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white"
      >
        <Box as="div" className="flex min-w-0 items-center">
          <DesignLink
            as={NextLink}
            href="/"
            className="flex shrink-0 items-center rounded-none border-r border-neutral-300 px-6"
            aria-label="Scopery home"
          >
            <Image src="/scopery_logo_v2.png" alt="Scopery" width={20} height={20} />
          </DesignLink>

          <Box as="div" className="relative">
            <Button
              variant="ghost"
              onClick={() => setAdminMenuOpen((v) => !v)}
              className="mx-2 h-12 gap-3 rounded-none px-3 py-1 text-neutral-900"
              aria-expanded={adminMenuOpen}
              aria-haspopup="menu"
              iconRight={<ChevronsUpDown size={15} className="text-neutral-400" />}
            >
              <span className="flex min-w-0 flex-col items-start leading-tight">
                <Typography
                  as="span"
                  variant="small"
                  tone="muted"
                  className="text-[11px] leading-tight"
                >
                  Platform
                </Typography>
                <Typography as="span" weight="medium" className="text-sm leading-tight">
                  Admin Console
                </Typography>
              </span>
            </Button>

            {adminMenuOpen && (
              <>
                <Box
                  as="div"
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setAdminMenuOpen(false)}
                />
                <Box
                  as="div"
                  role="menu"
                  className="absolute left-2 top-full z-20 mt-1 max-h-[min(32rem,calc(100vh-5rem))] w-[28rem] max-w-[calc(100vw-2rem)] overflow-y-auto border border-neutral-200 bg-white shadow-md"
                >
                  <Box as="div" className="py-1.5">
                    {ADMIN_DIRECTORY_GROUPS.map((group) => {
                      const items = ADMIN_DIRECTORY_ITEMS.filter((item) => item.group === group)
                      if (items.length === 0) return null

                      return (
                        <Box as="section" key={group} className="py-0.5">
                          <Typography
                            as="p"
                            variant="small"
                            tone="muted"
                            weight="medium"
                            className="px-4 py-1.5 text-[10px] uppercase tracking-wide"
                          >
                            {group}
                          </Typography>
                          <Box as="div" className="flex flex-col">
                            {items.map((item) => {
                              const active = isAdminDirectoryItemActive(item, pathname)
                              const Icon = item.icon

                              return (
                                <DesignLink
                                  key={item.label}
                                  as={NextLink}
                                  href={item.href}
                                  role="menuitem"
                                  aria-current={active ? 'page' : undefined}
                                  className={cn(
                                    'flex min-h-[50px] gap-2.5 rounded-none border-l-2 border-transparent px-4 py-2 text-[13px] transition-colors hover:bg-neutral-50',
                                    active &&
                                      'border-primary bg-neutral-50 text-neutral-900 hover:bg-neutral-50'
                                  )}
                                  onClick={() => setAdminMenuOpen(false)}
                                >
                                  <span
                                    className={cn(
                                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-neutral-500',
                                      active && 'text-primary'
                                    )}
                                    aria-hidden
                                  >
                                    <Icon size={16} />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="flex min-w-0 items-center justify-between gap-3">
                                      <Typography
                                        as="span"
                                        weight="medium"
                                        className="truncate text-[13px] text-neutral-900"
                                      >
                                        {item.label}
                                      </Typography>
                                      <span
                                        className={cn(
                                          'h-1.5 w-1.5 shrink-0 rounded-full',
                                          active ? 'bg-primary' : 'bg-transparent'
                                        )}
                                        aria-hidden
                                      />
                                    </span>
                                    <Typography
                                      as="span"
                                      variant="small"
                                      tone="muted"
                                      className="mt-0.5 block truncate text-[11px] leading-snug"
                                    >
                                      {item.description}
                                    </Typography>
                                  </span>
                                </DesignLink>
                              )
                            })}
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              </>
            )}
          </Box>

          <Box as="div" className="mx-1 h-5 w-px shrink-0 bg-neutral-300" aria-hidden />

          <Typography
            as="span"
            className="min-w-0 truncate px-3 text-sm font-normal text-neutral-700"
          >
            {currentModuleLabel}
          </Typography>
        </Box>

        <Box as="div" className="flex shrink-0 items-center gap-2 px-3">
          <Button
            variant="ghost"
            onClick={() => setHelpOpen(true)}
            className="rounded-none text-neutral-600"
            icon={<BookOpen size={16} />}
          >
            Guideline
          </Button>

          <Box as="div" className="relative">
            <Button
              variant="ghost"
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
                  <AdminAppModeSwitch mode="admin" onNavigate={() => setUserMenuOpen(false)} />
                  <Button
                    variant="ghost"
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

      <Box
        as="main"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white p-6 lg:p-8"
      >
        {children}
      </Box>

      <HelpGuideModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Box>
  )
}
