import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Box } from './Box'

describe('Box', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Box>Content</Box>)
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('renders as div by default', () => {
      render(<Box>Box</Box>)
      expect(screen.getByText('Box').tagName).toBe('DIV')
    })
  })

  describe('Display', () => {
    it('applies block display by default', () => {
      render(<Box>Block</Box>)
      expect(screen.getByText('Block')).toHaveClass('block')
    })

    it('applies flex display', () => {
      render(<Box display="flex">Flex</Box>)
      expect(screen.getByText('Flex')).toHaveClass('flex')
    })

    it('applies grid display', () => {
      render(<Box display="grid">Grid</Box>)
      expect(screen.getByText('Grid')).toHaveClass('grid')
    })

    it('applies inline-flex display', () => {
      render(<Box display="inline-flex">Inline Flex</Box>)
      expect(screen.getByText('Inline Flex')).toHaveClass('inline-flex')
    })
  })

  describe('Padding', () => {
    it('applies padding on all sides', () => {
      render(<Box padding="md">Padded</Box>)
      expect(screen.getByText('Padded')).toHaveClass('p-md')
    })

    it('applies padding X axis', () => {
      render(<Box paddingX="lg">Padded X</Box>)
      expect(screen.getByText('Padded X')).toHaveClass('px-lg')
    })

    it('applies padding Y axis', () => {
      render(<Box paddingY="sm">Padded Y</Box>)
      expect(screen.getByText('Padded Y')).toHaveClass('py-sm')
    })

    it('combines padding props correctly', () => {
      render(
        <Box paddingX="lg" paddingY="sm">
          Combined
        </Box>
      )
      const box = screen.getByText('Combined')
      expect(box).toHaveClass('px-lg', 'py-sm')
    })
  })

  describe('Border Radius', () => {
    it('applies border radius', () => {
      render(<Box radius="md">Rounded</Box>)
      expect(screen.getByText('Rounded')).toHaveClass('rounded-md')
    })

    it('applies full border radius', () => {
      render(<Box radius="full">Circle</Box>)
      expect(screen.getByText('Circle')).toHaveClass('rounded-full')
    })
  })

  describe('Shadow', () => {
    it('applies shadow', () => {
      render(<Box shadow="md">Shadow</Box>)
      expect(screen.getByText('Shadow')).toHaveClass('shadow-md')
    })

    it('applies large shadow', () => {
      render(<Box shadow="lg">Large Shadow</Box>)
      expect(screen.getByText('Large Shadow')).toHaveClass('shadow-lg')
    })
  })

  describe('Background', () => {
    it('applies white background', () => {
      render(<Box background="white">White BG</Box>)
      expect(screen.getByText('White BG')).toHaveClass('bg-white')
    })

    it('applies neutral background', () => {
      render(<Box background="neutral-100">Neutral BG</Box>)
      expect(screen.getByText('Neutral BG')).toHaveClass('bg-neutral-100')
    })

    it('applies primary background', () => {
      render(<Box background="primary">Primary BG</Box>)
      expect(screen.getByText('Primary BG')).toHaveClass('bg-primary')
    })
  })

  describe('Border', () => {
    it('applies border width', () => {
      render(<Box borderWidth="1">Border</Box>)
      expect(screen.getByText('Border')).toHaveClass('border')
    })

    it('applies border color', () => {
      render(<Box borderColor="neutral-200">Border Color</Box>)
      expect(screen.getByText('Border Color')).toHaveClass('border-neutral-200')
    })

    it('combines border width and color', () => {
      render(
        <Box borderWidth="2" borderColor="primary">
          Combined Border
        </Box>
      )
      const box = screen.getByText('Combined Border')
      expect(box).toHaveClass('border-2', 'border-primary')
    })
  })

  describe('Polymorphic', () => {
    it('renders as section when as="section"', () => {
      render(<Box as="section">Section</Box>)
      expect(screen.getByText('Section').tagName).toBe('SECTION')
    })

    it('renders as article when as="article"', () => {
      render(<Box as="article">Article</Box>)
      expect(screen.getByText('Article').tagName).toBe('ARTICLE')
    })

    it('renders as main when as="main"', () => {
      render(<Box as="main">Main</Box>)
      expect(screen.getByText('Main').tagName).toBe('MAIN')
    })
  })

  describe('Complex combinations', () => {
    it('applies multiple style props', () => {
      render(
        <Box
          display="flex"
          padding="lg"
          radius="md"
          shadow="sm"
          background="white"
          borderWidth="1"
          borderColor="neutral-200"
        >
          Card
        </Box>
      )
      const box = screen.getByText('Card')
      expect(box).toHaveClass(
        'flex',
        'p-lg',
        'rounded-md',
        'shadow-sm',
        'bg-white',
        'border',
        'border-neutral-200'
      )
    })
  })

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      render(
        <Box padding="md" className="custom-class">
          Custom
        </Box>
      )
      const box = screen.getByText('Custom')
      expect(box).toHaveClass('custom-class', 'p-md')
    })
  })
})

