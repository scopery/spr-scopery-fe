'use client'

import type { PlateEditor } from 'platejs/react'
import { Braces, type LucideIcon } from 'lucide-react'
import type { SlashCommandItem } from '@/modules/documents/document/ui/editor/slash-command-items'
import { formatVariableToken } from './extract-template-variables'
import type { TemplateVariableDefinition } from '../document-template-types'

function insertVariableToken(editor: PlateEditor, token: string) {
  editor.tf.insertText(token)
}

export function buildVariableSlashCommands(
  variables: TemplateVariableDefinition[]
): SlashCommandItem[] {
  return variables.map((variable) => ({
    id: `var-${variable.key}`,
    label: variable.label,
    description: variable.description,
    group: 'Variables' as const,
    value: variable.key,
    icon: Braces as LucideIcon,
    keywords: [variable.key, variable.category, 'variable', 'placeholder', 'template'],
    onSelect: (editor) => insertVariableToken(editor, formatVariableToken(variable.key)),
  }))
}

export function buildVariableSlashGroups(variables: TemplateVariableDefinition[]) {
  const items = buildVariableSlashCommands(variables)
  if (items.length === 0) return []
  return [{ group: 'Variables' as const, items }]
}
