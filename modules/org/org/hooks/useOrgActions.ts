'use client'

import * as orgApi from '../api/org.api'

export function useOrgActions() {
  return { createOrg: orgApi.createOrg, setDefaultOrg: orgApi.setDefaultOrg }
}
