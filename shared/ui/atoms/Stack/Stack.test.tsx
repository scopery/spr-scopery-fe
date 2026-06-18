import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Stack } from './Stack'

describe('Stack', () => {
  describe('Rendering', () => {
    it('renders children', () => {
      render(
        <Stack data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })

    it('renders as div by default', () => {
      render(<Stack data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack').tagName).toBe('DIV')
    })
  })

  describe('Direction', () => {
    it('applies vertical direction by default', () => {
      render(<Stack data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('flex-col')
    })

    it('applies horizontal direction', () => {
      render(<Stack direction="horizontal" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('flex-row')
    })
  })

  describe('Spacing', () => {
    it('applies md spacing by default', () => {
      render(<Stack data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('gap-md')
    })

    it('applies xs spacing', () => {
      render(<Stack spacing="xs" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('gap-xs')
    })

    it('applies sm spacing', () => {
      render(<Stack spacing="sm" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('gap-sm')
    })

    it('applies lg spacing', () => {
      render(<Stack spacing="lg" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('gap-lg')
    })

    it('applies xl spacing', () => {
      render(<Stack spacing="xl" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('gap-xl')
    })

    it('applies 2xl spacing', () => {
      render(<Stack spacing="2xl" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('gap-2xl')
    })

    it('applies no spacing', () => {
      render(<Stack spacing="none" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('gap-0')
    })
  })

  describe('Align', () => {
    it('applies start align', () => {
      render(<Stack align="start" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('items-start')
    })

    it('applies center align', () => {
      render(<Stack align="center" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('items-center')
    })

    it('applies end align', () => {
      render(<Stack align="end" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('items-end')
    })

    it('applies stretch align', () => {
      render(<Stack align="stretch" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('items-stretch')
    })
  })

  describe('Justify', () => {
    it('applies start justify', () => {
      render(<Stack justify="start" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('justify-start')
    })

    it('applies center justify', () => {
      render(<Stack justify="center" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('justify-center')
    })

    it('applies between justify', () => {
      render(<Stack justify="between" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('justify-between')
    })
  })

  describe('Wrap', () => {
    it('does not wrap by default', () => {
      render(<Stack data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).not.toHaveClass('flex-wrap')
    })

    it('applies wrap when enabled', () => {
      render(<Stack wrap data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack')).toHaveClass('flex-wrap')
    })
  })

  describe('Polymorphic', () => {
    it('renders as custom element', () => {
      render(<Stack as="section" data-testid="stack">Content</Stack>)
      expect(screen.getByTestId('stack').tagName).toBe('SECTION')
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(<Stack className="custom-class" data-testid="stack">Content</Stack>)
      const stack = screen.getByTestId('stack')
      expect(stack).toHaveClass('custom-class')
      expect(stack).toHaveClass('flex')
    })
  })
})

