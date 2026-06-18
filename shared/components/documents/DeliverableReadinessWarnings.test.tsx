import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeliverableReadinessWarnings } from './DeliverableReadinessWarnings'
import type { DeliverableReadinessResult } from '@/types/document-deliverable'

const readiness: DeliverableReadinessResult = {
  readiness_status: 'needs_review',
  warnings: [{ code: 'no_requirements', message: 'No requirements found for this project.' }],
  blocking_issues: [],
  suggested_actions: [{ action: 'add_requirements', label: 'Add requirements to the project' }],
  warning_count: 1,
  blocking_issue_count: 0,
}

describe('DeliverableReadinessWarnings', () => {
  it('renders readiness warnings', () => {
    render(<DeliverableReadinessWarnings readiness={readiness} />)
    expect(screen.getByText(/Review readiness/i)).toBeInTheDocument()
    expect(screen.getByText(/No requirements found/i)).toBeInTheDocument()
    expect(screen.getByText(/Suggested: Add requirements/i)).toBeInTheDocument()
  })

  it('renders blocking issues', () => {
    const blocked: DeliverableReadinessResult = {
      ...readiness,
      readiness_status: 'blocked',
      blocking_issues: [{ code: 'document_set_required', message: 'Select at least one document.' }],
      blocking_issue_count: 1,
    }
    render(<DeliverableReadinessWarnings readiness={blocked} />)
    expect(screen.getByText(/Select at least one document/i)).toBeInTheDocument()
  })
})
