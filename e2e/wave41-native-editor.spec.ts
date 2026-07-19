import { test, expect } from '@playwright/test'

/**
 * Wave 4.1 native editor E2E matrix (subset).
 *
 * Specs that need a real NATIVE document are skipped unless:
 *   E2E_WORKSPACE_ID, E2E_PROJECT_ID, E2E_DOCUMENT_ID (+ auth storage state) are set.
 */

const workspaceId = process.env.E2E_WORKSPACE_ID
const projectId = process.env.E2E_PROJECT_ID
const documentId = process.env.E2E_DOCUMENT_ID
const hasLiveDoc = Boolean(workspaceId && projectId && documentId)

test.describe('Wave 4.1 — public shells', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})

test.describe('Wave 4.1 — native editor (live)', () => {
  test.skip(!hasLiveDoc, 'Set E2E_WORKSPACE_ID / E2E_PROJECT_ID / E2E_DOCUMENT_ID')

  test('opens editor chrome with side panels', async ({ page }) => {
    const path = `/workspace/${workspaceId}/projects/${projectId}/documents/${documentId}/edit`
    await page.goto(path)
    await expect(page.getByLabel('Document body')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('tablist', { name: 'Editor side panels' })).toBeVisible()
    await page.getByRole('tab', { name: 'Synced' }).click()
    await expect(page.getByRole('heading', { name: 'Synced blocks' })).toBeVisible()
    await page.getByRole('tab', { name: 'Mentions' }).click()
    await expect(page.getByRole('heading', { name: 'Mentions' })).toBeVisible()
    await page.getByRole('tab', { name: 'Templates' }).click()
    await expect(page.getByRole('heading', { name: /Native templates/i })).toBeVisible()
    await page.getByRole('tab', { name: 'Smart' }).click()
    await expect(page.getByRole('heading', { name: 'Smart blocks' })).toBeVisible()
  })

  test('manual save button is present', async ({ page }) => {
    const path = `/workspace/${workspaceId}/projects/${projectId}/documents/${documentId}/edit`
    await page.goto(path)
    await expect(page.getByRole('button', { name: /^Save$/i })).toBeVisible({ timeout: 30_000 })
  })
})
