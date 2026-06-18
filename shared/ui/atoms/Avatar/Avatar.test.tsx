import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  describe('Rendering', () => {
    it('renders avatar', () => {
      render(<Avatar fallback="JD" />)
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('renders as div by default', () => {
      render(<Avatar fallback="JD" />)
      expect(screen.getByText('JD').parentElement?.parentElement?.tagName).toBe('DIV')
    })
  })

  describe('Image', () => {
    it('renders image when src is provided', () => {
      render(<Avatar src="/test.jpg" alt="Test User" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', '/test.jpg')
      expect(img).toHaveAttribute('alt', 'Test User')
    })

    it('shows fallback when image fails to load', async () => {
      render(<Avatar src="/invalid.jpg" fallback="JD" />)
      const img = screen.getByRole('img')
      
      // Simulate image error
      await new Promise((resolve) => {
        img.addEventListener('error', resolve)
        img.dispatchEvent(new Event('error'))
      })
      
      // After error, fallback should appear
      await screen.findByText('JD')
      expect(screen.getByText('JD')).toBeInTheDocument()
    })
  })

  describe('Fallback', () => {
    it('renders fallback text', () => {
      render(<Avatar fallback="AB" />)
      expect(screen.getByText('AB')).toBeInTheDocument()
    })

    it('fallback has aria-label', () => {
      render(<Avatar fallback="JD" alt="John Doe" />)
      const fallback = screen.getByLabelText('John Doe')
      expect(fallback).toBeInTheDocument()
    })

    it('renders default icon when no src or fallback', () => {
      render(<Avatar />)
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('applies xs size', () => {
      render(<Avatar size="xs" fallback="XS" />)
      const container = screen.getByText('XS').parentElement
      expect(container).toHaveClass('h-6', 'w-6', 'text-xs')
    })

    it('applies sm size', () => {
      render(<Avatar size="sm" fallback="SM" />)
      const container = screen.getByText('SM').parentElement
      expect(container).toHaveClass('h-8', 'w-8', 'text-sm')
    })

    it('applies md size by default', () => {
      render(<Avatar fallback="MD" />)
      const container = screen.getByText('MD').parentElement
      expect(container).toHaveClass('h-10', 'w-10', 'text-base')
    })

    it('applies lg size', () => {
      render(<Avatar size="lg" fallback="LG" />)
      const container = screen.getByText('LG').parentElement
      expect(container).toHaveClass('h-12', 'w-12', 'text-lg')
    })

    it('applies xl size', () => {
      render(<Avatar size="xl" fallback="XL" />)
      const container = screen.getByText('XL').parentElement
      expect(container).toHaveClass('h-16', 'w-16', 'text-xl')
    })

    it('applies 2xl size', () => {
      render(<Avatar size="2xl" fallback="2X" />)
      const container = screen.getByText('2X').parentElement
      expect(container).toHaveClass('h-20', 'w-20', 'text-2xl')
    })
  })

  describe('Shapes', () => {
    it('applies circle shape by default', () => {
      render(<Avatar fallback="C" />)
      const container = screen.getByText('C').parentElement
      expect(container).toHaveClass('rounded-full')
    })

    it('applies square shape', () => {
      render(<Avatar shape="square" fallback="S" />)
      const container = screen.getByText('S').parentElement
      expect(container).toHaveClass('rounded-md')
    })
  })

  describe('Status indicator', () => {
    it('does not render status by default', () => {
      render(<Avatar fallback="JD" />)
      expect(screen.queryByLabelText(/Status:/)).not.toBeInTheDocument()
    })

    it('renders online status', () => {
      render(<Avatar fallback="JD" status="online" />)
      const status = screen.getByLabelText('Status: online')
      expect(status).toHaveClass('bg-success')
    })

    it('renders offline status', () => {
      render(<Avatar fallback="JD" status="offline" />)
      const status = screen.getByLabelText('Status: offline')
      expect(status).toHaveClass('bg-neutral-400')
    })

    it('renders away status', () => {
      render(<Avatar fallback="JD" status="away" />)
      const status = screen.getByLabelText('Status: away')
      expect(status).toHaveClass('bg-warning')
    })

    it('renders busy status', () => {
      render(<Avatar fallback="JD" status="busy" />)
      const status = screen.getByLabelText('Status: busy')
      expect(status).toHaveClass('bg-error')
    })
  })

  describe('Polymorphic', () => {
    it('renders as custom element', () => {
      render(<Avatar as="button" fallback="JD" />)
      expect(screen.getByText('JD').parentElement?.parentElement?.tagName).toBe('BUTTON')
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(<Avatar fallback="JD" className="custom-class" />)
      const avatar = screen.getByText('JD').parentElement?.parentElement
      expect(avatar).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    it('image has alt text', () => {
      render(<Avatar src="/test.jpg" alt="User Name" />)
      expect(screen.getByRole('img')).toHaveAttribute('alt', 'User Name')
    })

    it('status has aria-label', () => {
      render(<Avatar fallback="JD" status="online" />)
      expect(screen.getByLabelText('Status: online')).toBeInTheDocument()
    })

    it('default icon has aria-hidden', () => {
      render(<Avatar />)
      const svg = document.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })
  })
})

