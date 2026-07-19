'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft, Plus } from 'lucide-react'
import {
  Button,
  ContentLoader,
  Input,
  Link as DesignLink,
  Stack,
  StepperHexagon,
  Typography,
} from '@/shared/ui'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { ROUTES } from '@/constants/routes'
import { useOnboarding } from '../hooks/useOnboarding'
import type { WorkspaceOnboardingOption, WorkspaceOnboardingStep } from '../model'

// ── Left intro panel ─────────────────────────────────────────────────────────

const INTRO_POINTS = [
  'Turn stakeholder ideas into signed-off specifications',
  'Keep requirements traceable from discovery to delivery',
  'Collaborate with your team in one shared workspace',
] as const

function OnboardingIntro() {
  return (
    <div className="mx-auto w-full max-w-lg lg:translate-x-4">
      <Typography
        as="h1"
        className="font-calsans mb-4 text-2xl font-bold leading-tight text-neutral-900 xl:text-3xl"
      >
        Build better requirements, together.
      </Typography>
      <Typography className="font-questrial mb-10 text-base leading-relaxed text-neutral-600 xl:text-lg">
        Scopery helps teams move from vague ideas to precise, stakeholder-ready specifications —
        with structure, traceability, and zero compromise on quality.
      </Typography>
      <ul className="space-y-4">
        {INTRO_POINTS.map((point, index) => (
          <li key={point} className="flex items-center gap-3">
            <StepperHexagon number={index + 1} active className="mt-0.5" />
            <Typography className="font-questrial text-sm leading-relaxed text-neutral-700 xl:text-base">
              {point}
            </Typography>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Step: choose option ───────────────────────────────────────────────────────

const WORKSPACE_OPTIONS: {
  value: WorkspaceOnboardingOption
  title: string
  description: string
}[] = [
  {
    value: 'CREATE_WORKSPACE',
    title: 'Create a new workspace',
    description: 'Set up a fresh workspace for your team.',
  },
  {
    value: 'JOIN_WITH_INVITATION',
    title: 'Join with invitation code',
    description: 'Enter a code shared by your workspace admin.',
  },
]

function ChooseOptionStep({
  onChoose,
  authReady,
}: {
  onChoose: (option: WorkspaceOnboardingOption) => void
  authReady: boolean
}) {
  return (
    <Stack direction="vertical" spacing="sm">
      {WORKSPACE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={!authReady}
          onClick={() => onChoose(opt.value)}
          className="w-full border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-neutral-900 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Typography className="text-sm font-medium text-neutral-900">{opt.title}</Typography>
          <Typography className="mt-0.5 text-sm text-neutral-500">{opt.description}</Typography>
        </button>
      ))}
    </Stack>
  )
}

// ── Step: create workspace ────────────────────────────────────────────────────

function nameToCode(name: string) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20)
}

function sanitizeCode(raw: string) {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '')
    .slice(0, 20)
}

