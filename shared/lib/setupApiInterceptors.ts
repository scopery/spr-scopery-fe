import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { registerErrorInterceptor } from '@/shared/lib/apiInterceptors'
import { registerAiAssistantHeaderInterceptor } from '@/shared/lib/aiAssistantHeaders'
import { registerKnowledgeHeaderInterceptor } from '@/shared/lib/knowledgeHeaders'

/** Dead or remapped-but-still-missing legacy routes — suppress toast spam. */
function isSuppressedLegacyApi(url: string): boolean {
  // Unversioned `/api/...` and leftover `/api/v1|v2/...`
  if (/\/api(?:\/v[12])?\/orgs(\/|$|\?)/.test(url)) return true
  if (
    /\/api(?:\/v[12])?\/projects\/[^/]+\/(sessions|questions|sections|members)(\/|$|\?)/.test(url)
  ) {
    return true
  }
  if (
    /\/api(?:\/v[12])?\/workspaces\/[^/]+\/(documents|document-hub|document-links|document-templates\/management)(\/|$|\?)/.test(
      url
    )
  ) {
    return true
  }
  if (
    /\/api(?:\/v[12])?\/workspaces\/[^/]+\/documents\/[^/]+\/collaboration(\/|$|\?)/.test(url)
  ) {
    return true
  }
  if (/\/api(?:\/v[12])?\/workspaces\/[^/]+\/governance\/(?!policies)/.test(url)) {
    return true
  }
  if (/\/api(?:\/v[12])?\/iam\/auth\/sessions(\/|$|\?)/.test(url) && !/revoke-all/.test(url)) {
    return true
  }
  return false
}

/**
 * Validation / client errors — hooks & forms own the UX (field errors, inline banners).
 * Global toast for these becomes noisy 400 spam on every failed submit/probe.
 */
function shouldSkipGlobalToast(error: ApiError): boolean {
  if (error.isAuthError) return true
  if (error.status === 400 || error.status === 422) return true
  return false
}

/** Wire global API error toasts + domain headers — call once from ApiErrorProvider. */
export function setupApiInterceptors(): () => void {
  const unregKnowledge = registerKnowledgeHeaderInterceptor()
  const unregAiAssistant = registerAiAssistantHeaderInterceptor()
  const unregError = registerErrorInterceptor((ctx, error) => {
    if (ctx.init.skipErrorToast) {
      throw error
    }

    if (error instanceof ApiError) {
      if (shouldSkipGlobalToast(error)) {
        throw error
      }
      if (isSuppressedLegacyApi(ctx.url)) {
        throw error
      }
      toast.error(getProblemToastMessage(error))
    }

    throw error
  })

  return () => {
    unregKnowledge()
    unregAiAssistant()
    unregError()
  }
}
