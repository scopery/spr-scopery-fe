import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('does not render when open is false', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders when open is true', () => {
    render(
      <Modal open={true} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders title', () => {
    render(
      <Modal open={true} title="Test Modal" onClose={() => {}}>
        <div>Content</div>
      </Modal>
    )
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Test Modal')).toHaveAttribute('id', 'modal-title')
  })

  it('renders close button by default', () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose}>
        <div>Content</div>
      </Modal>
    )
    const closeButton = screen.getByLabelText('Close modal')
    expect(closeButton).toBeInTheDocument()
  })

  it('hides close button when showCloseButton is false', () => {
    render(
      <Modal open={true} showCloseButton={false} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    )
    expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose}>
        <div>Content</div>
      </Modal>
    )
    
    const closeButton = screen.getByLabelText('Close modal')
    await user.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal open={true} onClose={onClose}>
        <div>Content</div>
      </Modal>
    )
    
    // Find the overlay (the Box with backdrop)
    const overlay = container.querySelector('[aria-modal="true"]')
    if (overlay) {
      // Simulate clicking on the overlay itself (not the modal content)
      fireEvent.click(overlay, { target: overlay })
      expect(onClose).toHaveBeenCalledTimes(1)
    }
  })

  it('does not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose}>
        <div>Content</div>
      </Modal>
    )
    
    const content = screen.getByText('Content')
    await user.click(content)
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when ESC key is pressed', () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose}>
        <div>Content</div>
      </Modal>
    )
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders action buttons in footer', () => {
    const actions = [
      { label: 'Cancel', onClick: () => {}, variant: 'ghost' as const },
      { label: 'Confirm', onClick: () => {}, variant: 'primary' as const },
    ]
    render(
      <Modal open={true} onClose={() => {}} actions={actions}>
        <div>Content</div>
      </Modal>
    )
    
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })

  it('calls action onClick when button is clicked', async () => {
    const user = userEvent.setup()
    const handleConfirm = vi.fn()
    const actions = [
      { label: 'Confirm', onClick: handleConfirm },
    ]
    render(
      <Modal open={true} onClose={() => {}} actions={actions}>
        <div>Content</div>
      </Modal>
    )
    
    const confirmButton = screen.getByText('Confirm')
    await user.click(confirmButton)
    
    expect(handleConfirm).toHaveBeenCalledTimes(1)
  })

  it('applies correct size classes', () => {
    const { rerender } = render(
      <Modal open={true} size="sm" onClose={() => {}}>
        <div>Content</div>
      </Modal>
    )
    const modal = screen.getByRole('dialog').querySelector('.max-w-sm')
    expect(modal).toBeInTheDocument()

    rerender(
      <Modal open={true} size="lg" onClose={() => {}}>
        <div>Content</div>
      </Modal>
    )
    const modalLg = screen.getByRole('dialog').querySelector('.max-w-lg')
    expect(modalLg).toBeInTheDocument()
  })

  it('prevents body scroll when open', () => {
    render(
      <Modal open={true} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    )
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll when closed', () => {
    const { rerender } = render(
      <Modal open={true} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    )
    expect(document.body.style.overflow).toBe('hidden')

    rerender(
      <Modal open={false} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    )
    expect(document.body.style.overflow).toBe('')
  })
})

