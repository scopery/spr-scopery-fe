import { v2 } from '@/shared/lib/api-paths'

export const CONTROLLED_VALUE_ENDPOINTS = {
  createInList: (listId: string) => v2(`/controlled-lists/${listId}/values`),
  update: (valueId: string) => v2(`/controlled-values/${valueId}`),
  remove: (valueId: string) => v2(`/controlled-values/${valueId}`),
} as const
