import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  describe('Rendering', () => {
    it('renders textarea element', () => {
      render(<Textarea placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<Textarea label="Description" />)
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
    })

    it('associates label with textarea', () => {
      render(<Textarea label="Comment" id="comment" />)
      const textarea = screen.getByLabelText('Comment')
      expect(textarea).toHaveAttribute('id', 'comment')
    })
  })

  describe('Sizes', () => {
    it('applies sm size', () => {
      render(<Textarea size="sm" placeholder="Small" />)
      const textarea = screen.getByPlaceholderText('Small')
      expect(textarea).toHaveClass('px-sm', 'py-xs', 'text-sm', 'min-h-20')
    })

    it('applies md size by default', () => {
      render(<Textarea placeholder="Medium" />)
      const textarea = screen.getByPlaceholderText('Medium')
      expect(textarea).toHaveClass('px-md', 'py-sm', 'text-base', 'min-h-24')
    })

    it('applies lg size', () => {
      render(<Textarea size="lg" placeholder="Large" />)
      const textarea = screen.getByPlaceholderText('Large')
      expect(textarea).toHaveClass('px-lg', 'py-md', 'text-lg', 'min-h-32')
    })
  })

  describe('Variants', () => {
    it('applies outline variant by default', () => {
      render(<Textarea placeholder="Outline" />)
      const textarea = screen.getByPlaceholderText('Outline')
      expect(textarea).toHaveClass('border-2', 'bg-white')
    })

    it('applies filled variant', () => {
      render(<Textarea variant="filled" placeholder="Filled" />)
      const textarea = screen.getByPlaceholderText('Filled')
      expect(textarea).toHaveClass('border-0', 'bg-neutral-100')
    })
  })

  describe('Resize', () => {
    it('applies vertical resize by default', () => {
      render(<Textarea placeholder="Resize" />)
      expect(screen.getByPlaceholderText('Resize')).toHaveClass('resize-y')
    })

    it('applies none resize', () => {
      render(<Textarea resize="none" placeholder="No resize" />)
      expect(screen.getByPlaceholderText('No resize')).toHaveClass('resize-none')
    })

    it('applies horizontal resize', () => {
      render(<Textarea resize="horizontal" placeholder="Horizontal" />)
      expect(screen.getByPlaceholderText('Horizontal')).toHaveClass('resize-x')
    })

    it('applies both resize', () => {
      render(<Textarea resize="both" placeholder="Both" />)
      expect(screen.getByPlaceholderText('Both')).toHaveClass('resize')
    })
  })

  describe('Error handling', () => {
    it('displays error message', () => {
      render(<Textarea error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('applies error styles', () => {
      render(<Textarea error="Error" placeholder="Textarea" />)
      const textarea = screen.getByPlaceholderText('Textarea')
      expect(textarea).toHaveClass('border-error')
    })

    it('sets aria-invalid when error exists', () => {
      render(<Textarea error="Error" placeholder="Textarea" />)
      expect(screen.getByPlaceholderText('Textarea')).toHaveAttribute('aria-invalid', 'true')
    })

    it('error has role alert', () => {
      render(<Textarea error="Error message" />)
      expect(screen.getByRole('alert')).toHaveTextContent('Error message')
    })
  })

  describe('Helper text', () => {
    it('displays helper text', () => {
      render(<Textarea helperText="Optional helper text" />)
      expect(screen.getByText('Optional helper text')).toBeInTheDocument()
    })

    it('hides helper text when error exists', () => {
      render(<Textarea helperText="Helper" error="Error" />)
      expect(screen.queryByText('Helper')).not.toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })

  describe('Required field', () => {
    it('shows required indicator', () => {
      render(<Textarea label="Comment" required />)
      expect(screen.getByLabelText('required')).toBeInTheDocument()
    })

    it('sets required attribute', () => {
      render(<Textarea label="Comment" required />)
      expect(screen.getByLabelText(/Comment/)).toHaveAttribute('required')
    })
  })

  describe('Disabled state', () => {
    it('disables textarea', () => {
      render(<Textarea disabled placeholder="Disabled" />)
      expect(screen.getByPlaceholderText('Disabled')).toBeDisabled()
    })

    it('applies disabled styles', () => {
      render(<Textarea disabled placeholder="Disabled" />)
      expect(screen.getByPlaceholderText('Disabled')).toHaveClass('disabled:opacity-50')
    })
  })

  describe('Full width', () => {
    it('applies full width styles', () => {
      render(<Textarea fullWidth placeholder="Full width" />)
      const textarea = screen.getByPlaceholderText('Full width')
      expect(textarea).toHaveClass('w-full')
    })
  })

  describe('User interaction', () => {
    it('accepts user input', async () => {
      const user = userEvent.setup()
      render(<Textarea placeholder="Type here" />)
      const textarea = screen.getByPlaceholderText('Type here') as HTMLTextAreaElement

      await user.type(textarea, 'Hello World')
      expect(textarea.value).toBe('Hello World')
    })

    it('calls onChange handler', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Textarea placeholder="Textarea" onChange={handleChange} />)

      await user.type(screen.getByPlaceholderText('Textarea'), 'Test')
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Rows', () => {
    it('applies custom rows', () => {
      render(<Textarea rows={10} placeholder="10 rows" />)
      expect(screen.getByPlaceholderText('10 rows')).toHaveAttribute('rows', '10')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Textarea label="Comment" required error="Required" id="comment" placeholder="Enter comment" />)
      const textarea = screen.getByPlaceholderText('Enter comment')

      expect(textarea).toHaveAttribute('aria-invalid', 'true')
      expect(textarea).toHaveAttribute('required')
    })

    it('error has aria-live', () => {
      render(<Textarea error="Error message" />)
      const error = screen.getByRole('alert')
      expect(error).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(<Textarea className="custom-class" placeholder="Custom" />)
      const textarea = screen.getByPlaceholderText('Custom')
      expect(textarea).toHaveClass('custom-class')
      expect(textarea).toHaveClass('rounded-md')
    })
  })
})

