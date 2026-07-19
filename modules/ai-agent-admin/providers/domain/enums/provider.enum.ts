export const ProviderType = {
  Llm: 'LLM',
  Embedding: 'EMBEDDING',
  Ocr: 'OCR',
  Image: 'IMAGE',
  Reranking: 'RERANKING',
} as const
export type ProviderType = (typeof ProviderType)[keyof typeof ProviderType]

export const ProviderStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Deprecated: 'DEPRECATED',
} as const
export type ProviderStatus = (typeof ProviderStatus)[keyof typeof ProviderStatus]

export const PROVIDER_TYPE_OPTIONS: Array<{ value: ProviderType; label: string }> = [
  { value: ProviderType.Llm, label: 'LLM' },
  { value: ProviderType.Embedding, label: 'Embedding' },
  { value: ProviderType.Ocr, label: 'OCR' },
  { value: ProviderType.Image, label: 'Image' },
  { value: ProviderType.Reranking, label: 'Reranking' },
]

export const PROVIDER_STATUS_OPTIONS: Array<{ value: ProviderStatus; label: string }> = [
  { value: ProviderStatus.Active, label: 'Active' },
  { value: ProviderStatus.Inactive, label: 'Inactive' },
  { value: ProviderStatus.Deprecated, label: 'Deprecated' },
]
