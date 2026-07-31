'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import {
  FileStack,
  FolderKanban,
  Users,
  LayoutDashboard,
  ListTree,
  Briefcase,
  ClipboardList,
  LayoutList,
  GanttChart,
  CalendarRange,
  Target,
  Shield,
  MessagesSquare,
  BarChart3,
  Gauge,
  UsersRound,
  Calculator,
  CircleDollarSign,
  TrendingUp,
  FileText,
  Landmark,
  GitPullRequestArrow,
  Menu,
  Bug,
  Rocket,
  Sparkles,
  Network,
  Headset,
  AppWindow,
  CalendarDays,
} from 'lucide-react'
import { Box, Button } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { FEATURES } from '@/config/features'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import {
  useAppShellAuthorization,
  useNavCapabilities,
  useNavCapabilityDeepLinkGuard,
  NavCapabilityKey,
} from '@/modules/auth/iam'
import { useProject } from '@/modules/projects/project'
import { useUnreadNotificationCount } from '@/modules/notifications'
import { setAiAssistantHeaderContext } from '@/shared/lib/aiAssistantHeaders'
import { setKnowledgeHeaderContext } from '@/shared/lib/knowledgeHeaders'
import { cn } from '@/utils/cn'
import { ShellSidebar } from './ShellSidebar'
import { PageContentEnter } from './PageContentEnter'
import { SidebarTopRow } from './SidebarTopRow'
import { CommonNavigation } from './CommonNavigation'
import { UserOrganizationMenu } from './UserOrganizationMenu'
import { SettingsNavigation } from './SettingsNavigation'
import { buildSettingsNavSections } from './buildSettingsNavSections'
import { isWorkbenchPath } from '../lib/isWorkbenchPath'

const HelpGuideModal = dynamic(() => import('./HelpGuideModal').then((m) => m.HelpGuideModal), {
  ssr: false,
})
const GlobalSearchPalette = dynamic(
  () => import('./GlobalSearchPalette').then((m) => m.GlobalSearchPalette),
  { ssr: false }
)
const NotificationsQuickPanel = dynamic(
  () => import('./NotificationsQuickPanel').then((m) => m.NotificationsQuickPanel),
  { ssr: false }
)
const AiAssistantQuickPanel = dynamic(
  () => import('./AiAssistantQuickPanel').then((m) => m.AiAssistantQuickPanel),
  { ssr: false }
)
const AiProjectSidebarPanel = dynamic(
  () =>
    import('@/modules/ai-assistant/presentation/ui/AiProjectSidebarPanel').then(
      (m) => m.AiProjectSidebarPanel
    ),
  { ssr: false }
)

interface AppShellProps {
  workspaceId: string
  children: React.ReactNode
}

const SETTINGS_MODE_KEY = 'scopery.sidebar.settingsMode'
const SIDEBAR_COLLAPSED_KEY = 'scopery.sidebar.collapsed'
const SIDEBAR_PINNED_KEY = 'scopery.sidebar.pinned'

function pathActive(pathname: string | null, href: string) {
  return pathname === href || (pathname?.startsWith(href + '/') ?? false)
}

