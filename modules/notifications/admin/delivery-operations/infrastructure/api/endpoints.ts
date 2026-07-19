import { apiPath } from '@/shared/lib/api-paths'

export const ADMIN_DELIVERY_ENDPOINTS = {
  deliveries: {
    list: () => apiPath('/notification/email-deliveries'),
    get: (deliveryId: string) => apiPath(`/notification/email-deliveries/${deliveryId}`),
  },
  outbox: {
    list: () => apiPath('/notification/email-outbox'),
    get: (recordId: string) => apiPath(`/notification/email-outbox/${recordId}`),
    retry: (recordId: string) => apiPath(`/notification/email-outbox/${recordId}/retry`),
    cancel: (recordId: string) => apiPath(`/notification/email-outbox/${recordId}/cancel`),
  },
  suppressions: {
    list: () => apiPath('/notification/admin/suppressions'),
  },
} as const
