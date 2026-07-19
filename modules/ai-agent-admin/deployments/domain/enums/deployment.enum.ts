export const DeploymentEnvironment = {
  Dev: 'DEV',
  Uat: 'UAT',
  Prod: 'PROD',
} as const
export type DeploymentEnvironment =
  (typeof DeploymentEnvironment)[keyof typeof DeploymentEnvironment]

export const DeploymentStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Deprecated: 'DEPRECATED',
} as const
export type DeploymentStatus =
  (typeof DeploymentStatus)[keyof typeof DeploymentStatus]

export const DEPLOYMENT_ENVIRONMENT_OPTIONS = [
  { value: DeploymentEnvironment.Dev, label: 'DEV' },
  { value: DeploymentEnvironment.Uat, label: 'UAT' },
  { value: DeploymentEnvironment.Prod, label: 'PROD' },
]
