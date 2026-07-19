import { defineConfig, devices } from '@playwright/test'

/**
 * App smoke + Wave 4.1 / Wave 5 E2E.
 *
 * Local:
 *   npx playwright install chromium
 *   npm run dev   # separate terminal
 *   npm run test:e2e
 *
 * Live auth (optional):
 *   E2E_BASE_URL=http://localhost:3000
 *   E2E_WORKSPACE_ID=...
 *   E2E_PROJECT_ID=...
 *   E2E_DOCUMENT_ID=...   # NATIVE doc (Wave 4.1)
 *   E2E_STORAGE_STATE=e2e/.auth/user.json  # from `npx playwright codegen` or login helper
 *
 * Wave 5:
 *   npm run test:e2e -- e2e/wave5-ai-assistant-agent.spec.ts
 *   See e2e/WAVE5_E2E_MATRIX.md
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    storageState: process.env.E2E_STORAGE_STATE || undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
