import type { Meta, StoryObj } from '@storybook/react'
import { EventCard } from './EventCard'

const meta = {
  title: 'Molecules/EventCard',
  component: EventCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Event title',
    },
    description: {
      control: 'text',
      description: 'Event description',
    },
    time: {
      control: 'text',
      description: 'Event time range',
    },
    image: {
      control: 'text',
      description: 'Cover image URL',
    },
    imageAlt: {
      control: 'text',
      description: 'Alt text for the image',
    },
    showCopyLink: {
      control: 'boolean',
      description: 'Show copy link button',
    },
    copyLinkText: {
      control: 'text',
      description: 'Copy link button text',
    },
    onCopyLink: {
      action: 'copy link clicked',
      description: 'Callback when copy link button is clicked',
    },
    showShareButton: {
      control: 'boolean',
      description: 'Show share button on image',
    },
    onShare: {
      action: 'share clicked',
      description: 'Callback when share button is clicked',
    },
    onClick: {
      action: 'card clicked',
      description: 'Callback when card is clicked',
    },
  },
} satisfies Meta<typeof EventCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Meeting with Gilbert',
    description: 'Design system updates & development',
    time: '09:00 am - 09:30 am',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    showCopyLink: true,
    showShareButton: true,
    onCopyLink: () => console.log('Copy link clicked'),
    onShare: () => console.log('Share clicked'),
  },
}

export const WithShareButton: Story = {
  args: {
    ...Default.args,
    showShareButton: true,
  },
}

export const WithoutImage: Story = {
  args: {
    title: 'Team Standup',
    description: 'Daily sync meeting',
    time: '10:00 am - 10:15 am',
    showCopyLink: true,
  },
}

export const WithoutDescription: Story = {
  args: {
    title: 'Client Presentation',
    time: '02:00 pm - 03:00 pm',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
    showCopyLink: false,
  },
}

export const WithoutTime: Story = {
  args: {
    title: 'Project Review',
    description: 'Quarterly project review and planning session',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    showCopyLink: true,
  },
}

export const WithoutCopyLink: Story = {
  args: {
    title: 'Workshop Session',
    description: 'UI/UX design workshop',
    time: '11:00 am - 12:30 pm',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
    showCopyLink: false,
  },
}

export const CustomCopyLinkText: Story = {
  args: {
    title: 'All Hands Meeting',
    description: 'Company-wide meeting',
    time: '03:00 pm - 04:00 pm',
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800',
    showCopyLink: true,
    copyLinkText: 'Copy meeting link',
    onCopyLink: () => console.log('Copy link clicked'),
  },
}

export const LongTitle: Story = {
  args: {
    title: 'Very Long Event Title That Might Wrap to Multiple Lines',
    description: 'This is a description for an event with a very long title',
    time: '09:00 am - 10:00 am',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    showCopyLink: true,
  },
}

export const LongDescription: Story = {
  args: {
    title: 'Product Launch',
    description: 'This is a very long description that contains multiple sentences and should wrap properly within the card layout. It provides detailed information about the event.',
    time: '01:00 pm - 02:30 pm',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
    showCopyLink: true,
  },
}

