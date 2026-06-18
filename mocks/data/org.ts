import { MOCK_ORG_ID, MOCK_USER_ID } from '@/shared/lib/dataMode'

export const MOCK_ORG_DETAIL = {
  id: MOCK_ORG_ID,
  name: 'Acme Corp',
  status: 'active',
  my_role: 'owner' as const,
  my_status: 'active',
  created_at: '2025-01-05T08:00:00Z',
}

export const MOCK_ORG_LIST = {
  items: [MOCK_ORG_DETAIL],
  page: { limit: 20, offset: 0, total: 1 },
}

export const MOCK_ORG_MEMBERS = {
  items: [
    {
      user_id: MOCK_USER_ID,
      display_name: 'Alice Nguyen',
      email: 'alice@acme.com',
      role: 'owner' as const,
      status: 'active',
    },
    {
      user_id: 'mock-user-002',
      display_name: 'Bob Tran',
      email: 'bob@acme.com',
      role: 'member' as const,
      status: 'active',
    },
    {
      user_id: 'mock-user-003',
      display_name: 'Carol Pham',
      email: 'carol@acme.com',
      role: 'member' as const,
      status: 'active',
    },
  ],
  page: { limit: 20, offset: 0, total: 3 },
}

export const MOCK_ORG_INVITES = {
  items: [
    {
      id: 'mock-invite-001',
      org_id: MOCK_ORG_ID,
      email: 'dave@external.com',
      role: 'member',
      status: 'pending',
      invited_by: MOCK_USER_ID,
      created_at: '2025-06-10T09:00:00Z',
      expires_at: '2025-07-10T09:00:00Z',
    },
  ],
  page: { limit: 20, offset: 0, total: 1 },
}

export const MOCK_MENTIONABLE_USERS = {
  items: [
    { user_id: MOCK_USER_ID, display_name: 'Alice Nguyen', email: 'alice@acme.com' },
    { user_id: 'mock-user-002', display_name: 'Bob Tran', email: 'bob@acme.com' },
    { user_id: 'mock-user-003', display_name: 'Carol Pham', email: 'carol@acme.com' },
  ],
}
