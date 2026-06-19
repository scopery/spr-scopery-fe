import { MOCK_ORG_ID, MOCK_USER_ID } from '@/shared/lib/dataMode'

export const MOCK_PROFILE = {
  user_id: MOCK_USER_ID,
  email: 'alice@acme.com',
  display_name: 'Alice Nguyen',
  avatar_url: null,
  role: 'admin' as const,
  status: 'active' as const,
  default_org_id: MOCK_ORG_ID,
  created_at: '2025-01-10T08:00:00Z',
  updated_at: '2025-06-01T10:00:00Z',
}

export const MOCK_AUTH_ME = {
  id: MOCK_USER_ID,
  email: 'alice@acme.com',
  display_name: 'Alice Nguyen',
  role: 'admin' as const,
  status: 'active' as const,
}

export const MOCK_SESSION_COOKIE_VALUE = JSON.stringify({
  user: { id: MOCK_USER_ID, email: 'alice@acme.com' },
})
