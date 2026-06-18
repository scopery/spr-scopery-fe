import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SchedulingCard } from './SchedulingCard'

describe('SchedulingCard', () => {
  const mockEvent = {
    title: 'Expo world press photo Montreal',
    location: '325 Rue de la Commune E',
    time: '10:30am',
    image: 'https://example.com/image.jpg',
  }

  it('renders with default title', () => {
    render(<SchedulingCard event={mockEvent} />)
    expect(screen.getByText('Scheduling')).toBeInTheDocument()
  })

  it('renders custom title', () => {
    render(<SchedulingCard title="Custom Title" event={mockEvent} />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(
      <SchedulingCard
        description="You have one scheduled event today"
        event={mockEvent}
      />
    )
    expect(screen.getByText('You have one scheduled event today')).toBeInTheDocument()
  })

  it('renders day and date', () => {
    render(
      <SchedulingCard
        day="FRIDAY"
        date="Mar 28"
        event={mockEvent}
      />
    )
    expect(screen.getByText('FRIDAY')).toBeInTheDocument()
    expect(screen.getByText('Mar 28')).toBeInTheDocument()
  })

  it('renders event title', () => {
    render(<SchedulingCard event={mockEvent} />)
    expect(screen.getByText('Expo world press photo Montreal')).toBeInTheDocument()
  })

  it('renders event location', () => {
    render(<SchedulingCard event={mockEvent} />)
    expect(screen.getByText('325 Rue de la Commune E')).toBeInTheDocument()
  })

  it('renders event time', () => {
    render(<SchedulingCard event={mockEvent} />)
    expect(screen.getByText('10:30am')).toBeInTheDocument()
  })

  it('renders event image', () => {
    render(<SchedulingCard event={mockEvent} />)
    const img = screen.getByAltText('Expo world press photo Montreal')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('uses custom image alt text', () => {
    render(
      <SchedulingCard
        event={{
          ...mockEvent,
          imageAlt: 'Custom alt text',
        }}
      />
    )
    const img = screen.getByAltText('Custom alt text')
    expect(img).toBeInTheDocument()
  })

  it('renders action button when onAction is provided', () => {
    render(
      <SchedulingCard
        event={mockEvent}
        onAction={() => {}}
      />
    )
    expect(screen.getByText('Mark this event')).toBeInTheDocument()
  })

  it('calls onAction when button is clicked', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <SchedulingCard
        event={mockEvent}
        onAction={onAction}
      />
    )
    
    const button = screen.getByText('Mark this event')
    await user.click(button)
    
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('uses custom action label', () => {
    render(
      <SchedulingCard
        event={mockEvent}
        actionLabel="Custom Action"
        onAction={() => {}}
      />
    )
    expect(screen.getByText('Custom Action')).toBeInTheDocument()
  })

  it('renders without image', () => {
    const eventWithoutImage = {
      title: 'Event without image',
      location: 'Some location',
    }
    render(<SchedulingCard event={eventWithoutImage} />)
    expect(screen.queryByAltText('Event without image')).not.toBeInTheDocument()
  })

  it('renders without location', () => {
    const eventWithoutLocation = {
      title: 'Event',
      time: '10:30am',
    }
    render(<SchedulingCard event={eventWithoutLocation} />)
    expect(screen.queryByText('325 Rue de la Commune E')).not.toBeInTheDocument()
    expect(screen.getByText('10:30am')).toBeInTheDocument()
  })

  it('renders without time', () => {
    const eventWithoutTime = {
      title: 'Event',
      location: 'Some location',
    }
    render(<SchedulingCard event={eventWithoutTime} />)
    expect(screen.queryByText('10:30am')).not.toBeInTheDocument()
    expect(screen.getByText('Some location')).toBeInTheDocument()
  })
})

