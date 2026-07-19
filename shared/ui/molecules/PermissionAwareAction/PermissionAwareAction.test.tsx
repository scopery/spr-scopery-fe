import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PermissionAwareAction } from './PermissionAwareAction'
import { PermissionActionState } from './PermissionAwareAction.types'

describe('PermissionAwareAction', () => {
  it('renders children when allowed', () => {
    render(
      <PermissionAwareAction state={PermissionActionState.Allowed}>
        <button type="button">Edit</button>
      </PermissionAwareAction>
    )
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('hides when Hidden', () => {
    const { container } = render(
      <PermissionAwareAction state={PermissionActionState.Hidden}>
        <button type="button">Edit</button>
      </PermissionAwareAction>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows reason when disabled', () => {
    render(
      <PermissionAwareAction state={PermissionActionState.Disabled} reason="No permission">
        <button type="button">Edit</button>
      </PermissionAwareAction>
    )
    expect(screen.getByText('No permission')).toBeInTheDocument()
  })
})
