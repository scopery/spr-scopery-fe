export const ModelType = {
  Chat: 'CHAT',
  Embedding: 'EMBEDDING',
  Image: 'IMAGE',
  Ocr: 'OCR',
  Reranking: 'RERANKING',
  Internal: 'INTERNAL',
} as const
export type ModelType = (typeof ModelType)[keyof typeof ModelType]

export const ModelStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Deprecated: 'DEPRECATED',
} as const
export type ModelStatus = (typeof ModelStatus)[keyof typeof ModelStatus]

export const MODEL_TYPE_OPTIONS = [
  { value: ModelType.Chat, label: 'Chat' },
  { value: ModelType.Embedding, label: 'Embedding' },
  { value: ModelType.Image, label: 'Image' },
  { value: ModelType.Ocr, label: 'OCR' },
  { value: ModelType.Reranking, label: 'Reranking' },
  { value: ModelType.Internal, label: 'Internal' },
]

export const MODEL_STATUS_OPTIONS = [
  { value: ModelStatus.Active, label: 'Active' },
  { value: ModelStatus.Inactive, label: 'Inactive' },
  { value: ModelStatus.Deprecated, label: 'Deprecated' },
]
