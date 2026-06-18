'use client'

import { createContext, useContext } from 'react'
import type { SlashCommandGroupConfig } from './slash-command-items'

export const EditorSlashExtrasContext = createContext<SlashCommandGroupConfig[]>([])

export function useEditorSlashExtras(): SlashCommandGroupConfig[] {
  return useContext(EditorSlashExtrasContext)
}
