import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MaskedValue } from './MaskedValue'

describe('MaskedValue', () => {
  it('shows mask placeholder when masked', () => {
    render(<MaskedValue masked value="secret" />)
    expect(screen.getByLabelText('Masked value')).toHaveTextContent('••••••')
  })

  it('reveals value when unmasked', () => {
    render(<MaskedValue masked={false} value="secret" />)
    expect(screen.getByText('secret')).toBeInTheDocument()
  })

  it('calls onReveal when activated', () => {
    const onReveal = vi.fn()
    render(<MaskedValue masked onReveal={onReveal} />)
    fireEvent.click(screen.getByLabelText('Masked value'))
    expect(onReveal).toHaveBeenCalledTimes(1)
  })
})
