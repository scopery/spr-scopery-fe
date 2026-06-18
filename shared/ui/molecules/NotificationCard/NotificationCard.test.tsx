import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationCard } from './NotificationCard'

describe('NotificationCard', () => {
  const mockSender = {
    name: 'Charlie Herwitz',
    role: 'PRODUCT DIRECTOR',
  }

  it('renders with default title', () => {
    render(
      <NotificationCard
        sender={mockSender}
        message="Test message"
      />
    )
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('renders custom title', () => {
    render(
      <NotificationCard
        title="Custom Title"
        sender={mockSender}
        message="Test message"
      />
    )
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('renders sender name and role', () => {
    render(
      <NotificationCard
        sender={mockSender}
        message="Test message"
      />
    )
    expect(screen.getByText('Charlie Herwitz')).toBeInTheDocument()
    expect(screen.getByText('PRODUCT DIRECTOR')).toBeInTheDocument()
  })

  it('renders message', () => {
    render(
      <NotificationCard
        sender={mockSender}
        message="Test message content"
      />
    )
    expect(screen.getByText('Test message content')).toBeInTheDocument()
  })

  it('renders time ago', () => {
    render(
      <NotificationCard
        sender={mockSender}
        message="Test message"
        timeAgo="5 mins"
      />
    )
    expect(screen.getByText('5 mins')).toBeInTheDocument()
  })

  it('renders read status', () => {
    render(
      <NotificationCard
        sender={mockSender}
        message="Test message"
        read={true}
      />
    )
    expect(screen.getByText('Read')).toBeInTheDocument()
  })

  it('does not render read status when read is false', () => {
    render(
      <NotificationCard
        sender={mockSender}
        message="Test message"
        read={false}
      />
    )
    // When read is false, read status should not be shown
    expect(screen.queryByText('Read')).not.toBeInTheDocument()
  })

  it('calls onSend when send button is clicked', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(
      <NotificationCard
        sender={mockSender}
        message="Test message"
        onSend={onSend}
      />
    )
    
    const sendButton = screen.getByLabelText('Send message')
    await user.click(sendButton)
    
    expect(onSend).toHaveBeenCalledTimes(1)
  })

  it('does not render send button when onSend is not provided', () => {
    render(
      <NotificationCard
        sender={mockSender}
        message="Test message"
      />
    )
    expect(screen.queryByLabelText('Send message')).not.toBeInTheDocument()
  })

  it('renders avatar with fallback', () => {
    render(
      <NotificationCard
        sender={mockSender}
        message="Test message"
      />
    )
    const avatar = screen.getByText('CH')
    expect(avatar).toBeInTheDocument()
  })

  it('renders avatar with image when provided', () => {
    render(
      <NotificationCard
        sender={{
          ...mockSender,
          avatar: 'https://example.com/avatar.jpg',
        }}
        message="Test message"
      />
    )
    const avatar = screen.getByAltText('')
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })
})

