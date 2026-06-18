import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Select } from './Select'

describe('Select', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
  ]

  it('renders with placeholder', () => {
    render(<Select options={options} placeholder="Select an option" />)
    expect(screen.getByText('Select an option')).toBeInTheDocument()
  })

  it('renders with selected value', () => {
    render(<Select options={options} value="option1" />)
    expect(screen.getByText('Option 1')).toBeInTheDocument()
  })

  it('renders select trigger', () => {
    render(<Select options={options} placeholder="Select..." />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeInTheDocument()
  })

  it('disables select when disabled prop is true', () => {
    render(<Select options={options} disabled />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('disabled')
  })

  it('renders with custom className', () => {
    const { container } = render(
      <Select options={options} className="custom-class" />
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Select options={options} size="sm" />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()

    rerender(<Select options={options} size="lg" />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})

