import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserProfileCard } from './UserProfileCard'

describe('UserProfileCard', () => {
  it('renders user name and title', () => {
    render(
      <UserProfileCard
        name="Paityn Levin"
        title="SR. UI DESIGNER"
      />
    )
    expect(screen.getByText('Paityn Levin')).toBeInTheDocument()
    expect(screen.getByText('SR. UI DESIGNER')).toBeInTheDocument()
  })

  it('renders avatar with fallback', () => {
    render(
      <UserProfileCard
        name="John Doe"
        title="DEVELOPER"
      />
    )
    const avatar = screen.getByText('JD')
    expect(avatar).toBeInTheDocument()
  })

  it('renders avatar with image when provided', () => {
    render(
      <UserProfileCard
        name="Jane Smith"
        title="DESIGNER"
        avatar="https://example.com/avatar.jpg"
      />
    )
    const avatar = screen.getByAltText('')
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('renders notification bell when onNotificationClick is provided', () => {
    render(
      <UserProfileCard
        name="Test User"
        title="TESTER"
        onNotificationClick={() => {}}
      />
    )
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
  })

  it('does not render notification bell when onNotificationClick is not provided', () => {
    render(
      <UserProfileCard
        name="Test User"
        title="TESTER"
      />
    )
    expect(screen.queryByLabelText('Notifications')).not.toBeInTheDocument()
  })

  it('calls onNotificationClick when bell is clicked', async () => {
    const user = userEvent.setup()
    const onNotificationClick = vi.fn()
    render(
      <UserProfileCard
        name="Test User"
        title="TESTER"
        onNotificationClick={onNotificationClick}
      />
    )
    
    const bellButton = screen.getByLabelText('Notifications')
    await user.click(bellButton)
    
    expect(onNotificationClick).toHaveBeenCalledTimes(1)
  })
})

