'use client'

import { Typography } from '@/shared/ui'
import type { TemplateVariableWarning } from '@/modules/documents/document-templates'

interface TemplateVariableWarningsProps {
  unknownVariables: string[]
  warnings?: TemplateVariableWarning[]
}

export function TemplateVariableWarnings({
  unknownVariables,
  warnings = [],
}: TemplateVariableWarningsProps) {
  if (unknownVariables.length === 0 && warnings.length === 0) return null

  const displayWarnings =
    warnings.length > 0
      ? warnings
      : unknownVariables.map((variable) => ({
          code: 'unknown_variable' as const,
          variable,
          message: `Unknown template variable "${variable}".`,
        }))

  return (
    <div
      className="space-y-2 border border-amber-200 bg-amber-50 p-3"
      role="status"
      aria-live="polite"
    >
      <Typography variant="small" weight="medium">
        Variable warnings
      </Typography>
      <ul className="list-disc space-y-1 pl-5">
        {displayWarnings.map((warning, index) => (
          <li key={`${warning.variable ?? warning.message}-${index}`}>
            <Typography variant="small" tone="muted">
              {warning.message}
            </Typography>
          </li>
        ))}
      </ul>
    </div>
  )
}
