import { vi } from 'vitest'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EntityReferencePicker } from './EntityReferencePicker'

const options = [
  { id: '1', type: 'DOCUMENT', code: 'DOC-1', title: 'SRS', status: 'DRAFT' },
  { id: '2', type: 'REQUIREMENT', code: 'REQ-1', title: 'Login flow', status: 'ACTIVE' },
]

describe('EntityReferencePicker', () => {
  it('filters by query and selects option', () => {
    const onChange = vi.fn()
    render(<EntityReferencePicker options={options} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Entity reference search'), {
      target: { value: 'login' },
    })
    fireEvent.click(screen.getByRole('option', { name: /Login flow/i }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: '2', title: 'Login flow' })
    )
  })

  it('clears selection', () => {
    const onChange = vi.fn()
    render(
      <EntityReferencePicker options={options} value={options[0]} onChange={onChange} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
