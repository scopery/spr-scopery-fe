import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from './Switch'

describe('Switch', () => {
  describe('Rendering', () => {
    it('renders switch', () => {
      render(<Switch />)
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<Switch label="Enable feature" />)
      expect(screen.getByText('Enable feature')).toBeInTheDocument()
    })

    it('associates label with switch', () => {
      render(<Switch label="Feature" id="feature" />)
      const switchElement = screen.getByRole('switch')
      expect(switchElement).toHaveAttribute('aria-labelledby', 'feature-label')
    })
  })

  describe('Sizes', () => {
    it('applies sm size', () => {
      render(<Switch size="sm" />)
      expect(screen.getByRole('switch')).toHaveClass('h-5', 'w-9')
    })

    it('applies md size by default', () => {
      render(<Switch />)
      expect(screen.getByRole('switch')).toHaveClass('h-6', 'w-11')
    })

    it('applies lg size', () => {
      render(<Switch size="lg" />)
      expect(screen.getByRole('switch')).toHaveClass('h-7', 'w-14')
    })
  })

  describe('States', () => {
    it('starts unchecked by default', () => {
      render(<Switch />)
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })

    it('can be checked by default', () => {
      render(<Switch defaultChecked />)
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })

    it('toggles when clicked', async () => {
      const user = userEvent.setup()
      render(<Switch label="Toggle" />)
      const switchElement = screen.getByRole('switch')

      expect(switchElement).toHaveAttribute('aria-checked', 'false')
      await user.click(switchElement)
      expect(switchElement).toHaveAttribute('aria-checked', 'true')
      await user.click(switchElement)
      expect(switchElement).toHaveAttribute('aria-checked', 'false')
    })

    it('handles controlled checked state', () => {
      const { rerender } = render(<Switch checked={false} onChange={() => {}} />)
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')

      rerender(<Switch checked={true} onChange={() => {}} />)
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Disabled', () => {
    it('disables switch', () => {
      render(<Switch disabled />)
      expect(screen.getByRole('switch')).toBeDisabled()
    })

    it('applies disabled styles', () => {
      render(<Switch disabled />)
      expect(screen.getByRole('switch')).toHaveClass('opacity-50')
    })

    it('applies disabled styles to label', () => {
      render(<Switch disabled label="Disabled" />)
      const label = screen.getByText('Disabled').parentElement
      expect(label).toHaveClass('opacity-50')
    })

    it('cannot be toggled when disabled', async () => {
      const user = userEvent.setup()
      render(<Switch disabled />)
      const switchElement = screen.getByRole('switch')

      expect(switchElement).toHaveAttribute('aria-checked', 'false')
      await user.click(switchElement)
      expect(switchElement).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('Error handling', () => {
    it('displays error message', () => {
      render(<Switch error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('applies error styles', () => {
      render(<Switch error="Error" />)
      expect(screen.getByRole('switch')).toHaveClass('bg-error/20')
    })

    it('links error with aria-describedby', () => {
      render(<Switch error="Error message" id="test" />)
      const switchElement = screen.getByRole('switch')
      const describedBy = switchElement.getAttribute('aria-describedby')
      expect(describedBy).toContain('test-error')
    })

    it('error has role alert', () => {
      render(<Switch error="Error message" />)
      expect(screen.getByRole('alert')).toHaveTextContent('Error message')
    })
  })

  describe('Helper text', () => {
    it('displays helper text', () => {
      render(<Switch helperText="Optional helper text" />)
      expect(screen.getByText('Optional helper text')).toBeInTheDocument()
    })

    it('hides helper text when error exists', () => {
      render(<Switch helperText="Helper" error="Error" />)
      expect(screen.queryByText('Helper')).not.toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })

  describe('User interaction', () => {
    it('calls onChange when toggled', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Switch onChange={handleChange} />)

      await user.click(screen.getByRole('switch'))
      expect(handleChange).toHaveBeenCalledTimes(1)
    })

    it('can be toggled via label click', async () => {
      const user = userEvent.setup()
      render(<Switch label="Click label" />)
      const switchElement = screen.getByRole('switch')

      expect(switchElement).toHaveAttribute('aria-checked', 'false')
      await user.click(screen.getByText('Click label'))
      expect(switchElement).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Switch label="Feature" error="Required" id="feature" />)
      const switchElement = screen.getByRole('switch')

      expect(switchElement).toHaveAttribute('aria-checked')
      expect(switchElement).toHaveAttribute('aria-describedby')
      expect(switchElement).toHaveAttribute('aria-labelledby')
    })

    it('error has aria-live', () => {
      render(<Switch error="Error message" />)
      const error = screen.getByRole('alert')
      expect(error).toHaveAttribute('aria-live', 'polite')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<Switch label="Keyboard" />)
      const switchElement = screen.getByRole('switch')

      switchElement.focus()
      expect(switchElement).toHaveFocus()

      await user.keyboard(' ')
      expect(switchElement).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(<Switch className="custom-class" />)
      expect(screen.getByRole('switch').parentElement?.parentElement).toHaveClass('custom-class')
    })
  })
})

