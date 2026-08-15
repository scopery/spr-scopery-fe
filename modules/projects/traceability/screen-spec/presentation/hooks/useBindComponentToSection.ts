'use client'

import { useCallback } from 'react'
import { ApiError, getErrorCode } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/screen-spec.api'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import type {
  BindComponentToSectionBody,
  BindComponentToSectionResult,
} from '../../domain/model/screen-spec'

export function useBindComponentToSection(workspaceId: string | null, screenId: string | null) {
  const bind = useCallback(
    async (
      sectionId: string,
      body: BindComponentToSectionBody
    ): Promise<BindComponentToSectionResult | undefined> => {
      if (!workspaceId || !screenId) return undefined
      try {
        return await api.bindComponentToSection(workspaceId, screenId, sectionId, body)
      } catch (err) {
        if (getErrorCode(err) === 'SCREEN_COMPONENT_DUPLICATE') {
          throw new ApiError(409, {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: ScreenSpecMessages.COMPONENT_ALREADY_BOUND,
            code: 'SCREEN_COMPONENT_DUPLICATE',
          })
        }
        throw err
      }
    },
    [workspaceId, screenId]
  )

  return { bind }
}
