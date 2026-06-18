import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  describe('Rendering', () => {
    it('renders checkbox input', () => {
      render(<Checkbox />)
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<Checkbox label="Accept terms" />)
      expect(screen.getByLabelText('Accept terms')).toBeInTheDocument()
    })

    it('associates label with checkbox', () => {
      render(<Checkbox label="Terms" id="terms" />)
      const checkbox = screen.getByLabelText('Terms')
      expect(checkbox).toHaveAttribute('id', 'terms')
    })
  })

  describe('Sizes', () => {
    it('applies sm size', () => {
      render(<Checkbox size="sm" />)
      expect(screen.getByRole('checkbox')).toHaveClass('h-4', 'w-4')
    })

    it('applies md size by default', () => {
      render(<Checkbox />)
      expect(screen.getByRole('checkbox')).toHaveClass('h-5', 'w-5')
    })

    it('applies lg size', () => {
      render(<Checkbox size="lg" />)
      expect(screen.getByRole('checkbox')).toHaveClass('h-6', 'w-6')
    })
  })

  describe('States', () => {
    it('can be checked', async () => {
      const user = userEvent.setup()
      render(<Checkbox label="Check me" />)
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement

      expect(checkbox.checked).toBe(false)
      await user.click(checkbox)
      expect(checkbox.checked).toBe(true)
    })

    it('handles controlled checked state', () => {
      const { rerender } = render(<Checkbox checked={false} onChange={() => {}} />)
      expect(screen.getByRole('checkbox')).not.toBeChecked()

      rerender(<Checkbox checked={true} onChange={() => {}} />)
      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('handles indeterminate state', () => {
      render(<Checkbox indeterminate />)
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(checkbox.indeterminate).toBe(true)
    })
  })

  describe('Disabled', () => {
    it('disables checkbox', () => {
      render(<Checkbox disabled label="Disabled" />)
      expect(screen.getByRole('checkbox')).toBeDisabled()
    })

    it('applies disabled styles to label', () => {
      render(<Checkbox disabled label="Disabled" />)
      const label = screen.getByText('Disabled').parentElement
      expect(label).toHaveClass('opacity-50')
    })
  })

  describe('Error handling', () => {
    it('displays error message', () => {
      render(<Checkbox error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('applies error styles', () => {
      render(<Checkbox error="Error" />)
      expect(screen.getByRole('checkbox')).toHaveClass('border-error')
    })

    it('sets aria-invalid when error exists', () => {
      render(<Checkbox error="Error" />)
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true')
    })

    it('links error with aria-describedby', () => {
      render(<Checkbox error="Error message" id="test" />)
      const checkbox = screen.getByRole('checkbox')
      const describedBy = checkbox.getAttribute('aria-describedby')
      expect(describedBy).toContain('test-error')
    })

    it('error has role alert', () => {
      render(<Checkbox error="Error message" />)
      expect(screen.getByRole('alert')).toHaveTextContent('Error message')
    })
  })

  describe('Helper text', () => {
    it('displays helper text', () => {
      render(<Checkbox helperText="Optional helper text" />)
      expect(screen.getByText('Optional helper text')).toBeInTheDocument()
    })

    it('hides helper text when error exists', () => {
      render(<Checkbox helperText="Helper" error="Error" />)
      expect(screen.queryByText('Helper')).not.toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('links helper text with aria-describedby', () => {
      render(<Checkbox helperText="Helper text" id="test" />)
      const checkbox = screen.getByRole('checkbox')
      const describedBy = checkbox.getAttribute('aria-describedby')
      expect(describedBy).toContain('test-helper')
    })
  })

  describe('User interaction', () => {
    it('calls onChange when clicked', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Checkbox onChange={handleChange} />)

      await user.click(screen.getByRole('checkbox'))
      expect(handleChange).toHaveBeenCalledTimes(1)
    })

    it('can be toggled via label click', async () => {
      const user = userEvent.setup()
      render(<Checkbox label="Click label" />)
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement

      expect(checkbox.checked).toBe(false)
      await user.click(screen.getByText('Click label'))
      expect(checkbox.checked).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Checkbox label="Terms" error="Required" id="terms" />)
      const checkbox = screen.getByRole('checkbox')

      expect(checkbox).toHaveAttribute('aria-invalid', 'true')
      expect(checkbox).toHaveAttribute('aria-describedby')
    })

    it('error has aria-live', () => {
      render(<Checkbox error="Error message" />)
      const error = screen.getByRole('alert')
      expect(error).toHaveAttribute('aria-live', 'polite')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<Checkbox label="Keyboard" />)
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement

      checkbox.focus()
      expect(checkbox).toHaveFocus()

      await user.keyboard(' ')
      expect(checkbox.checked).toBe(true)
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(<Checkbox className="custom-class" />)
      expect(screen.getByRole('checkbox').parentElement?.parentElement).toHaveClass(
        'custom-class'
      )
    })
  })
})

