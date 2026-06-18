import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Radio } from './Radio'

describe('Radio', () => {
  describe('Rendering', () => {
    it('renders radio input', () => {
      render(<Radio />)
      expect(screen.getByRole('radio')).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<Radio label="Option 1" />)
      expect(screen.getByLabelText('Option 1')).toBeInTheDocument()
    })

    it('associates label with radio', () => {
      render(<Radio label="Option" id="option" />)
      const radio = screen.getByLabelText('Option')
      expect(radio).toHaveAttribute('id', 'option')
    })
  })

  describe('Sizes', () => {
    it('applies sm size', () => {
      render(<Radio size="sm" />)
      expect(screen.getByRole('radio')).toHaveClass('h-4', 'w-4')
    })

    it('applies md size by default', () => {
      render(<Radio />)
      expect(screen.getByRole('radio')).toHaveClass('h-5', 'w-5')
    })

    it('applies lg size', () => {
      render(<Radio size="lg" />)
      expect(screen.getByRole('radio')).toHaveClass('h-6', 'w-6')
    })
  })

  describe('States', () => {
    it('can be checked', async () => {
      const user = userEvent.setup()
      render(<Radio label="Check me" />)
      const radio = screen.getByRole('radio') as HTMLInputElement

      expect(radio.checked).toBe(false)
      await user.click(radio)
      expect(radio.checked).toBe(true)
    })

    it('handles controlled checked state', () => {
      const { rerender } = render(<Radio checked={false} onChange={() => {}} />)
      expect(screen.getByRole('radio')).not.toBeChecked()

      rerender(<Radio checked={true} onChange={() => {}} />)
      expect(screen.getByRole('radio')).toBeChecked()
    })

    it('works in radio group', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <Radio name="group" value="1" label="Option 1" />
          <Radio name="group" value="2" label="Option 2" />
          <Radio name="group" value="3" label="Option 3" />
        </div>
      )

      const radio1 = screen.getByLabelText('Option 1') as HTMLInputElement
      const radio2 = screen.getByLabelText('Option 2') as HTMLInputElement

      await user.click(radio1)
      expect(radio1.checked).toBe(true)
      expect(radio2.checked).toBe(false)

      await user.click(radio2)
      expect(radio1.checked).toBe(false)
      expect(radio2.checked).toBe(true)
    })
  })

  describe('Disabled', () => {
    it('disables radio', () => {
      render(<Radio disabled label="Disabled" />)
      expect(screen.getByRole('radio')).toBeDisabled()
    })

    it('applies disabled styles to label', () => {
      render(<Radio disabled label="Disabled" />)
      const label = screen.getByText('Disabled').parentElement
      expect(label).toHaveClass('opacity-50')
    })
  })

  describe('Error handling', () => {
    it('displays error message', () => {
      render(<Radio error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('applies error styles', () => {
      render(<Radio error="Error" />)
      expect(screen.getByRole('radio')).toHaveClass('border-error')
    })

    it('sets aria-invalid when error exists', () => {
      render(<Radio error="Error" />)
      expect(screen.getByRole('radio')).toHaveAttribute('aria-invalid', 'true')
    })

    it('error has role alert', () => {
      render(<Radio error="Error message" />)
      expect(screen.getByRole('alert')).toHaveTextContent('Error message')
    })
  })

  describe('Helper text', () => {
    it('displays helper text', () => {
      render(<Radio helperText="Optional helper text" />)
      expect(screen.getByText('Optional helper text')).toBeInTheDocument()
    })

    it('hides helper text when error exists', () => {
      render(<Radio helperText="Helper" error="Error" />)
      expect(screen.queryByText('Helper')).not.toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })

  describe('User interaction', () => {
    it('calls onChange when clicked', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Radio onChange={handleChange} />)

      await user.click(screen.getByRole('radio'))
      expect(handleChange).toHaveBeenCalledTimes(1)
    })

    it('can be selected via label click', async () => {
      const user = userEvent.setup()
      render(<Radio label="Click label" />)
      const radio = screen.getByRole('radio') as HTMLInputElement

      expect(radio.checked).toBe(false)
      await user.click(screen.getByText('Click label'))
      expect(radio.checked).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Radio label="Option" error="Required" id="option" />)
      const radio = screen.getByRole('radio')

      expect(radio).toHaveAttribute('aria-invalid', 'true')
      expect(radio).toHaveAttribute('aria-describedby')
    })

    it('error has aria-live', () => {
      render(<Radio error="Error message" />)
      const error = screen.getByRole('alert')
      expect(error).toHaveAttribute('aria-live', 'polite')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<Radio label="Keyboard" />)
      const radio = screen.getByRole('radio') as HTMLInputElement

      radio.focus()
      expect(radio).toHaveFocus()

      await user.keyboard(' ')
      expect(radio.checked).toBe(true)
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(<Radio className="custom-class" />)
      expect(screen.getByRole('radio').parentElement?.parentElement).toHaveClass('custom-class')
    })
  })
})

