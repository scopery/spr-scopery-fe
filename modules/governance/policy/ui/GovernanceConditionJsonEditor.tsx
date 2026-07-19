'use client'

import { CheckCircle, ChevronDown, Code } from 'lucide-react'

import { Button, Typography } from '@/shared/ui'
import { useGovernanceConditionJsonEditor } from '../hooks/useGovernanceConditionJsonEditor'
import type { GovernanceConditionJsonEditorProps } from '../model/governance'

export function GovernanceConditionJsonEditor({
  orgId,
  value,
  onChange,
  onValidGroup,
  disabled = false,
}: GovernanceConditionJsonEditorProps) {
  const editor = useGovernanceConditionJsonEditor({ orgId, value, onChange, onValidGroup })

  return (
    <div className="space-y-2">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Conditions (JSON)</span>
        <textarea
          className="border-border min-h-32 w-full rounded border p-2 font-mono text-xs"
          value={value}
          onChange={(e) => editor.handleChange(e.target.value)}
          disabled={disabled}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={disabled} onClick={editor.runFormat} icon={<Code size={16} />}>
          Format JSON
        </Button>
        <Button
          variant="outline"
          disabled={disabled}
          loading={editor.validating}
          onClick={() => void editor.runValidate()} icon={<CheckCircle size={16} />}>
          Validate
        </Button>
        <Button variant="ghost" disabled={disabled} onClick={editor.loadSample} icon={<ChevronDown size={16} />}>
          Load sample
        </Button>
      </div>
      <Typography variant="small" tone="muted">
        Allowed fields: actor_role, workflow_status, readiness_status, partner_access,
        export_format, package_format, selected_document_count, and others from governance metadata.
      </Typography>
      {editor.validationOk ? (
        <Typography variant="small" className="text-green-700">
          {editor.validationOk}
        </Typography>
      ) : null}
      {editor.validationErrors.length > 0 ? (
        <ul className="list-disc space-y-1 pl-4">
          {editor.validationErrors.map((error) => (
            <li key={error}>
              <Typography as="span" variant="small" tone="error">
                {error}
              </Typography>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
