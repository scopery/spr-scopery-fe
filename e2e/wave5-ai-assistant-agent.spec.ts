import { test, expect } from '@playwright/test'

/**
 * Wave 5 — AI Assistant + AI Agent Admin E2E scaffold.
 *
 * Always-on: public login + unauthenticated admin redirect.
 * Live chrome: set E2E_STORAGE_STATE (+ E2E_WORKSPACE_ID for assistant).
 *
 * Full CRUD/SSE matrix remains manual / deeper specs until BE + auth fixtures exist.
 * See e2e/WAVE5_E2E_MATRIX.md.
 */

const workspaceId = process.env.E2E_WORKSPACE_ID
const hasAuth = Boolean(process.env.E2E_STORAGE_STATE)
const hasWorkspace = Boolean(workspaceId)

test.describe('Wave 5 — public shells', () => {
  test('E2E-W5-shell: login page renders', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('E2E-W5-shell: unauthenticated admin ai-control redirects to login', async ({
    page,
  }) => {
    test.skip(hasAuth, 'Skipped when storage state already authenticates')
    await page.goto('/admin/ai-control/overview')
    await expect(page).toHaveURL(/\/auth\/login/i, { timeout: 30_000 })
  })
})

test.describe('Wave 5 — AI Assistant (live)', () => {
  test.skip(!hasAuth || !hasWorkspace, 'Set E2E_STORAGE_STATE and E2E_WORKSPACE_ID')

  test('E2E-W5-001 shell: assistant workspace loads', async ({ page }) => {
    await page.goto(`/workspace/${workspaceId}/ai`)
    await expect(page.getByRole('heading', { name: /AI Assistant/i }).first()).toBeVisible({
      timeout: 30_000,
    })
  })
})

test.describe('Wave 5 — AI Agent Admin chrome (live)', () => {
  test.skip(!hasAuth, 'Set E2E_STORAGE_STATE')

  const pages: Array<{ path: string; heading: RegExp; id: string }> = [
    { path: '/admin/ai-control/overview', heading: /^AI & Automation$/i, id: 'overview' },
    { path: '/admin/ai-control/providers', heading: /^Providers$/i, id: 'E2E-W5-013' },
    {
      path: '/admin/ai-control/provider-secrets',
      heading: /^Provider secrets$/i,
      id: 'E2E-W5-014',
    },
    { path: '/admin/ai-control/models', heading: /^Models$/i, id: 'E2E-W5-015' },
    { path: '/admin/ai-control/deployments', heading: /^Deployments$/i, id: 'E2E-W5-016' },
    {
      path: '/admin/ai-control/parameter-capabilities',
      heading: /^Parameter capabilities$/i,
      id: 'E2E-W5-017',
    },
    { path: '/admin/ai-control/agents', heading: /^Agents$/i, id: 'E2E-W5-018' },
    { path: '/admin/ai-control/prompts', heading: /^Prompt templates$/i, id: 'E2E-W5-019' },
    { path: '/admin/ai-control/event-configs', heading: /^Event configs$/i, id: 'E2E-W5-021' },
    { path: '/admin/ai-control/usage-policies', heading: /^Usage policies$/i, id: 'E2E-W5-022' },
    { path: '/admin/ai-control/executions', heading: /^Executions$/i, id: 'E2E-W5-023' },
    { path: '/admin/ai-control/playground', heading: /^Playground$/i, id: 'E2E-W5-026' },
    { path: '/admin/ai-control/tools', heading: /^Tools$/i, id: 'E2E-W5-030' },
  ]

  for (const entry of pages) {
    test(`${entry.id}: ${entry.path} chrome`, async ({ page }) => {
      await page.goto(entry.path)
      await expect(page.getByRole('heading', { name: entry.heading }).first()).toBeVisible({
        timeout: 30_000,
      })
    })
  }
})