export function AppShell({ workspaceId, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, session, workspaces, switchWorkspace, logout } = useAuth()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [settingsMode, setSettingsMode] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)
  const [prevUnread, setPrevUnread] = useState(0)
  const [badgePopKey, setBadgePopKey] = useState(0)
  const notificationsAnchorRef = useRef<HTMLButtonElement>(null!)
  const aiAssistantAnchorRef = useRef<HTMLButtonElement>(null!)

  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1')
      setSidebarPinned(localStorage.getItem(SIDEBAR_PINNED_KEY) === '1')
      setSettingsMode(sessionStorage.getItem(SETTINGS_MODE_KEY) === '1')
    } catch {
      /* ignore */
    }
  }, [])

  const setSettingsModePersisted = useCallback((next: boolean) => {
    setSettingsMode(next)
    try {
      sessionStorage.setItem(SETTINGS_MODE_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [])

  const persistCollapsed = useCallback((next: boolean) => {
    setSidebarCollapsed(next)
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [])

  const persistPinned = useCallback((next: boolean) => {
    setSidebarPinned(next)
    try {
      localStorage.setItem(SIDEBAR_PINNED_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [])

  const workbenchRoute = isWorkbenchPath(pathname)
  const effectiveCollapsed = sidebarPinned ? false : workbenchRoute || sidebarCollapsed

  const toggleSidebarCollapsed = () => {
    if (workbenchRoute && effectiveCollapsed) {
      persistPinned(true)
      persistCollapsed(false)
      setSwitcherOpen(false)
      return
    }
    if (workbenchRoute && !effectiveCollapsed) {
      persistPinned(false)
      persistCollapsed(true)
      setSwitcherOpen(false)
      return
    }
    const next = !sidebarCollapsed
    if (next) {
      setSwitcherOpen(false)
      persistPinned(false)
    }
    persistCollapsed(next)
  }

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileNavOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileNavOpen])

  const currentWorkspace = useMemo(
    () => workspaces.find((w) => w.id === workspaceId) ?? null,
    [workspaceId, workspaces]
  )

  const projectMatch = pathname?.match(/^\/workspace\/[^/]+\/projects\/([^/]+)(?:\/|$)/)
  const projectId = projectMatch?.[1] ?? null
  const isProjectWorkbench = Boolean(projectId)
  const { project: workbenchProject } = useProject(
    isProjectWorkbench ? workspaceId : null,
    projectId
  )
  const { unreadCount } = useUnreadNotificationCount(45000)

  useEffect(() => {
    const actorId = session?.user?.id ?? null
    setKnowledgeHeaderContext({
      workspaceId,
      actorId,
    })
    setAiAssistantHeaderContext({
      workspaceId,
      actorId,
    })
  }, [workspaceId, session?.user?.id])

  useEffect(() => {
    if (unreadCount > prevUnread && unreadCount > 0) {
      setBadgePopKey((k) => k + 1)
    }
    setPrevUnread(unreadCount)
  }, [unreadCount, prevUnread])

  const {
    canAccessAdmin,
    canUpdateWorkspace,
    canManageMembers,
    canInviteMembers,
    canManageJoinRequests,
    canViewTeams,
  } = useAppShellAuthorization(workspaceId, currentWorkspace?.organizationId)

  const orgId = currentWorkspace?.organizationId ?? null
  const navPacks = useMemo(() => {
    const packs: Array<'NAV_WORKSPACE' | 'NAV_PROJECT' | 'NAV_ORG' | 'NAV_SETTINGS'> = [
      'NAV_WORKSPACE',
      'NAV_SETTINGS',
    ]
    if (projectId) packs.push('NAV_PROJECT')
    if (orgId) packs.push('NAV_ORG')
    return packs
  }, [projectId, orgId])

  const {
    can: canCap,
    loading: navCapsLoading,
    ready: navCapsReady,
    caps: navCaps,
  } = useNavCapabilities({
    workspaceId,
    organizationId: orgId,
    projectId,
    packs: navPacks,
  })

  useNavCapabilityDeepLinkGuard({
    workspaceId,
    loading: navCapsLoading,
    ready: navCapsReady,
    can: canCap,
    caps: navCaps,
  })

  /** Hide-by-default while loading to avoid flash of unauthorized tabs. */
  const showCap = useCallback(
    (key: string, showWhileLoading = false) => (navCapsLoading ? showWhileLoading : canCap(key)),
    [navCapsLoading, canCap]
  )

  const canViewDocumentHub = showCap(NavCapabilityKey.CommonDocumentHub, true)

  const canManageWorkspace = canUpdateWorkspace
  const organizationName =
    currentWorkspace?.organizationName ?? currentWorkspace?.organizationId ?? 'Organization'

  const secondaryLabel = currentWorkspace?.name ?? 'Workspace'
  const primaryLabel = isProjectWorkbench
    ? workbenchProject
      ? workbenchProject.name
      : 'Project'
    : 'All projects'

  const overviewActive = pathname === ROUTES.workspace.root(workspaceId)
  const activityActive = pathActive(pathname, ROUTES.workspace.activity(workspaceId))
  const projectsListPath = ROUTES.workspace.projects(workspaceId)
  const projectsActive =
    !isProjectWorkbench &&
    (pathname === projectsListPath || pathname?.startsWith(projectsListPath + '/'))
  const documentHubActive =
    pathActive(pathname, ROUTES.workspace.documentHub(workspaceId)) ||
    pathActive(pathname, ROUTES.workspace.settingsTemplates(workspaceId))
  const workInboxActive = pathActive(pathname, ROUTES.workspace.workInbox(workspaceId))
  const myWorkActive =
    pathActive(pathname, ROUTES.workspace.myInsights(workspaceId)) ||
    pathActive(pathname, ROUTES.workspace.myWork(workspaceId))
  const clientsActive = pathActive(pathname, ROUTES.workspace.clients(workspaceId))
  const capacityActive = pathActive(pathname, ROUTES.workspace.capacity(workspaceId))
  const notificationsActive = pathActive(pathname, ROUTES.workspace.notifications(workspaceId))
  const agentControlActive = pathActive(pathname, ROUTES.workspace.agentControl(workspaceId))
  const onWorkspaceDirectory =
    pathActive(pathname, ROUTES.workspace.directory(workspaceId).split('?')[0]) ||
    pathActive(pathname, ROUTES.workspace.members(workspaceId)) ||
    pathActive(pathname, ROUTES.workspace.invitations(workspaceId)) ||
    pathActive(pathname, ROUTES.workspace.joinRequests(workspaceId))
  const onOrgDirectory =
    pathActive(pathname, `/workspace/${workspaceId}/organization/directory`) ||
    pathActive(pathname, `/workspace/${workspaceId}/organization/members`) ||
    pathActive(pathname, `/workspace/${workspaceId}/organization/invitations`) ||
    pathActive(pathname, ROUTES.workspace.teams(workspaceId))

  const workspaceSidebarSections = useMemo(() => {
    const workspaceItems = [
      showCap(NavCapabilityKey.WorkspaceOverview, true)
        ? {
            label: 'Overview',
            href: ROUTES.workspace.root(workspaceId),
            icon: <LayoutDashboard size={16} />,
            active: overviewActive,
          }
        : null,
      showCap(NavCapabilityKey.WorkspaceActivity)
        ? {
            label: 'Activity',
            href: ROUTES.workspace.activity(workspaceId),
            icon: <FileStack size={16} />,
            active: activityActive,
          }
        : null,
      null, // Team Pulse hidden temporarily
      showCap(NavCapabilityKey.WorkspaceProjects, true)
        ? {
            label: 'Projects',
            href: ROUTES.workspace.projects(workspaceId),
            icon: <FolderKanban size={16} />,
            active: projectsActive,
          }
        : null,
      showCap(NavCapabilityKey.WorkspaceCapacity)
        ? {
            label: 'Capacity',
            href: ROUTES.workspace.capacity(workspaceId),
            icon: <Gauge size={16} />,
            active: capacityActive,
          }
        : null,
      showCap(NavCapabilityKey.WorkspaceClients)
        ? {
            label: 'Clients & Contacts',
            href: ROUTES.workspace.clients(workspaceId),
            icon: <Briefcase size={16} />,
            active: clientsActive,
          }
        : null,
      FEATURES.requirementsTraceability && showCap(NavCapabilityKey.WorkspaceApplications)
        ? {
            label: 'Applications',
            href: ROUTES.workspace.applications(workspaceId),
            icon: <AppWindow size={16} />,
            active: pathActive(pathname, ROUTES.workspace.applications(workspaceId)),
          }
        : null,
      FEATURES.serviceSupport && showCap(NavCapabilityKey.WorkspaceSupport)
        ? {
            label: 'Support',
            href: ROUTES.workspace.support(workspaceId),
            icon: <Headset size={16} />,
            active: pathActive(pathname, ROUTES.workspace.support(workspaceId)),
          }
        : null,
      showCap(NavCapabilityKey.WorkspaceDirectory, true) ||
      showCap(NavCapabilityKey.WorkspaceDirectoryMembers, true)
        ? {
            label: 'Directory',
            href: ROUTES.workspace.directory(workspaceId),
            icon: <Users size={16} />,
            active: onWorkspaceDirectory,
          }
        : null,
    ].filter(Boolean) as Array<{
      label: string
      href: string
      icon: ReactNode
      active: boolean
    }>

    const sections: Array<{
      label: string
      items: Array<{ label: string; href: string; icon: ReactNode; active: boolean }>
    }> = []

    if (workspaceItems.length) {
      sections.push({ label: 'Workspace', items: workspaceItems })
    }

    if (
      showCap(NavCapabilityKey.OrgDirectory) ||
      showCap(NavCapabilityKey.OrgDirectoryMembers) ||
      showCap(NavCapabilityKey.OrgDirectoryInvitations) ||
      showCap(NavCapabilityKey.OrgDirectoryTeams)
    ) {
      sections.push({
        label: 'Organization',
        items: [
          {
            label: 'Directory',
            href: ROUTES.workspace.organizationDirectory(workspaceId),
            icon: <Users size={16} />,
            active: onOrgDirectory,
          },
        ],
      })
    }

    return sections
  }, [
    workspaceId,
    pathname,
    overviewActive,
    activityActive,
    projectsActive,
    capacityActive,
    clientsActive,
    onWorkspaceDirectory,
    onOrgDirectory,
    showCap,
  ])

  const projectWorkbenchSections = useMemo(() => {
    if (!projectId) return []
    const overviewHref = ROUTES.workspace.projectOverview(workspaceId, projectId)
    const workHref = ROUTES.workspace.projectWork(workspaceId, projectId)
    const wbsHref = ROUTES.workspace.projectWbs(workspaceId, projectId)
    const timelineHref = ROUTES.workspace.projectTimeline(workspaceId, projectId)
    const scheduleHref = ROUTES.workspace.projectSchedule(workspaceId, projectId)
    const resourcesHref = ROUTES.workspace.projectResources(workspaceId, projectId)
    const estimationHref = ROUTES.workspace.projectEstimation(workspaceId, projectId)
    const financialsHref = ROUTES.workspace.projectFinancials(workspaceId, projectId)
    const profitabilityHref = ROUTES.workspace.projectProfitability(workspaceId, projectId)
    const quotesHref = ROUTES.workspace.projectQuotes(workspaceId, projectId)
    const baselinesHref = ROUTES.workspace.projectBaselines(workspaceId, projectId)
    const changeRequestsHref = ROUTES.workspace.projectChangeRequests(workspaceId, projectId)
    const scopeHref = ROUTES.workspace.projectScope(workspaceId, projectId)
    const deliverablesHref = ROUTES.workspace.projectDeliverables(workspaceId, projectId)
    const raidHref = ROUTES.workspace.projectRaid(workspaceId, projectId)
    const decisionsHref = ROUTES.workspace.projectDecisions(workspaceId, projectId)
    const reportsHref = ROUTES.workspace.projectReports(workspaceId, projectId)
    const meetingsHref = ROUTES.workspace.projectMeetings(workspaceId, projectId)
    const qualityHref = ROUTES.workspace.projectQuality(workspaceId, projectId)
    const qualityCasesHref = ROUTES.workspace.projectQualityCases(workspaceId, projectId)
    const qualityRunsHref = ROUTES.workspace.projectQualityRuns(workspaceId, projectId)
    const qualityDefectsHref = ROUTES.workspace.projectQualityDefects(workspaceId, projectId)
    const qualityReleasesHref = ROUTES.workspace.projectQualityReleases(workspaceId, projectId)
    const testPlansHref = ROUTES.workspace.projectTestPlans(workspaceId, projectId)
    const testCasesHref = ROUTES.workspace.projectTestCases(workspaceId, projectId)
    const verificationCasesHref = ROUTES.workspace.projectVerificationCases(
      workspaceId,
      projectId
    )
    const testRunsHref = ROUTES.workspace.projectTestRuns(workspaceId, projectId)
    const defectsHref = ROUTES.workspace.projectDefects(workspaceId, projectId)
    const releasesHref = ROUTES.workspace.projectReleases(workspaceId, projectId)
    const requirementsHref = ROUTES.workspace.projectRequirements(workspaceId, projectId)
    const functionalCatalogHref = ROUTES.workspace.projectFunctionalCatalog(workspaceId, projectId)
    const applicationStructureHref = ROUTES.workspace.projectApplicationStructure(
      workspaceId,
      projectId
    )
    const useCasesHref = ROUTES.workspace.projectUseCases(workspaceId, projectId)
    const traceabilityHref = ROUTES.workspace.projectTraceability(workspaceId, projectId)
    const projectGovHref = ROUTES.workspace.projectGovernance(workspaceId, projectId)
    const aiPlanningHref = ROUTES.workspace.projectAiPlanning(workspaceId, projectId)
    const recommendationsHref = ROUTES.workspace.projectRecommendations(workspaceId, projectId)
    const clientCollabHref = ROUTES.workspace.projectClientCollaboration(workspaceId, projectId)
    const dashboardHref = ROUTES.workspace.projectDashboard(workspaceId, projectId)

    const sections = [
      {
        label: 'Project',
        items: [
          {
            label: 'Overview',
            href: overviewHref,
            icon: <LayoutDashboard size={16} />,
            active:
              pathname === overviewHref ||
              pathname?.endsWith(`/projects/${projectId}/overview`) === true,
          },
          ...(showCap(NavCapabilityKey.ProjectDirectoryMembers, true)
            ? [
                {
                  label: 'Directory',
                  href: ROUTES.workspace.projectMembers(workspaceId, projectId),
                  icon: <Users size={16} />,
                  active: pathActive(
                    pathname,
                    ROUTES.workspace.projectMembers(workspaceId, projectId)
                  ),
                },
              ]
            : []),
        ],
      },
      {
        label: 'Plan',
        items: [
          {
            label: 'Work Items',
            href: workHref,
            icon: <LayoutList size={16} />,
            active: pathActive(pathname, workHref),
          },
          {
            label: 'WBS',
            href: wbsHref,
            icon: <ListTree size={16} />,
            active: pathActive(pathname, wbsHref),
          },
          {
            label: 'Timeline',
            href: timelineHref,
            icon: <GanttChart size={16} />,
            active: pathActive(pathname, timelineHref),
          },
          {
            label: 'Schedule',
            href: scheduleHref,
            icon: <CalendarRange size={16} />,
            active: pathActive(pathname, scheduleHref),
          },
          {
            label: 'Resources',
            href: resourcesHref,
            icon: <UsersRound size={16} />,
            active: pathActive(pathname, resourcesHref),
          },
        ],
      },
      {
        label: 'Scope & Requirements',
        items: [
          {
            label: 'Scope',
            href: scopeHref,
            icon: <Target size={16} />,
            active: pathActive(pathname, scopeHref),
          },
          {
            label: 'Deliverables',
            href: deliverablesHref,
            icon: <FileStack size={16} />,
            active: pathActive(pathname, deliverablesHref),
          },
          ...(FEATURES.requirementsTraceability
            ? [
                {
                  label: 'Requirements',
                  href: requirementsHref,
                  icon: <ClipboardList size={16} />,
                  active: pathActive(pathname, requirementsHref),
                },
                {
                  label: 'Functions',
                  href: functionalCatalogHref,
                  icon: <ListTree size={16} />,
                  active: pathActive(pathname, functionalCatalogHref),
                },
                {
                  label: 'Use Cases',
                  href: useCasesHref,
                  icon: <ClipboardList size={16} />,
                  active: pathActive(pathname, useCasesHref),
                },
                {
                  label: 'Application Structure',
                  href: applicationStructureHref,
                  icon: <LayoutList size={16} />,
                  active: pathActive(pathname, applicationStructureHref),
                },
                {
                  label: 'Traceability',
                  href: traceabilityHref,
                  icon: <Network size={16} />,
                  active: pathActive(pathname, traceabilityHref),
                },
              ]
            : []),
        ],
      },
      ...(FEATURES.quality
        ? [
            {
              label: 'Quality',
              items: FEATURES.qualitySimplifiedWorkflow
                ? [
                    {
                      label: 'Overview',
                      href: qualityHref,
                      icon: <Gauge size={16} />,
                      active:
                        pathActive(pathname, qualityHref) &&
                        !pathActive(pathname, qualityCasesHref) &&
                        !pathActive(pathname, qualityRunsHref) &&
                        !pathActive(pathname, qualityDefectsHref) &&
                        !pathActive(pathname, qualityReleasesHref),
                    },
                    {
                      label: 'Cases',
                      href: qualityCasesHref,
                      icon: <ClipboardList size={16} />,
                      active: pathActive(pathname, qualityCasesHref),
                    },
                    {
                      label: 'Runs',
                      href: qualityRunsHref,
                      icon: <CalendarDays size={16} />,
                      active: pathActive(pathname, qualityRunsHref),
                    },
                    {
                      label: 'Defects',
                      href: qualityDefectsHref,
                      icon: <Bug size={16} />,
                      active: pathActive(pathname, qualityDefectsHref),
                    },
                    {
                      label: 'Releases',
                      href: qualityReleasesHref,
                      icon: <Rocket size={16} />,
                      active: pathActive(pathname, qualityReleasesHref),
                    },
                  ]
                : [
                    {
                      label: 'Quality',
                      href: qualityHref,
                      icon: <Gauge size={16} />,
                      active:
                        pathActive(pathname, qualityHref) &&
                        !pathActive(pathname, testPlansHref) &&
                        !pathActive(pathname, testCasesHref) &&
                        !pathActive(pathname, verificationCasesHref) &&
                        !pathActive(pathname, testRunsHref),
                    },
                    {
                      label: 'Test plans',
                      href: testPlansHref,
                      icon: <ClipboardList size={16} />,
                      active: pathActive(pathname, testPlansHref),
                    },
                    {
                      label: 'Test Cases',
                      href: testCasesHref,
                      icon: <ClipboardList size={16} />,
                      active: pathActive(pathname, testCasesHref),
                    },
                    {
                      label: 'Verification Cases',
                      href: verificationCasesHref,
                      icon: <Gauge size={16} />,
                      active: pathActive(pathname, verificationCasesHref),
                    },
                    {
                      label: 'Test Runs',
                      href: testRunsHref,
                      icon: <CalendarDays size={16} />,
                      active: pathActive(pathname, testRunsHref),
                    },
                    {
                      label: 'Defects',
                      href: defectsHref,
                      icon: <Bug size={16} />,
                      active: pathActive(pathname, defectsHref),
                    },
                    {
                      label: 'Releases',
                      href: releasesHref,
                      icon: <Rocket size={16} />,
                      active: pathActive(pathname, releasesHref),
                    },
                  ],
            },
          ]
        : []),
      {
        label: 'Commercial',
        items: [
          {
            label: 'Estimation',
            href: estimationHref,
            icon: <Calculator size={16} />,
            active: pathActive(pathname, estimationHref),
          },
          {
            label: 'Financials',
            href: financialsHref,
            icon: <CircleDollarSign size={16} />,
            active: pathActive(pathname, financialsHref),
          },
          {
            label: 'Profitability',
            href: profitabilityHref,
            icon: <TrendingUp size={16} />,
            active: pathActive(pathname, profitabilityHref),
          },
          {
            label: 'Quotes',
            href: quotesHref,
            icon: <FileText size={16} />,
            active: pathActive(pathname, quotesHref),
          },
        ],
      },
      {
        label: 'Control',
        items: [
          {
            label: 'RAID',
            href: raidHref,
            icon: <Shield size={16} />,
            active: pathActive(pathname, raidHref),
          },
          {
            label: 'Decisions',
            href: decisionsHref,
            icon: <ClipboardList size={16} />,
            active: pathActive(pathname, decisionsHref),
          },
          {
            label: 'Baselines',
            href: baselinesHref,
            icon: <Landmark size={16} />,
            active: pathActive(pathname, baselinesHref),
          },
          {
            label: 'Change Requests',
            href: changeRequestsHref,
            icon: <GitPullRequestArrow size={16} />,
            active: pathActive(pathname, changeRequestsHref),
          },
          ...(FEATURES.projectGovernance
            ? [
                {
                  label: 'Governance',
                  href: projectGovHref,
                  icon: <Shield size={16} />,
                  active: pathActive(pathname, projectGovHref),
                },
              ]
            : []),
        ],
      },
      {
        label: 'Collaboration',
        items: [
          {
            label: 'Meetings',
            href: meetingsHref,
            icon: <MessagesSquare size={16} />,
            active: pathname?.includes(`/projects/${projectId}/meetings`) === true,
          },
          ...(FEATURES.clientCollaboration
            ? [
                {
                  label: 'Client Collaboration',
                  href: clientCollabHref,
                  icon: <Users size={16} />,
                  active: pathActive(pathname, clientCollabHref),
                },
              ]
            : []),
        ],
      },
      {
        label: 'Intelligence',
        items: [
          ...(FEATURES.aiPlanning
            ? [
                {
                  label: 'AI Planning',
                  href: aiPlanningHref,
                  icon: <Sparkles size={16} />,
                  active: pathActive(pathname, aiPlanningHref),
                },
              ]
            : []),
          {
            label: 'Reports',
            href: reportsHref,
            icon: <BarChart3 size={16} />,
            active: pathActive(pathname, reportsHref),
          },
          ...(FEATURES.reporting
            ? [
                {
                  label: 'Dashboard',
                  href: dashboardHref,
                  icon: <LayoutDashboard size={16} />,
                  active: pathActive(pathname, dashboardHref),
                },
              ]
            : []),
        ],
      },
    ]

    const hrefToCap: Record<string, string | string[]> = {
      [overviewHref]: NavCapabilityKey.ProjectOverview,
      [workHref]: NavCapabilityKey.ProjectWork,
      [wbsHref]: NavCapabilityKey.ProjectWbs,
      [timelineHref]: NavCapabilityKey.ProjectTimeline,
      [scheduleHref]: NavCapabilityKey.ProjectSchedule,
      [resourcesHref]: NavCapabilityKey.ProjectResources,
      [scopeHref]: NavCapabilityKey.ProjectScope,
      [deliverablesHref]: NavCapabilityKey.ProjectDeliverables,
      [requirementsHref]: NavCapabilityKey.ProjectRequirements,
      [functionalCatalogHref]: NavCapabilityKey.ProjectFunctionalCatalog,
      [useCasesHref]: NavCapabilityKey.ProjectFunctionalCatalog,
      [applicationStructureHref]: NavCapabilityKey.ProjectApplicationStructure,
      [traceabilityHref]: NavCapabilityKey.ProjectTraceability,
      [qualityHref]: NavCapabilityKey.ProjectQuality,
      [qualityCasesHref]: [
        NavCapabilityKey.ProjectTestPlans,
        NavCapabilityKey.ProjectQuality,
        NavCapabilityKey.ProjectScope,
        NavCapabilityKey.ProjectRequirements,
        NavCapabilityKey.ProjectRaid,
      ],
      [qualityRunsHref]: [
        NavCapabilityKey.ProjectTestPlans,
        NavCapabilityKey.ProjectQuality,
        NavCapabilityKey.ProjectScope,
        NavCapabilityKey.ProjectRequirements,
        NavCapabilityKey.ProjectRaid,
      ],
      [qualityDefectsHref]: [
        NavCapabilityKey.ProjectDefects,
        NavCapabilityKey.ProjectQuality,
        NavCapabilityKey.ProjectTestPlans,
      ],
      [qualityReleasesHref]: [
        NavCapabilityKey.ProjectReleases,
        NavCapabilityKey.ProjectQuality,
        NavCapabilityKey.ProjectTestPlans,
      ],
      [testPlansHref]: [
        NavCapabilityKey.ProjectTestPlans,
        NavCapabilityKey.ProjectQuality,
        NavCapabilityKey.ProjectScope,
        NavCapabilityKey.ProjectRequirements,
        NavCapabilityKey.ProjectRaid,
      ],
      [testCasesHref]: [
        NavCapabilityKey.ProjectTestPlans,
        NavCapabilityKey.ProjectQuality,
        NavCapabilityKey.ProjectScope,
        NavCapabilityKey.ProjectRequirements,
        NavCapabilityKey.ProjectRaid,
      ],
      [verificationCasesHref]: [
        NavCapabilityKey.ProjectTestPlans,
        NavCapabilityKey.ProjectQuality,
        NavCapabilityKey.ProjectScope,
        NavCapabilityKey.ProjectRequirements,
        NavCapabilityKey.ProjectRaid,
      ],
      [testRunsHref]: [
        NavCapabilityKey.ProjectTestPlans,
        NavCapabilityKey.ProjectQuality,
        NavCapabilityKey.ProjectScope,
        NavCapabilityKey.ProjectRequirements,
        NavCapabilityKey.ProjectRaid,
      ],
      [defectsHref]: NavCapabilityKey.ProjectDefects,
      [releasesHref]: NavCapabilityKey.ProjectReleases,
      [estimationHref]: NavCapabilityKey.ProjectEstimation,
      [financialsHref]: NavCapabilityKey.ProjectFinancials,
      [profitabilityHref]: NavCapabilityKey.ProjectProfitability,
      [quotesHref]: NavCapabilityKey.ProjectQuotes,
      [raidHref]: NavCapabilityKey.ProjectRaid,
      [decisionsHref]: NavCapabilityKey.ProjectDecisions,
      [baselinesHref]: NavCapabilityKey.ProjectBaselines,
      [changeRequestsHref]: NavCapabilityKey.ProjectChangeRequests,
      [projectGovHref]: NavCapabilityKey.ProjectGovernance,
      [meetingsHref]: NavCapabilityKey.ProjectMeetings,
      [clientCollabHref]: NavCapabilityKey.ProjectClientCollaboration,
      [aiPlanningHref]: NavCapabilityKey.ProjectAiPlanning,
      [recommendationsHref]: NavCapabilityKey.ProjectRecommendations,
      [reportsHref]: NavCapabilityKey.ProjectReports,
      [dashboardHref]: NavCapabilityKey.ProjectDashboard,
    }

    const memberDefaults = new Set<string>([
      NavCapabilityKey.ProjectOverview,
      NavCapabilityKey.ProjectWork,
      NavCapabilityKey.ProjectWbs,
      NavCapabilityKey.ProjectTimeline,
      NavCapabilityKey.ProjectSchedule,
      NavCapabilityKey.ProjectScope,
      NavCapabilityKey.ProjectDeliverables,
      NavCapabilityKey.ProjectRequirements,
      NavCapabilityKey.ProjectFunctionalCatalog,
      NavCapabilityKey.ProjectApplicationStructure,
      NavCapabilityKey.ProjectTraceability,
      NavCapabilityKey.ProjectRaid,
      NavCapabilityKey.ProjectDecisions,
      NavCapabilityKey.ProjectMeetings,
      NavCapabilityKey.ProjectReports,
      NavCapabilityKey.ProjectDirectoryMembers,
    ])

    // Sensitive tabs: never flash while loading (Quality / Commercial / Resources / AI).
    const neverFlash = new Set<string>([
      NavCapabilityKey.ProjectResources,
      NavCapabilityKey.ProjectQuality,
      NavCapabilityKey.ProjectTestPlans,
      NavCapabilityKey.ProjectDefects,
      NavCapabilityKey.ProjectReleases,
      NavCapabilityKey.ProjectEstimation,
      NavCapabilityKey.ProjectFinancials,
      NavCapabilityKey.ProjectProfitability,
      NavCapabilityKey.ProjectQuotes,
      NavCapabilityKey.ProjectBaselines,
      NavCapabilityKey.ProjectChangeRequests,
      NavCapabilityKey.ProjectGovernance,
      NavCapabilityKey.ProjectAiPlanning,
      NavCapabilityKey.ProjectRecommendations,
      NavCapabilityKey.ProjectClientCollaboration,
      NavCapabilityKey.ProjectDashboard,
    ])

    const filtered = sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const requirement = item.href ? hrefToCap[item.href] : undefined
          if (!requirement) return true
          const keys = Array.isArray(requirement) ? requirement : [requirement]
          if (keys.some((key) => neverFlash.has(key))) {
            return keys.some((key) => showCap(key, false))
          }
          return keys.some((key) => showCap(key, memberDefaults.has(key)))
        }),
      }))
      .filter((s) => s.items.length > 0)

    return filtered
  }, [pathname, projectId, workspaceId, showCap])

  const settingsSections = useMemo(
    () =>
      buildSettingsNavSections(workspaceId, pathname, {
        canManageWorkspace: showCap(NavCapabilityKey.SettingsWorkspaceEntry),
        canManageMembers,
        canInviteMembers,
        canManageJoinRequests,
        canViewTeams,
        canAccessAdmin: false, // Admin Console only — never dump admin into settings
        isOrgOwner: showCap(NavCapabilityKey.SettingsOrganizationEntry),
        organizationId: currentWorkspace?.organizationId ?? null,
        projectId: showCap(NavCapabilityKey.SettingsProjectEntry) ? projectId : null,
      }),
    [
      workspaceId,
      pathname,
      canManageMembers,
      canInviteMembers,
      canManageJoinRequests,
      canViewTeams,
      currentWorkspace?.organizationId,
      projectId,
      showCap,
    ]
  )

  const contextBackHref =
    isProjectWorkbench && projectId
      ? ROUTES.workspace.projectOverview(workspaceId, projectId)
      : ROUTES.workspace.projects(workspaceId)
  const contextBackLabel = isProjectWorkbench ? 'Back to project' : 'Back to workspace'

  useEffect(() => {
    setSwitcherOpen(false)
    setNotificationsPanelOpen(false)
    setAiPanelOpen(false)
    // Keep aiSidebarOpen across in-project navigations; close when leaving project context
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setNotificationsPanelOpen(false)
        setAiPanelOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = ROUTES.auth.login
  }

  const handleSwitchWorkspace = async (nextWorkspaceId: string) => {
    if (nextWorkspaceId === workspaceId || switching) return
    setSwitching(true)
    setSwitcherOpen(false)
    setSettingsModePersisted(false)
    try {
      await switchWorkspace(nextWorkspaceId)
      router.push(ROUTES.workspace.projects(nextWorkspaceId))
    } finally {
      setSwitching(false)
    }
  }

  const handleOpenSettings = () => {
    setSettingsModePersisted(true)
    if (canManageWorkspace) {
      router.push(ROUTES.workspace.settingsGeneral(workspaceId))
    } else {
      router.push(ROUTES.account.profile)
    }
  }

  const handleExitSettings = () => {
    setSettingsModePersisted(false)
    if (pathname?.startsWith('/account')) {
      router.push(ROUTES.workspace.projects(workspaceId))
    }
  }

  // Personal account routes always show settings sidebar (Back → workspace).
  useEffect(() => {
    if (pathname?.startsWith('/account')) {
      setSettingsModePersisted(true)
    }
  }, [pathname, setSettingsModePersisted])

  const displayName = profile?.display_name ?? session?.user?.email ?? 'User'
  const avatarFallback = displayName.charAt(0).toUpperCase()

  const renderSidebarContent = (opts: { collapsed: boolean; onNavigate?: () => void }) => (
    <>
      <SidebarTopRow
        workspaceId={workspaceId}
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        collapsed={opts.collapsed}
        switcherOpen={switcherOpen}
        onToggleSwitcher={() => setSwitcherOpen((v) => !v)}
        onToggleCollapsed={toggleSidebarCollapsed}
        switcher={{
          open: switcherOpen,
          onClose: () => setSwitcherOpen(false),
          workspaces,
          currentWorkspaceId: workspaceId,
          currentProjectId: projectId,
          switching,
          onSwitchWorkspace: handleSwitchWorkspace,
        }}
      />

      {settingsMode ? (
        <SettingsNavigation
          collapsed={opts.collapsed}
          sections={settingsSections}
          backHref={contextBackHref}
          backLabel={contextBackLabel}
          onBack={() => {
            handleExitSettings()
            opts.onNavigate?.()
          }}
        />
      ) : (
        <>
          <CommonNavigation
            workspaceId={workspaceId}
            projectId={projectId}
            collapsed={opts.collapsed}
            documentHubActive={documentHubActive}
            workInboxActive={workInboxActive}
            myWorkActive={myWorkActive}
            notificationsActive={notificationsActive}
            agentControlActive={agentControlActive}
            canViewDocumentHub={canViewDocumentHub}
            canViewMyInsights={showCap(NavCapabilityKey.CommonMyInsights, true)}
            canViewWorkInbox={showCap(NavCapabilityKey.CommonWorkInbox, true)}
            unreadCount={unreadCount}
            badgePopKey={badgePopKey}
            onOpenSearch={() => {
              setSearchOpen(true)
              setNotificationsPanelOpen(false)
              setAiPanelOpen(false)
              opts.onNavigate?.()
            }}
            onOpenNotifications={() => {
              setNotificationsPanelOpen((v) => !v)
              setAiPanelOpen(false)
              setSearchOpen(false)
            }}
            onOpenAiAssistant={() => {
              if (isProjectWorkbench) {
                setAiSidebarOpen((v) => !v)
                setAiPanelOpen(false)
              } else {
                setAiPanelOpen((v) => !v)
                setAiSidebarOpen(false)
              }
              setNotificationsPanelOpen(false)
              setSearchOpen(false)
            }}
            notificationsOpen={notificationsPanelOpen}
            aiAssistantOpen={isProjectWorkbench ? aiSidebarOpen : aiPanelOpen}
            notificationsAnchorRef={notificationsAnchorRef}
            aiAssistantAnchorRef={aiAssistantAnchorRef}
          />

          <div className="mx-3 border-t border-neutral-100" />

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 py-2">
            <ShellSidebar
              ariaLabel={isProjectWorkbench ? 'Project navigation' : 'Workspace navigation'}
              collapsed={opts.collapsed}
              contextKey={isProjectWorkbench ? `project:${projectId}` : `workspace:${workspaceId}`}
              sections={isProjectWorkbench ? projectWorkbenchSections : workspaceSidebarSections}
            />
          </div>
        </>
      )}

      <UserOrganizationMenu
        collapsed={opts.collapsed}
        displayName={displayName}
        email={profile?.email ?? session?.user?.email}
        organizationName={organizationName}
        avatarFallback={avatarFallback}
        canAccessAdmin={canAccessAdmin}
        onLogout={() => void handleLogout()}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenSettings={() => {
          handleOpenSettings()
          opts.onNavigate?.()
        }}
      />
    </>
  )

  const immersiveDocumentEditor = Boolean(pathname?.match(/\/documents\/[^/]+\/edit\/?$/))
  const immersiveAiWorkspace = Boolean(pathname?.match(/\/workspace\/[^/]+\/ai(\/|$)/))
  const immersiveApplications = Boolean(pathname?.match(/\/workspace\/[^/]+\/applications(\/|$)/))
  const immersiveFunctionalCatalog = Boolean(
    pathname?.match(/\/projects\/[^/]+\/functional-catalog(?:\/|$)/)
  )
  const immersiveUseCases = Boolean(pathname?.match(/\/projects\/[^/]+\/use-cases(?:\/|$)/))
  const immersiveMain =
    immersiveDocumentEditor ||
    immersiveAiWorkspace ||
    immersiveApplications ||
    immersiveFunctionalCatalog ||
    immersiveUseCases
  // Immersive pages used to hide the AI sidebar (!immersiveMain). Keep full-bleed
  // content, but still allow the project chat beside it — except on the dedicated AI workspace.
  const showAiProjectSidebar = Boolean(
    aiSidebarOpen && isProjectWorkbench && projectId && !immersiveAiWorkspace
  )

  return (
    <Box as="div" className="flex h-screen flex-row overflow-hidden">
      {currentWorkspace ? (
        <>
          <Box
            as="aside"
            className={cn(
              'sidebar motion-sidebar-width relative z-20 hidden h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-white lg:flex',
              effectiveCollapsed ? 'w-16' : 'w-64'
            )}
          >
            {renderSidebarContent({ collapsed: effectiveCollapsed })}
          </Box>

          {mobileNavOpen ? (
            <>
              <div
                className="bg-neutral-900/20 motion-drawer-backdrop fixed inset-0 z-40 lg:hidden"
                aria-hidden
                onClick={() => setMobileNavOpen(false)}
              />
              <Box
                as="aside"
                className="sidebar motion-sheet-in fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-neutral-200 bg-white lg:hidden"
              >
                {renderSidebarContent({
                  collapsed: false,
                  onNavigate: () => setMobileNavOpen(false),
                })}
              </Box>
            </>
          ) : null}
        </>
      ) : null}

      <Box
        as="main"
        className={cn(
          'motion-main-resize relative flex min-h-0 min-w-0 flex-1 overflow-hidden',
          // AI sidebar needs a row layout even on immersive pages
          showAiProjectSidebar || !immersiveMain ? 'flex-row' : 'flex-col',
          immersiveMain && 'p-0'
        )}
      >
        <div
          className={cn(
            'min-h-0 flex-1',
            immersiveMain
              ? 'flex flex-col overflow-hidden'
              : 'overflow-y-auto px-3 py-3 lg:px-4 lg:py-3'
          )}
        >
          {currentWorkspace && !immersiveMain ? (
            <div className="mb-3 flex items-center gap-2 lg:hidden">
              <Button
                variant="outline"
                size="sm"
                icon={<Menu size={16} />}
                aria-label="Open navigation"
                onClick={() => setMobileNavOpen(true)}
              >
                Menu
              </Button>
            </div>
          ) : null}
          {currentWorkspace && immersiveMain ? (
            <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2 lg:hidden">
              <Button
                variant="outline"
                size="sm"
                icon={<Menu size={16} />}
                aria-label="Open navigation"
                onClick={() => setMobileNavOpen(true)}
              >
                Menu
              </Button>
            </div>
          ) : null}
          <PageContentEnter className={immersiveMain ? 'flex min-h-0 flex-1 flex-col' : undefined}>
            {children}
          </PageContentEnter>
        </div>

        {showAiProjectSidebar ? (
          <AiProjectSidebarPanel
            key={projectId}
            workspaceId={workspaceId}
            projectId={projectId}
            projectName={workbenchProject?.name ?? null}
            onClose={() => setAiSidebarOpen(false)}
          />
        ) : null}
      </Box>

      {helpOpen ? <HelpGuideModal open={helpOpen} onClose={() => setHelpOpen(false)} /> : null}
      {searchOpen ? (
        <GlobalSearchPalette
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          workspaceId={workspaceId}
          workspaces={workspaces}
          projectId={projectId}
        />
      ) : null}
      {notificationsPanelOpen ? (
        <NotificationsQuickPanel
          open={notificationsPanelOpen}
          onClose={() => setNotificationsPanelOpen(false)}
          workspaceId={workspaceId}
          anchorRef={notificationsAnchorRef}
        />
      ) : null}
      {aiPanelOpen ? (
        <AiAssistantQuickPanel
          open={aiPanelOpen}
          onClose={() => setAiPanelOpen(false)}
          workspaceId={workspaceId}
          projectId={projectId}
          projectName={workbenchProject?.name}
          anchorRef={aiAssistantAnchorRef}
        />
      ) : null}
    </Box>
  )
}
