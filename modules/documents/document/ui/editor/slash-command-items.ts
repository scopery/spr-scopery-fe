import type { PlateEditor } from 'platejs/react'
import { KEYS } from 'platejs'
import {
  CheckSquare,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  List,
  ListOrdered,
  MessageSquareQuote,
  Minus,
  Pilcrow,
  Sparkles,
  Table2,
  ToggleLeft,
  type LucideIcon,
} from 'lucide-react'
import { insertBlock } from './block-transforms'

export type SlashCommandGroup =
  | 'Basic'
  | 'Lists'
  | 'Structure'
  | 'Technical'
  | 'Data'
  | 'Link'
  | 'Variables'

export interface SlashCommandItem {
  id: string
  label: string
  description: string
  group: SlashCommandGroup
  value: string
  keywords?: string[]
  icon: LucideIcon
  focusEditor?: boolean
  onSelect: (editor: PlateEditor) => void
}

export interface SlashCommandGroupConfig {
  group: SlashCommandGroup
  items: SlashCommandItem[]
}

function blockCommand(
  id: string,
  label: string,
  description: string,
  group: SlashCommandGroup,
  value: string,
  icon: LucideIcon,
  keywords?: string[]
): SlashCommandItem {
  return {
    id,
    label,
    description,
    group,
    value,
    icon,
    keywords,
    onSelect: (editor) => insertBlock(editor, value, { upsert: true }),
  }
}

/** Memoized slash command registry — shared by slash menu and docs */
export const SLASH_COMMAND_GROUPS: SlashCommandGroupConfig[] = [
  {
    group: 'Basic',
    items: [
      blockCommand('text', 'Text', 'Plain paragraph text', 'Basic', KEYS.p, Pilcrow, [
        'paragraph',
        'text',
        'p',
      ]),
      blockCommand('h1', 'Heading 1', 'Large section heading', 'Basic', KEYS.h1, Heading1, [
        'heading',
        'h1',
        'title',
      ]),
      blockCommand('h2', 'Heading 2', 'Medium section heading', 'Basic', KEYS.h2, Heading2, [
        'heading',
        'h2',
        'subtitle',
      ]),
      blockCommand('h3', 'Heading 3', 'Small section heading', 'Basic', KEYS.h3, Heading3, [
        'heading',
        'h3',
      ]),
    ],
  },
  {
    group: 'Lists',
    items: [
      blockCommand(
        'bullets',
        'Bulleted list',
        'Create a simple bulleted list',
        'Lists',
        KEYS.ul,
        List,
        ['bullet', 'ul', 'unordered']
      ),
      blockCommand(
        'numbered',
        'Numbered list',
        'Create a numbered list',
        'Lists',
        KEYS.ol,
        ListOrdered,
        ['numbered', 'ol', 'ordered']
      ),
      blockCommand(
        'checklist',
        'Checklist',
        'Track tasks with checkboxes',
        'Lists',
        KEYS.listTodo,
        CheckSquare,
        ['todo', 'task', 'checkbox', 'check']
      ),
    ],
  },
  {
    group: 'Structure',
    items: [
      blockCommand(
        'quote',
        'Quote',
        'Capture a quote or citation',
        'Structure',
        KEYS.blockquote,
        MessageSquareQuote,
        ['blockquote', 'quote', 'citation']
      ),
      blockCommand('divider', 'Divider', 'Visually divide blocks', 'Structure', KEYS.hr, Minus, [
        'hr',
        'horizontal',
        'rule',
        'line',
      ]),
      blockCommand(
        'toggle',
        'Toggle',
        'Collapsible content section',
        'Structure',
        KEYS.toggle,
        ToggleLeft,
        ['collapse', 'expand', 'accordion']
      ),
      blockCommand(
        'callout',
        'Callout',
        'Highlight important information',
        'Structure',
        KEYS.callout,
        Sparkles,
        ['note', 'info', 'warning', 'alert']
      ),
    ],
  },
  {
    group: 'Technical',
    items: [
      blockCommand(
        'code',
        'Code block',
        'Insert a code snippet',
        'Technical',
        KEYS.codeBlock,
        Code2,
        ['code', 'snippet', 'pre']
      ),
    ],
  },
  {
    group: 'Data',
    items: [
      blockCommand(
        'table',
        'Simple table',
        'Insert a basic 3×3 table',
        'Data',
        KEYS.table,
        Table2,
        ['grid', 'rows', 'columns']
      ),
    ],
  },
  {
    group: 'Link',
    items: [
      {
        id: 'link',
        label: 'Link',
        description: 'Add a hyperlink to selected text',
        group: 'Link',
        value: KEYS.link,
        icon: Link2,
        keywords: ['url', 'hyperlink', 'anchor'],
        focusEditor: true,
        onSelect: (editor) => insertBlock(editor, KEYS.link),
      },
    ],
  },
]

export const ALL_SLASH_COMMANDS: SlashCommandItem[] = SLASH_COMMAND_GROUPS.flatMap((g) => g.items)

export const TURN_INTO_OPTIONS: {
  label: string
  value: string
}[] = [
  { label: 'Text', value: KEYS.p },
  { label: 'Heading 1', value: KEYS.h1 },
  { label: 'Heading 2', value: KEYS.h2 },
  { label: 'Heading 3', value: KEYS.h3 },
  { label: 'Bulleted list', value: KEYS.ul },
  { label: 'Numbered list', value: KEYS.ol },
  { label: 'Checklist', value: KEYS.listTodo },
  { label: 'Quote', value: KEYS.blockquote },
  { label: 'Callout', value: KEYS.callout },
  { label: 'Code block', value: KEYS.codeBlock },
]
