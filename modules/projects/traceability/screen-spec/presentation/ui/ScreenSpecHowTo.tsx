'use client'

import { useState } from 'react'
import { Typography } from '@/shared/ui'

export function ScreenSpecHowTo({
  title,
  steps,
  note,
  defaultOpen = false,
}: {
  title: string
  steps: string[]
  note?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <details
      open={open}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2"
    >
      <summary className="cursor-pointer text-sm font-medium text-neutral-800">{title}</summary>
      <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-neutral-600">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {note ? (
        <Typography variant="caption" tone="muted" className="mt-2 block">
          {note}
        </Typography>
      ) : null}
    </details>
  )
}

export const SCREEN_STRUCTURE_TAB_HINTS: Record<
  | 'sections'
  | 'fields'
  | 'components'
  | 'modes'
  | 'matrix'
  | 'validations'
  | 'processes'
  | 'events'
  | 'actions',
  string
> = {
  sections:
    'Group fields into blocks. Pick a component when adding a section to copy its fields, or bind later. Upload a mockup above the tabs (PNG/JPEG, max 5MB).',
  fields:
    'Add controls or review copied ones. Copied = came from bind. Configure opens Links and Validations.',
  components:
    'Components linked to this screen. Unlink deletes copied fields (and their validations / mode config). Fields you added by hand stay.',
  modes: 'Add CREATE / VIEW / EDIT (and SEARCH or DIALOG if needed) before the mode matrix. Missing modes show empty 〇 columns.',
  matrix:
    'Read-only table here. Edit matrix opens the full table; one Save writes every changed field. Visible fields get 〇 on Defines.',
  validations:
    'Pick a field, then a rule. Edit / Delete sit on that rule. View full and Add open a compact modal.',
  processes:
    'Pick a process to preview it. Edit / Delete sit on that process. View full opens a compact modal.',
  events:
    'Pick an event to preview it. Edit / Delete sit on that event. View full opens a compact modal.',
  actions: 'Pick a button to preview it. Edit / Delete sit on that action. View full opens a compact modal.',
}

export const SCREEN_IMPORT_WORKFLOW_STEPS = [
  'Excel (this tab, first block): code, name, optional routePath only. Creates empty screens. Use when you will spec fields later in Browse.',
  'JSON full spec (this tab, below): one job of up to 200 screens with modes, fields, validations, processes, and events.',
  'Before JSON: create components on Browse if you will set componentCode. Put a project UUID in Default project ID, or on every JSON item.',
  'Paste { "items": [ ... ] }. Copy the format guide if an agent is filling the JSON. After submit, wait for per-screen success/failure (retry failed only if needed).',
]

export const SCREEN_SPEC_WORKFLOW_STEPS = [
  'On Browse, spec catalog first: entity Columns, component fields, option source, and component APIs. Bind a component onto a screen section to copy those fields.',
  'Select a screen. Add Modes and Sections, bind components or add Fields. Configure a field to link component/column and add validations.',
  'Fill Mode matrix, then Processes and Events.',
  'To load many screens at once, use Import → Screens (Excel = shell, JSON = full spec). Then export from the inspector or Spec docs.',
]

export const SPEC_DOC_WORKFLOW_STEPS = [
  'Create a document: pick a project, then a unique code (SPEC-001) and a name (Register / View / Edit). Project is required by the API.',
  'Save metadata: project, system, phase, language, mockup URL, overview — these fill the Excel header.',
  'Add screens from this app. One screen = a single-screen file. Several screens = one grouped workbook.',
  'Add Change history rows (rev, sheet, details, person, date) — they become the Change History sheet.',
  'Export Excel. Layout lists every screen; Defines / Processes / Event / Validation are blocked per screen.',
]

export const SPEC_DOC_WORKFLOW_NOTE =
  'Workbook sheets: Change History, Layout, Defines, Processes, Event, Validation, Database. Required and max length stay on Defines; extra rules (EMAIL, …) go to Validation.'