function CreateWorkspaceStep({
  onSubmit,
  authReady,
}: {
  onSubmit: (payload: {
    organizationName: string
    organizationCode: string
    workspaceName: string
    workspaceCode: string
  }) => Promise<void>
  authReady: boolean
}) {
  const [orgName, setOrgName] = useState('')
  const [orgCode, setOrgCode] = useState('')
  const [orgCodeTouched, setOrgCodeTouched] = useState(false)
  const [wsName, setWsName] = useState('')
  const [wsCode, setWsCode] = useState('')
  const [wsCodeTouched, setWsCodeTouched] = useState(false)

  const handleOrgNameChange = (val: string) => {
    setOrgName(val)
    if (!orgCodeTouched) setOrgCode(nameToCode(val))
  }

  const handleWsNameChange = (val: string) => {
    setWsName(val)
    if (!wsCodeTouched) setWsCode(nameToCode(val))
  }

  const canSubmit = orgName.trim() && orgCode.trim() && wsName.trim() && wsCode.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    await onSubmit({
      organizationName: orgName.trim(),
      organizationCode: orgCode.trim(),
      workspaceName: wsName.trim(),
      workspaceCode: wsCode.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack direction="vertical" spacing="md">
        <div>
          <Typography className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Organization
          </Typography>
          <Stack direction="vertical" spacing="sm">
            <Input
              label="Organization name"
              value={orgName}
              onChange={(e) => handleOrgNameChange(e.target.value)}
              placeholder="e.g. Acme Corporation"
              fullWidth
              required
            />
            <Input
              label="Organization code"
              value={orgCode}
              onChange={(e) => {
                setOrgCodeTouched(true)
                setOrgCode(sanitizeCode(e.target.value))
              }}
              placeholder="e.g. ACME"
              fullWidth
              required
            />
          </Stack>
        </div>

        <div>
          <Typography className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Workspace
          </Typography>
          <Stack direction="vertical" spacing="sm">
            <Input
              label="Workspace name"
              value={wsName}
              onChange={(e) => handleWsNameChange(e.target.value)}
              placeholder="e.g. Product Team"
              fullWidth
              required
            />
            <Input
              label="Workspace code"
              value={wsCode}
              onChange={(e) => {
                setWsCodeTouched(true)
                setWsCode(sanitizeCode(e.target.value))
              }}
              placeholder="e.g. PRODUCT_TEAM"
              fullWidth
              required
            />
          </Stack>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={!authReady || !canSubmit}
          className="h-12 border-0 bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-400" icon={<Plus size={16} />}>
          Create workspace
        </Button>
      </Stack>
    </form>
  )
}

// ── Step: enter invitation code ───────────────────────────────────────────────

function EnterInvitationStep({
  onSubmit,
  authReady,
}: {
  onSubmit: (code: string) => Promise<void>
  authReady: boolean
}) {
  const [code, setCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    await onSubmit(code.trim())
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack direction="vertical" spacing="md">
        <Input
          label="Invitation code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your invitation code"
          fullWidth
          required
        />
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={!authReady || !code.trim()}
          className="h-12 border-0 bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-400" icon={<Check size={16} />}>
          Accept invitation
        </Button>
      </Stack>
    </form>
  )
}

// ── Step metadata ─────────────────────────────────────────────────────────────

const STEP_META: Partial<Record<WorkspaceOnboardingStep, { title: string; description: string }>> =
  {
    CHOOSE_WORKSPACE_OPTION: {
      title: 'Get started',
      description: 'Create a new workspace or join with an invitation code.',
    },
    CREATE_WORKSPACE: {
      title: 'Create your workspace',
      description: 'Set up a workspace for your team to collaborate in.',
    },
    ENTER_INVITATION_CODE: {
      title: 'Enter invitation code',
      description: 'Paste the code shared by your workspace admin.',
    },
    ACCEPT_INVITATION: {
      title: 'Accepting invitation...',
      description: '',
    },
  }

// ── Main view ─────────────────────────────────────────────────────────────────

const BACK_STEPS = new Set<WorkspaceOnboardingStep>(['CREATE_WORKSPACE', 'ENTER_INVITATION_CODE'])

function OnboardingFullPageLoader({ message }: { message?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <ContentLoader />
      {message ? (
        <Typography tone="muted" variant="small">
          {message}
        </Typography>
      ) : null}
    </main>
  )
}

export function OnboardingView() {
  const router = useRouter()
  const { logout, currentWorkspaceId, bootstrapStatus } = useAuth()
  const {
    status,
    loading,
    actionLoading,
    error,
    authReady,
    chooseOption,
    createWorkspace,
    acceptInvitation,
    resetChoice,
  } = useOnboarding()

  const step = status?.currentStep
  const effectiveStep: WorkspaceOnboardingStep = step ?? 'CHOOSE_WORKSPACE_OPTION'
  const meta = STEP_META[effectiveStep] ?? STEP_META.CHOOSE_WORKSPACE_OPTION!
  const showChooseOptions =
    status?.status === 'IN_PROGRESS' && effectiveStep === 'CHOOSE_WORKSPACE_OPTION'

  const showBack = !!step && BACK_STEPS.has(step)

  const completedWorkspaceId =
    currentWorkspaceId ??
    status?.currentWorkspaceId ??
    status?.createdWorkspaceId ??
    status?.targetWorkspaceId

  const isCompletingOnboarding =
    status?.status === 'COMPLETED' ||
    (actionLoading && effectiveStep === 'ACCEPT_INVITATION')

  const showFullPageLoading =
    loading || actionLoading || (status?.status === 'COMPLETED' && bootstrapStatus === 'loading')

  useEffect(() => {
    if (status?.status !== 'COMPLETED') return
    if (bootstrapStatus !== 'ready') return
    if (!completedWorkspaceId) return
    router.replace(ROUTES.workspace.projects(completedWorkspaceId))
  }, [status?.status, bootstrapStatus, completedWorkspaceId, router])

  if (showFullPageLoading) {
    return (
      <OnboardingFullPageLoader
        message={
          isCompletingOnboarding ? 'Setting up your workspace…' : undefined
        }
      />
    )
  }

  if (status?.status === 'COMPLETED' && bootstrapStatus === 'ready' && completedWorkspaceId) {
    return <OnboardingFullPageLoader message="Opening your workspace…" />
  }

  return (
    <main className="relative grid min-h-screen lg:grid-cols-2">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-neutral-200 lg:block"
      />

      <aside className="flex h-full items-center justify-center px-6 py-12 pb-48 sm:px-10 sm:py-16 sm:pb-56 lg:px-16 lg:py-12 lg:pb-72 xl:px-24">
        <OnboardingIntro />
      </aside>

      <section className="relative flex h-full items-center justify-center px-6 py-12 pb-48 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-neutral-200 before:content-[''] max-lg:before:block sm:px-10 sm:py-16 sm:pb-56 lg:px-16 lg:py-12 lg:pb-72 lg:before:hidden xl:px-24">
        <div className="flex w-full max-w-[400px] flex-col justify-center lg:mx-auto">
          <>
              {showBack && (
                <button
                  type="button"
                  onClick={() => void resetChoice()}
                  className="mb-6 flex w-fit items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
              )}

              <Typography
                as="h2"
                className="font-calsans mb-2 text-2xl font-bold text-neutral-900 xl:text-3xl"
              >
                {meta.title}
              </Typography>
              {meta.description && (
                <Typography tone="muted" className="mb-8 text-sm leading-relaxed">
                  {meta.description}
                </Typography>
              )}

              {error && (
                <Typography tone="error" variant="small" className="mb-4">
                  {error}
                </Typography>
              )}

              {showChooseOptions && (
                <ChooseOptionStep onChoose={(option) => chooseOption(option)} authReady={authReady} />
              )}
              {effectiveStep === 'CREATE_WORKSPACE' && !showChooseOptions && (
                <CreateWorkspaceStep onSubmit={createWorkspace} authReady={authReady} />
              )}
              {effectiveStep === 'ENTER_INVITATION_CODE' && !showChooseOptions && (
                <EnterInvitationStep onSubmit={acceptInvitation} authReady={authReady} />
              )}

              <Typography as="p" variant="small" tone="muted" className="mt-8 text-center">
                <DesignLink
                  as="button"
                  type="button"
                  variant="underline"
                  size="sm"
                  onClick={() => void logout().then(() => window.location.replace(ROUTES.auth.login))}
                >
                  Back to login
                </DesignLink>
              </Typography>
          </>
        </div>
      </section>
    </main>
  )
}
