export const ProviderSecretType = {
  ApiKey: 'API_KEY',
  OauthClientSecret: 'OAUTH_CLIENT_SECRET',
  BearerToken: 'BEARER_TOKEN',
} as const
export type ProviderSecretType =
  (typeof ProviderSecretType)[keyof typeof ProviderSecretType]

export const ProviderSecretStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const
export type ProviderSecretStatus =
  (typeof ProviderSecretStatus)[keyof typeof ProviderSecretStatus]

export const PROVIDER_SECRET_TYPE_OPTIONS: Array<{
  value: ProviderSecretType
  label: string
}> = [
  { value: ProviderSecretType.ApiKey, label: 'API key' },
  { value: ProviderSecretType.OauthClientSecret, label: 'OAuth client secret' },
  { value: ProviderSecretType.BearerToken, label: 'Bearer token' },
]
