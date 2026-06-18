import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Spacer } from './Spacer'

describe('Spacer', () => {
  describe('Rendering', () => {
    it('renders spacer', () => {
      const { container } = render(<Spacer />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('has aria-hidden', () => {
      const { container } = render(<Spacer />)
      expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Axis', () => {
    it('applies vertical axis by default', () => {
      const { container } = render(<Spacer />)
      expect(container.firstChild).toHaveClass('h-md')
    })

    it('applies horizontal axis', () => {
      const { container } = render(<Spacer axis="horizontal" />)
      expect(container.firstChild).toHaveClass('w-md')
    })

    it('applies both axis', () => {
      const { container } = render(<Spacer axis="both" />)
      const spacer = container.firstChild
      expect(spacer).toHaveClass('h-md', 'w-md')
    })
  })

  describe('Sizes', () => {
    it('applies xs size', () => {
      const { container } = render(<Spacer size="xs" />)
      expect(container.firstChild).toHaveClass('h-xs')
    })

    it('applies sm size', () => {
      const { container } = render(<Spacer size="sm" />)
      expect(container.firstChild).toHaveClass('h-sm')
    })

    it('applies md size by default', () => {
      const { container } = render(<Spacer />)
      expect(container.firstChild).toHaveClass('h-md')
    })

    it('applies lg size', () => {
      const { container } = render(<Spacer size="lg" />)
      expect(container.firstChild).toHaveClass('h-lg')
    })

    it('applies xl size', () => {
      const { container } = render(<Spacer size="xl" />)
      expect(container.firstChild).toHaveClass('h-xl')
    })

    it('applies 2xl size', () => {
      const { container } = render(<Spacer size="2xl" />)
      expect(container.firstChild).toHaveClass('h-2xl')
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      const { container } = render(<Spacer className="custom-class" />)
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})

