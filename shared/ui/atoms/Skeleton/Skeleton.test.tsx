import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  describe('Rendering', () => {
    it('renders skeleton', () => {
      const { container } = render(<Skeleton />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('has aria-busy', () => {
      const { container } = render(<Skeleton />)
      expect(container.firstChild).toHaveAttribute('aria-busy', 'true')
    })

    it('has aria-live', () => {
      const { container } = render(<Skeleton />)
      expect(container.firstChild).toHaveAttribute('aria-live', 'polite')
    })

    it('has aria-label', () => {
      const { container } = render(<Skeleton />)
      expect(container.firstChild).toHaveAttribute('aria-label', 'Loading...')
    })
  })

  describe('Variants', () => {
    it('applies text variant by default', () => {
      const { container } = render(<Skeleton />)
      expect(container.firstChild).toHaveClass('rounded')
    })

    it('applies circular variant', () => {
      const { container } = render(<Skeleton variant="circular" />)
      expect(container.firstChild).toHaveClass('rounded-full')
    })

    it('applies rectangular variant', () => {
      const { container } = render(<Skeleton variant="rectangular" />)
      expect(container.firstChild).toHaveClass('rounded-md')
    })
  })

  describe('Dimensions', () => {
    it('applies custom width as number', () => {
      const { container } = render(<Skeleton width={200} />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton.style.width).toBe('200px')
    })

    it('applies custom width as string', () => {
      const { container } = render(<Skeleton width="50%" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton.style.width).toBe('50%')
    })

    it('applies custom height as number', () => {
      const { container } = render(<Skeleton height={100} />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton.style.height).toBe('100px')
    })

    it('applies custom height as string', () => {
      const { container } = render(<Skeleton height="2rem" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton.style.height).toBe('2rem')
    })

    it('applies both width and height', () => {
      const { container } = render(<Skeleton width={200} height={100} />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton.style.width).toBe('200px')
      expect(skeleton.style.height).toBe('100px')
    })
  })

  describe('Animation', () => {
    it('has animation by default', () => {
      const { container } = render(<Skeleton />)
      expect(container.firstChild).toHaveClass('animate-pulse')
    })

    it('can disable animation', () => {
      const { container } = render(<Skeleton noAnimation />)
      expect(container.firstChild).not.toHaveClass('animate-pulse')
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      const { container } = render(<Skeleton className="custom-class" />)
      expect(container.firstChild).toHaveClass('custom-class')
      expect(container.firstChild).toHaveClass('bg-neutral-200')
    })
  })
})

