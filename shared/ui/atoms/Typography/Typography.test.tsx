import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Typography } from './Typography'

describe('Typography', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Typography>Test text</Typography>)
      expect(screen.getByText('Test text')).toBeInTheDocument()
    })

    it('renders as p by default', () => {
      render(<Typography>Paragraph</Typography>)
      expect(screen.getByText('Paragraph').tagName).toBe('P')
    })
  })

  describe('Heading Variants', () => {
    it('renders h1 variant', () => {
      render(<Typography variant="h1">H1</Typography>)
      const element = screen.getByText('H1')
      expect(element.tagName).toBe('H1')
      expect(element).toHaveClass('text-4xl', 'font-bold')
    })

    it('renders h2 variant', () => {
      render(<Typography variant="h2">H2</Typography>)
      const element = screen.getByText('H2')
      expect(element.tagName).toBe('H2')
      expect(element).toHaveClass('text-3xl', 'font-bold')
    })

    it('renders h3 variant', () => {
      render(<Typography variant="h3">H3</Typography>)
      const element = screen.getByText('H3')
      expect(element.tagName).toBe('H3')
      expect(element).toHaveClass('text-2xl', 'font-bold')
    })

    it('renders h4 variant', () => {
      render(<Typography variant="h4">H4</Typography>)
      expect(screen.getByText('H4').tagName).toBe('H4')
    })

    it('renders h5 variant', () => {
      render(<Typography variant="h5">H5</Typography>)
      expect(screen.getByText('H5').tagName).toBe('H5')
    })

    it('renders h6 variant', () => {
      render(<Typography variant="h6">H6</Typography>)
      expect(screen.getByText('H6').tagName).toBe('H6')
    })
  })

  describe('Text Variants', () => {
    it('renders body variant', () => {
      render(<Typography variant="body">Body</Typography>)
      expect(screen.getByText('Body')).toHaveClass('text-base', 'font-normal')
    })

    it('renders lead variant', () => {
      render(<Typography variant="lead">Lead</Typography>)
      expect(screen.getByText('Lead')).toHaveClass('text-lg', 'font-normal')
    })

    it('renders large variant', () => {
      render(<Typography variant="large">Large</Typography>)
      expect(screen.getByText('Large')).toHaveClass('text-lg')
    })

    it('renders small variant', () => {
      render(<Typography variant="small">Small</Typography>)
      expect(screen.getByText('Small')).toHaveClass('text-sm')
    })

    it('renders muted variant', () => {
      render(<Typography variant="muted">Muted</Typography>)
      expect(screen.getByText('Muted')).toHaveClass('text-neutral-600')
    })

    it('renders caption variant', () => {
      render(<Typography variant="caption">Caption</Typography>)
      expect(screen.getByText('Caption')).toHaveClass('text-sm', 'font-normal')
    })

    it('renders overline variant', () => {
      render(<Typography variant="overline">Overline</Typography>)
      const element = screen.getByText('Overline')
      expect(element).toHaveClass('text-xs', 'uppercase', 'tracking-wide')
    })
  })

  describe('Custom Sizes', () => {
    it('overrides variant size', () => {
      render(
        <Typography variant="h1" size="sm">
          Small H1
        </Typography>
      )
      expect(screen.getByText('Small H1')).toHaveClass('text-sm')
    })

    it('applies custom size to body', () => {
      render(
        <Typography variant="body" size="xl">
          Large body
        </Typography>
      )
      expect(screen.getByText('Large body')).toHaveClass('text-xl')
    })
  })

  describe('Weights', () => {
    it('overrides variant weight', () => {
      render(
        <Typography variant="h1" weight="normal">
          Normal H1
        </Typography>
      )
      expect(screen.getByText('Normal H1')).toHaveClass('font-normal')
    })

    it('applies semibold weight', () => {
      render(<Typography weight="semibold">Semibold</Typography>)
      expect(screen.getByText('Semibold')).toHaveClass('font-semibold')
    })
  })

  describe('Alignment', () => {
    it('applies left alignment', () => {
      render(<Typography align="left">Left</Typography>)
      expect(screen.getByText('Left')).toHaveClass('text-left')
    })

    it('applies center alignment', () => {
      render(<Typography align="center">Center</Typography>)
      expect(screen.getByText('Center')).toHaveClass('text-center')
    })

    it('applies right alignment', () => {
      render(<Typography align="right">Right</Typography>)
      expect(screen.getByText('Right')).toHaveClass('text-right')
    })

    it('applies justify alignment', () => {
      render(<Typography align="justify">Justify</Typography>)
      expect(screen.getByText('Justify')).toHaveClass('text-justify')
    })
  })

  describe('Tones', () => {
    it('applies default tone', () => {
      render(<Typography tone="default">Default</Typography>)
      expect(screen.getByText('Default')).toHaveClass('text-neutral-900')
    })

    it('applies primary tone', () => {
      render(<Typography tone="primary">Primary</Typography>)
      expect(screen.getByText('Primary')).toHaveClass('text-primary')
    })

    it('applies error tone', () => {
      render(<Typography tone="error">Error</Typography>)
      expect(screen.getByText('Error')).toHaveClass('text-error')
    })

    it('applies success tone', () => {
      render(<Typography tone="success">Success</Typography>)
      expect(screen.getByText('Success')).toHaveClass('text-success')
    })
  })

  describe('Truncate', () => {
    it('applies truncate styles', () => {
      render(<Typography truncate>Long text</Typography>)
      expect(screen.getByText('Long text')).toHaveClass('truncate')
    })
  })

  describe('Italic', () => {
    it('applies italic styles', () => {
      render(<Typography italic>Italic</Typography>)
      expect(screen.getByText('Italic')).toHaveClass('italic')
    })
  })

  describe('Polymorphic', () => {
    it('overrides default element with as prop', () => {
      render(
        <Typography variant="h1" as="div">
          Div styled as H1
        </Typography>
      )
      expect(screen.getByText('Div styled as H1').tagName).toBe('DIV')
    })

    it('renders as span', () => {
      render(<Typography as="span">Span</Typography>)
      expect(screen.getByText('Span').tagName).toBe('SPAN')
    })

    it('renders as label', () => {
      render(
        <Typography as="label" htmlFor="input">
          Label
        </Typography>
      )
      const label = screen.getByText('Label')
      expect(label.tagName).toBe('LABEL')
      expect(label).toHaveAttribute('for', 'input')
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(<Typography className="custom-class">Custom</Typography>)
      const element = screen.getByText('Custom')
      expect(element).toHaveClass('custom-class')
      expect(element).toHaveClass('text-neutral-900')
    })
  })

  describe('Combined props', () => {
    it('combines multiple props', () => {
      render(
        <Typography variant="h2" size="xl" weight="normal" tone="primary" align="center" truncate>
          Combined
        </Typography>
      )
      const element = screen.getByText('Combined')
      expect(element).toHaveClass(
        'text-xl',
        'font-normal',
        'text-primary',
        'text-center',
        'truncate'
      )
    })
  })
})

