import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventCard } from './EventCard'

describe('EventCard', () => {
  const defaultProps = {
    title: 'Meeting with Gilbert',
    description: 'Design system updates & development',
    time: '09:00 am - 09:30 am',
    image: 'https://example.com/image.jpg',
  }

  it('renders with title', () => {
    render(<EventCard title={defaultProps.title} />)
    expect(screen.getByText('Meeting with Gilbert')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(
      <EventCard
        title={defaultProps.title}
        description={defaultProps.description}
      />
    )
    expect(screen.getByText('Design system updates & development')).toBeInTheDocument()
  })

  it('renders time', () => {
    render(
      <EventCard
        title={defaultProps.title}
        time={defaultProps.time}
      />
    )
    expect(screen.getByText('09:00 am - 09:30 am')).toBeInTheDocument()
  })

  it('renders image', () => {
    render(
      <EventCard
        title={defaultProps.title}
        image={defaultProps.image}
      />
    )
    const img = screen.getByAltText('Meeting with Gilbert')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('uses custom alt text for image', () => {
    render(
      <EventCard
        title={defaultProps.title}
        image={defaultProps.image}
        imageAlt="Custom alt text"
      />
    )
    const img = screen.getByAltText('Custom alt text')
    expect(img).toBeInTheDocument()
  })

  it('renders copy link button when showCopyLink is true', () => {
    render(
      <EventCard
        title={defaultProps.title}
        showCopyLink={true}
      />
    )
    expect(screen.getByText('Copy the link')).toBeInTheDocument()
  })

  it('does not render copy link button when showCopyLink is false', () => {
    render(
      <EventCard
        title={defaultProps.title}
        showCopyLink={false}
      />
    )
    expect(screen.queryByText('Copy the link')).not.toBeInTheDocument()
  })

  it('calls onCopyLink when copy link button is clicked', async () => {
    const user = userEvent.setup()
    const onCopyLink = vi.fn()
    render(
      <EventCard
        title={defaultProps.title}
        showCopyLink={true}
        onCopyLink={onCopyLink}
      />
    )
    
    const copyButton = screen.getByText('Copy the link')
    await user.click(copyButton)
    
    expect(onCopyLink).toHaveBeenCalledTimes(1)
  })

  it('uses custom copy link text', () => {
    render(
      <EventCard
        title={defaultProps.title}
        showCopyLink={true}
        copyLinkText="Copy URL"
      />
    )
    expect(screen.getByText('Copy URL')).toBeInTheDocument()
  })

  it('renders without image', () => {
    render(<EventCard title={defaultProps.title} />)
    expect(screen.queryByAltText('Meeting with Gilbert')).not.toBeInTheDocument()
  })

  it('renders without description', () => {
    render(<EventCard title={defaultProps.title} />)
    expect(screen.queryByText('Design system updates & development')).not.toBeInTheDocument()
  })

  it('renders without time', () => {
    render(<EventCard title={defaultProps.title} />)
    expect(screen.queryByText('09:00 am - 09:30 am')).not.toBeInTheDocument()
  })

  it('renders share button when showShareButton is true', () => {
    render(
      <EventCard
        title={defaultProps.title}
        image={defaultProps.image}
        showShareButton={true}
      />
    )
    expect(screen.getByLabelText('Share event')).toBeInTheDocument()
  })

  it('does not render share button when showShareButton is false', () => {
    render(
      <EventCard
        title={defaultProps.title}
        image={defaultProps.image}
        showShareButton={false}
      />
    )
    expect(screen.queryByLabelText('Share event')).not.toBeInTheDocument()
  })

  it('calls onShare when share button is clicked', async () => {
    const user = userEvent.setup()
    const onShare = vi.fn()
    render(
      <EventCard
        title={defaultProps.title}
        image={defaultProps.image}
        showShareButton={true}
        onShare={onShare}
      />
    )
    
    const shareButton = screen.getByLabelText('Share event')
    await user.click(shareButton)
    
    expect(onShare).toHaveBeenCalledTimes(1)
  })
})

