#!/usr/bin/env node
/** Extract sub-files from god views to reduce file size. */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function sliceFile(srcPath, start, end) {
  const lines = fs.readFileSync(path.join(root, srcPath), 'utf8').split('\n')
  return lines.slice(start - 1, end).join('\n')
}

function write(rel, content) {
  const abs = path.join(root, rel)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content + '\n')
  console.log('wrote', rel, content.split('\n').length, 'lines')
}

// --- SessionDetailView splits ---
const sessionLib = `'use client'

export type AnswerStatus = 'answered' | 'skipped' | 'na'

/** Display order of sections (same as admin template — not alphabetical). */
export const SECTION_ORDER = ['overview', 'scope', 'risks', 'timeline', 'assumptions', 'general']

${sliceFile('modules/sessions/session/ui/SessionDetailView.tsx', 51, 94)}
`

write('modules/sessions/session/lib/session-answer-utils.ts', sessionLib)

const questionItemHeader = `'use client'

import { useRef } from 'react'
import { Typography, Button, Badge, Input, Textarea, Switch, Select, Divider } from '@/shared/ui'
import { FEATURES } from '@/config/features'
import { cn } from '@/utils/cn'
import { ClarityBadge } from '@/modules/sessions/clarity/ui/ClarityBadge'
import type { ClarityAssessment } from '@/modules/sessions/clarity'
import type { ProjectQuestion } from '@/modules/projects'
import type { AnswerItem } from '../model/session'
import { AnswerEvidenceStrip } from '@/modules/documents'
import { Lock, Sparkles, ClipboardCheck } from 'lucide-react'
import {
  getDefaultValueForType,
  type AnswerStatus,
} from '../lib/session-answer-utils'

export type SessionQuestionItemProps = {
  q: ProjectQuestion
  answer: AnswerItem | undefined
  onChange: (status: AnswerStatus, value: unknown, skipReason?: string) => void
  readonly: boolean
  onAiImprove?: (q: ProjectQuestion) => void
  showAiButton?: boolean
  questionOrder?: number
  clarityAssessment?: ClarityAssessment | null
  onAssessClarity?: () => void
  assessClarityLoading?: boolean
  onOpenClarityModal?: () => void
  showAssessClarityButton?: boolean
  clarityFeatureDisabled?: boolean
  orgId?: string
  projectId?: string
  sessionId?: string
  linkPermissions?: {
    canView: boolean
    canCreate: boolean
    canRemove: boolean
    canRestoreDocument?: boolean
    canExport?: boolean
  }
}

export function SessionQuestionItem({
`

const questionBody = sliceFile('modules/sessions/session/ui/SessionDetailView.tsx', 97, 360)
  .replace(/^function QuestionItem\(\{\n/, '')
  .replace(/^}: \{\n[\s\S]*?\}\) \{\n/, '') // remove old inline props - already in header

// questionBody starts with "  q," - need to fix. Line 97 is "function QuestionItem({" line 98 is "  q,"
const qItemRaw = sliceFile('modules/sessions/session/ui/SessionDetailView.tsx', 96, 361)
const qItemBody = qItemRaw
  .replace(/^function QuestionItem\(/, 'export function SessionQuestionItem(')
  .replace(/\n\}: \{\n[\s\S]*?\n\}\) \{/, '}: SessionQuestionItemProps) {')

write(
  'modules/sessions/session/ui/SessionQuestionItem.tsx',
  `'use client'

import { useRef } from 'react'
import { Typography, Button, Badge, Input, Textarea, Switch, Select, Divider } from '@/shared/ui'
import { FEATURES } from '@/config/features'
import { cn } from '@/utils/cn'
import { ClarityBadge } from '@/modules/sessions/clarity/ui/ClarityBadge'
import type { ClarityAssessment } from '@/modules/sessions/clarity'
import type { ProjectQuestion } from '@/modules/projects'
import type { AnswerItem } from '../model/session'
import { AnswerEvidenceStrip } from '@/modules/documents'
import { Sparkles, ClipboardCheck } from 'lucide-react'
import { getDefaultValueForType, type AnswerStatus, type SessionQuestionItemProps } from '../lib/session-answer-utils'

export type { SessionQuestionItemProps }

${qItemBody.replace(/^function QuestionItem/, 'export function SessionQuestionItem').replace(/\n\}: \{[\s\S]*?\n\}\) \{/, '\n}: SessionQuestionItemProps) {')}`
)

// Fix session-answer-utils - move SessionQuestionItemProps there? Keep props in SessionQuestionItem file only.

// Rebuild SessionDetailView - read original and remove extracted parts, add imports
let sessionView = fs.readFileSync(
  path.join(root, 'modules/sessions/session/ui/SessionDetailView.tsx'),
  'utf8'
)
const lines = sessionView.split('\n')
const kept = [...lines.slice(0, 47), ...lines.slice(361)]
sessionView = kept.join('\n')
sessionView = sessionView
  .replace(
    "import { Lock, Sparkles, ClipboardCheck, Download } from 'lucide-react'",
    "import { Lock, Sparkles, ClipboardCheck, Download } from 'lucide-react'"
  )
  .replace("type AnswerStatus = 'answered' | 'skipped' | 'na'\n\n", '')

const sessionImports = `import {
  SECTION_ORDER,
  sectionSortIndex,
  answerValuesEqual,
  type AnswerStatus,
} from '../lib/session-answer-utils'
import { SessionQuestionItem } from './SessionQuestionItem'
`

sessionView = sessionView.replace(
  "import { EntityEvidenceDocumentsPanel, AnswerEvidenceStrip } from '@/modules/documents'\n",
  "import { EntityEvidenceDocumentsPanel } from '@/modules/documents'\n" + sessionImports
)

sessionView = sessionView.replace(/<QuestionItem/g, '<SessionQuestionItem')
sessionView = sessionView.replace(/QuestionItem/g, (m, offset, s) => {
  // avoid replacing SessionQuestionItem twice
  const before = s.slice(Math.max(0, offset - 8), offset)
  if (before.endsWith('Session')) return m
  return 'SessionQuestionItem'
})

write('modules/sessions/session/ui/SessionDetailView.tsx', sessionView)

console.log('SessionDetailView split done')
