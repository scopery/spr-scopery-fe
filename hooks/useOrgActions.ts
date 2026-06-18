'use client'

import { createOrg, setDefaultOrg } from '@/services/org.service'

export function useOrgActions() {
  return { createOrg, setDefaultOrg }
}
