import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileMediaLibrary } from './FileMediaLibrary'

describe('FileMediaLibrary', () => {
  const mockFolder = {
    name: 'Visual Vault',
    fileCount: 362,
    description: 'A curated collection of all creative essentials - images, photos, icons, and visual elements. Everything visual lives here.',
    previewImages: [
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
      'https://example.com/img3.jpg',
    ],
  }

  it('renders with default title', () => {
    render(<FileMediaLibrary folder={mockFolder} />)
    expect(screen.getByText('File & media library')).toBeInTheDocument()
  })

  it('renders custom title', () => {
    render(<FileMediaLibrary title="Custom Title" folder={mockFolder} />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('renders folder name', () => {
    render(<FileMediaLibrary folder={mockFolder} />)
    expect(screen.getByText('Visual Vault')).toBeInTheDocument()
  })

  it('renders file count', () => {
    render(<FileMediaLibrary folder={mockFolder} />)
    expect(screen.getByText('362 files')).toBeInTheDocument()
  })

  it('renders folder description', () => {
    render(<FileMediaLibrary folder={mockFolder} />)
    expect(screen.getByText(/A curated collection of all creative essentials/)).toBeInTheDocument()
  })

  it('renders SVG illustration', () => {
    render(<FileMediaLibrary folder={mockFolder} />)
    const svgImage = screen.getByAltText('Media folder')
    expect(svgImage).toBeInTheDocument()
    expect(svgImage).toHaveAttribute('src', '/illustrations/media-folder.svg')
  })

  it('renders add button when onAdd is provided', () => {
    render(
      <FileMediaLibrary
        folder={mockFolder}
        onAdd={() => {}}
      />
    )
    expect(screen.getByLabelText('Add file')).toBeInTheDocument()
  })

  it('renders share button when onShare is provided', () => {
    render(
      <FileMediaLibrary
        folder={mockFolder}
        onShare={() => {}}
      />
    )
    expect(screen.getByLabelText('Share')).toBeInTheDocument()
  })

  it('calls onAdd when add button is clicked', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(
      <FileMediaLibrary
        folder={mockFolder}
        onAdd={onAdd}
      />
    )
    
    const addButton = screen.getByLabelText('Add file')
    await user.click(addButton)
    
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('calls onShare when share button is clicked', async () => {
    const user = userEvent.setup()
    const onShare = vi.fn()
    render(
      <FileMediaLibrary
        folder={mockFolder}
        onShare={onShare}
      />
    )
    
    const shareButton = screen.getByLabelText('Share')
    await user.click(shareButton)
    
    expect(onShare).toHaveBeenCalledTimes(1)
  })

  it('renders action button when onAction is provided', () => {
    render(
      <FileMediaLibrary
        folder={mockFolder}
        onAction={() => {}}
      />
    )
    expect(screen.getByText('Open the folder')).toBeInTheDocument()
  })

  it('calls onAction when action button is clicked', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <FileMediaLibrary
        folder={mockFolder}
        onAction={onAction}
      />
    )
    
    const actionButton = screen.getByText('Open the folder')
    await user.click(actionButton)
    
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('uses custom action label', () => {
    render(
      <FileMediaLibrary
        folder={mockFolder}
        actionLabel="View Files"
        onAction={() => {}}
      />
    )
    expect(screen.getByText('View Files')).toBeInTheDocument()
  })

  it('renders navigation buttons when provided', () => {
    render(
      <FileMediaLibrary
        folder={mockFolder}
        onPrevious={() => {}}
        onNext={() => {}}
      />
    )
    expect(screen.getByLabelText('Previous')).toBeInTheDocument()
    expect(screen.getByLabelText('Next')).toBeInTheDocument()
  })

  it('calls onPrevious when previous button is clicked', async () => {
    const user = userEvent.setup()
    const onPrevious = vi.fn()
    render(
      <FileMediaLibrary
        folder={mockFolder}
        onPrevious={onPrevious}
      />
    )
    
    const prevButton = screen.getByLabelText('Previous')
    await user.click(prevButton)
    
    expect(onPrevious).toHaveBeenCalledTimes(1)
  })

  it('calls onNext when next button is clicked', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(
      <FileMediaLibrary
        folder={mockFolder}
        onNext={onNext}
      />
    )
    
    const nextButton = screen.getByLabelText('Next')
    await user.click(nextButton)
    
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})

