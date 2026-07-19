import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClassificationBadge } from './ClassificationBadge'
import { ClassificationLevel } from './ClassificationBadge.types'

describe('ClassificationBadge', () => {
  it('renders label and icon with accessible name', () => {
    render(<ClassificationBadge level={ClassificationLevel.Confidential} />)
    expect(screen.getByLabelText('Classification: Confidential')).toBeInTheDocument()
    expect(screen.getByText('Confidential')).toBeInTheDocument()
  })

  it('falls back for unknown level', () => {
    render(<ClassificationBadge level="CUSTOM" />)
    expect(screen.getByLabelText('Classification: CUSTOM')).toBeInTheDocument()
  })
})
