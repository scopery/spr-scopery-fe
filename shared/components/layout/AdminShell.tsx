'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LogOut, Settings, Shield, FileStack, Bot, Wallet } from 'lucide-react'
import {
  Typography,
  Avatar,
  Button,
  Link as DesignLink,
  Box,
} from '@/shared/ui'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@/constants/routes'
import { FEATURES } from '@/config/features'
import { cn } from '@/utils'

interface AdminShellProps {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const { profile, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    window.location.href = ROUTES.auth.login
  }

  const isTemplatesPage = pathname === ROUTES.admin.templates || pathname?.startsWith(ROUTES.admin.templates + '/')
  const isAiAgentsPage = pathname === ROUTES.admin.aiAgents || pathname?.startsWith(ROUTES.admin.aiAgents + '/')
  const isAiBudgetsPage = pathname === ROUTES.admin.aiBudgets || pathname?.startsWith(ROUTES.admin.aiBudgets + '/')

  return (
    <Box as="div" className="min-h-screen flex flex-col">
      <Box as="header" className="h-16 sticky top-0 left-0 right-0 z-10 border-b border-neutral-200 bg-white flex items-center justify-between shrink-0">
        <Box as="div" className="flex items-center">
          <DesignLink as={NextLink} href="/" className="flex items-center gap-2 shrink-0 border-r-[1px] border-neutral-300 px-6 rounded-none">
            <Image src="/scopery_logo_v2.png" alt="Scopery" width={20} height={20} />
          </DesignLink>

          <Typography as="span" className="text-neutral-900 border-r-[1px] border-neutral-300 px-4">
            Admin Control
          </Typography>

          <DesignLink
            as={NextLink}
            href={ROUTES.admin.templates}
            className={cn(
              'flex items-center gap-2 mx-3 text-sm rounded-none transition-colors',
              isTemplatesPage ? 'text-primary' : 'text-neutral-600 hover:bg-neutral-100'
            )}
          >
            <FileStack size={14} className="text-neutral-500" />
            <Typography as="span" className="font-normal">
              Templates
            </Typography>
          </DesignLink>
          {FEATURES.aiAdminAgents ? (
            <DesignLink
              as={NextLink}
              href={ROUTES.admin.aiAgents}
              className={cn(
                'flex items-center gap-2 mx-3 text-sm rounded-none transition-colors',
                isAiAgentsPage ? 'text-primary' : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              <Bot size={14} className="text-neutral-500" />
              <Typography as="span" className="font-normal">
                AI Agents
              </Typography>
            </DesignLink>
          ) : null}
          {FEATURES.aiAdminAgents ? (
            <DesignLink
              as={NextLink}
              href={ROUTES.admin.aiBudgets}
              className={cn(
                'flex items-center gap-2 mx-3 text-sm rounded-none transition-colors',
                isAiBudgetsPage ? 'text-primary' : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              <Wallet size={14} className="text-neutral-500" />
              <Typography as="span" className="font-normal">
                AI Budgets
              </Typography>
            </DesignLink>
          ) : null}
        </Box>

        <Box as="div" className="flex items-center gap-2 px-3">
          <Box as="div" className="relative">
            <Button
              variant="ghost"
              size="md"
              iconOnly
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="rounded-full"
              aria-expanded={userMenuOpen}
            >
              <Avatar
                src={profile?.avatar_url ?? undefined}
                alt={profile?.display_name}
                size="xs"
              />
            </Button>
            {userMenuOpen && (
              <>
                <Box as="div" className="fixed inset-0 z-10" aria-hidden onClick={() => setUserMenuOpen(false)} />
                <Box
                  as="div"
                  className="absolute right-0 top-full mt-1 flex flex-col border border-neutral-200 shadow-xl bg-white w-48 z-20"
                >
                  <DesignLink
                    as={NextLink}
                    href="/onboarding/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings size={14} className="text-neutral-500 shrink-0" />
                    Profile settings
                  </DesignLink>
                  <DesignLink
                    as={NextLink}
                    href={ROUTES.admin.templates}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Shield size={14} className="text-neutral-500 shrink-0" />
                    Templates
                  </DesignLink>
                  {profile?.default_org_id && (
                    <DesignLink
                      as={NextLink}
                      href={ROUTES.org.projects(profile.default_org_id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FileStack size={14} className="text-neutral-500" />
                      Back to app
                    </DesignLink>
                  )}
                  <Button
                    variant="ghost"
                    size="md"
                    icon={<LogOut size={12} />}
                    onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                    className="w-full justify-start px-4 py-2 text-sm"
                  >
                    Logout
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>

      <Box as="main" className="flex-1 overflow-auto p-6 lg:p-8 bg-white">
        {children}
      </Box>
    </Box>
  )
}
