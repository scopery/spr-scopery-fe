import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './Input'

describe('Input', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<Input label="Email" />)
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
    })

    it('associates label with input', () => {
      render(<Input label="Username" id="username" />)
      const input = screen.getByLabelText('Username')
      expect(input).toHaveAttribute('id', 'username')
    })

    it('renders with prefix', () => {
      render(<Input prefix={<span data-testid="prefix-icon">@</span>} placeholder="Username" />)
      expect(screen.getByTestId('prefix-icon')).toBeInTheDocument()
    })

    it('renders with postfix', () => {
      render(<Input postfix={<span data-testid="postfix-icon">👁</span>} placeholder="Password" />)
      expect(screen.getByTestId('postfix-icon')).toBeInTheDocument()
    })

    it('renders with both prefix and postfix', () => {
      render(
        <Input
          prefix={<span data-testid="prefix-icon">@</span>}
          postfix={<span data-testid="postfix-icon">✓</span>}
          placeholder="Username"
        />
      )
      expect(screen.getByTestId('prefix-icon')).toBeInTheDocument()
      expect(screen.getByTestId('postfix-icon')).toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('applies small size styles', () => {
      render(<Input size="sm" placeholder="Small" />)
      const input = screen.getByPlaceholderText('Small')
      expect(input).toHaveClass('h-8', 'text-sm')
    })

    it('applies medium size styles by default', () => {
      render(<Input placeholder="Medium" />)
      const input = screen.getByPlaceholderText('Medium')
      expect(input).toHaveClass('h-10', 'text-sm')
    })

    it('applies large size styles', () => {
      render(<Input size="lg" placeholder="Large" />)
      const input = screen.getByPlaceholderText('Large')
      expect(input).toHaveClass('h-12', 'text-base')
    })
  })

  describe('Variants', () => {
    it('applies outline variant by default', () => {
      render(<Input placeholder="Outline" />)
      const input = screen.getByPlaceholderText('Outline')
      expect(input).toHaveClass('border', 'bg-white')
    })

    it('applies filled variant', () => {
      render(<Input variant="filled" placeholder="Filled" />)
      const input = screen.getByPlaceholderText('Filled')
      expect(input).toHaveClass('border-0', 'bg-neutral-100')
    })
  })

  describe('States', () => {
    it('applies default state styles', () => {
      render(<Input placeholder="Default" />)
      const input = screen.getByPlaceholderText('Default')
      expect(input).toHaveClass('border-neutral-300')
    })

    it('applies error state styles', () => {
      render(<Input state="error" placeholder="Error" />)
      const input = screen.getByPlaceholderText('Error')
      expect(input).toHaveClass('border-error')
    })

    it('applies success state styles', () => {
      render(<Input state="success" placeholder="Success" />)
      const input = screen.getByPlaceholderText('Success')
      expect(input).toHaveClass('border-success')
    })
  })

  describe('Error handling', () => {
    it('displays error message', () => {
      render(<Input error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('applies error state when error prop is provided', () => {
      render(<Input error="Error message" placeholder="Input" />)
      const input = screen.getByPlaceholderText('Input')
      expect(input).toHaveClass('border-error')
    })

    it('sets aria-invalid when error exists', () => {
      render(<Input error="Error" placeholder="Input" />)
      expect(screen.getByPlaceholderText('Input')).toHaveAttribute('aria-invalid', 'true')
    })

    it('links error message with aria-describedby', () => {
      render(<Input error="Error message" placeholder="Input" id="test-input" />)
      const input = screen.getByPlaceholderText('Input')
      const errorId = input.getAttribute('aria-describedby')
      expect(errorId).toContain('test-input-error')
    })

    it('error message has role alert', () => {
      render(<Input error="Error message" />)
      expect(screen.getByRole('alert')).toHaveTextContent('Error message')
    })
  })

  describe('Helper text', () => {
    it('displays helper text', () => {
      render(<Input helperText="Optional helper text" />)
      expect(screen.getByText('Optional helper text')).toBeInTheDocument()
    })

    it('hides helper text when error exists', () => {
      render(<Input helperText="Helper" error="Error" />)
      expect(screen.queryByText('Helper')).not.toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('links helper text with aria-describedby', () => {
      render(<Input helperText="Helper text" placeholder="Input" id="test-input" />)
      const input = screen.getByPlaceholderText('Input')
      const helperId = input.getAttribute('aria-describedby')
      expect(helperId).toContain('test-input-helper')
    })
  })

  describe('Required field', () => {
    it('shows required indicator', () => {
      render(<Input label="Email" required />)
      expect(screen.getByLabelText('required')).toBeInTheDocument()
    })

    it('sets required attribute on input', () => {
      render(<Input label="Email" required />)
      expect(screen.getByLabelText(/Email/)).toHaveAttribute('required')
    })
  })

  describe('Disabled state', () => {
    it('disables input', () => {
      render(<Input disabled placeholder="Disabled" />)
      expect(screen.getByPlaceholderText('Disabled')).toBeDisabled()
    })

    it('applies disabled styles', () => {
      render(<Input disabled placeholder="Disabled" />)
      expect(screen.getByPlaceholderText('Disabled')).toHaveClass('disabled:opacity-50')
    })
  })

  describe('Full width', () => {
    it('applies full width styles', () => {
      render(<Input fullWidth placeholder="Full width" />)
      const input = screen.getByPlaceholderText('Full width')
      expect(input).toHaveClass('w-full')
    })
  })

  describe('User interaction', () => {
    it('accepts user input', async () => {
      const user = userEvent.setup()
      render(<Input placeholder="Type here" />)
      const input = screen.getByPlaceholderText('Type here') as HTMLInputElement

      await user.type(input, 'Hello')
      expect(input.value).toBe('Hello')
    })

    it('calls onChange handler', async () => {
      const user = userEvent.setup()
      let value = ''
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        value = e.target.value
      }

      render(<Input placeholder="Input" onChange={handleChange} />)
      const input = screen.getByPlaceholderText('Input')

      await user.type(input, 'Test')
      expect(value).toBe('Test')
    })
  })

  describe('Input types', () => {
    it('supports email type', () => {
      render(<Input type="email" placeholder="Email" />)
      expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')
    })

    it('supports password type', () => {
      render(<Input type="password" placeholder="Password" />)
      expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
    })

    it('supports number type', () => {
      render(<Input type="number" placeholder="Number" />)
      expect(screen.getByPlaceholderText('Number')).toHaveAttribute('type', 'number')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Input
          label="Email"
          required
          error="Invalid email"
          placeholder="Input"
          id="email-input"
        />
      )
      const input = screen.getByPlaceholderText('Input')

      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby')
      expect(input).toHaveAttribute('required')
    })

    it('error has aria-live for screen readers', () => {
      render(<Input error="Error message" />)
      const error = screen.getByRole('alert')
      expect(error).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      render(<Input className="custom-class" placeholder="Custom" />)
      const input = screen.getByPlaceholderText('Custom')
      expect(input).toHaveClass('custom-class')
      expect(input).toHaveClass('rounded-md')
    })
  })
})

