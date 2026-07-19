export interface UtilizationThresholdPolicy {
  workspaceId: string | null
  projectId: string | null
  underAllocatedPercent: number
  healthyMinPercent: number
  healthyMaxPercent: number
  watchMaxPercent: number
  overloadedPercent: number
  criticalOverloadPercent: number
  updatedAt: string
}

export interface UpdateUtilizationThresholdPolicyPayload {
  underAllocatedPercent: number
  healthyMinPercent: number
  healthyMaxPercent: number
  watchMaxPercent: number
  overloadedPercent: number
  criticalOverloadPercent: number
}
