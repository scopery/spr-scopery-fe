import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Divider } from './Divider'

describe('Divider', () => {
  describe('Rendering', () => {
    it('renders divider', () => {
      render(<Divider />)
      expect(screen.getByRole('separator')).toBeInTheDocument()
    })

    it('renders as hr element', () => {
      render(<Divider />)
      expect(screen.getByRole('separator').tagName).toBe('HR')
    })
  })

  describe('Orientation', () => {
    it('applies horizontal orientation by default', () => {
      render(<Divider />)
      const divider = screen.getByRole('separator')
      expect(divider).toHaveAttribute('aria-orientation', 'horizontal')
      expect(divider).toHaveClass('border-t')
    })

    it('applies vertical orientation', () => {
      render(<Divider orientation="vertical" />)
      const divider = screen.getByRole('separator')
      expect(divider).toHaveAttribute('aria-orientation', 'vertical')
      expect(divider).toHaveClass('border-l')
    })
  })

  describe('Variants', () => {
    it('applies solid variant by default', () => {
      render(<Divider />)
      expect(screen.getByRole('separator')).toHaveClass('border-solid')
    })

    it('applies dashed variant', () => {
      render(<Divider variant="dashed" />)
      expect(screen.getByRole('separator')).toHaveClass('border-dashed')
    })

    it('applies dotted variant', () => {
      render(<Divider variant="dotted" />)
      expect(screen.getByRole('separator')).toHaveClass('border-dotted')
    })
  })

  describe('With label', () => {
    it('renders label', () => {
      render(<Divider label="OR" />)
      expect(screen.getByText('OR')).toBeInTheDocument()
    })

    it('has aria-label', () => {
      render(<Divider label="Section" />)
      expect(screen.getByLabelText('Section')).toBeInTheDocument()
    })

    it('renders divider lines on both sides of label', () => {
      render(<Divider label="OR" />)
      const container = screen.getByLabelText('OR')
      const hrs = container.querySelectorAll('hr')
      expect(hrs).toHaveLength(2)
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(<Divider className="custom-class" />)
      expect(screen.getByRole('separator')).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    it('has role separator', () => {
      render(<Divider />)
      expect(screen.getByRole('separator')).toBeInTheDocument()
    })

    it('has aria-orientation', () => {
      render(<Divider orientation="vertical" />)
      expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
    })
  })
})

