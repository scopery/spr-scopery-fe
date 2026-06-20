import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { registerErrorInterceptor } from '@/shared/lib/apiInterceptors'

/** Wire global API error toasts — call once from ApiErrorProvider. */
export function setupApiInterceptors(): () => void {
  return registerErrorInterceptor((ctx, error) => {
    if (ctx.init.skipErrorToast) {
      throw error
    }

    if (error instanceof ApiError) {
      if (error.isAuthError) {
        throw error
      }
      toast.error(getProblemToastMessage(error))
    }

    throw error
  })
}
