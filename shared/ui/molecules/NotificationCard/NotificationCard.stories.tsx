import type { Meta, StoryObj } from '@storybook/react'
import { NotificationCard } from './NotificationCard'

const meta = {
  title: 'Molecules/NotificationCard',
  component: NotificationCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title of the notification section',
    },
    sender: {
      control: 'object',
      description: 'Sender information',
    },
    message: {
      control: 'text',
      description: 'Notification message',
    },
    timeAgo: {
      control: 'text',
      description: 'Time ago (e.g., "5 mins")',
    },
    read: {
      control: 'boolean',
      description: 'Whether notification is read',
    },
    onSend: {
      action: 'send clicked',
      description: 'Callback when send button is clicked',
    },
    onClick: {
      action: 'card clicked',
      description: 'Callback when notification is clicked',
    },
  },
} satisfies Meta<typeof NotificationCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    sender: {
      name: 'Charlie Herwitz',
      role: 'PRODUCT DIRECTOR',
    },
    message: 'Would you like them formatted for a specific use case, like a project management tool?',
    timeAgo: '5 mins',
    read: true,
    onSend: () => console.log('Send clicked'),
  },
}

export const WithoutRole: Story = {
  args: {
    sender: {
      name: 'John Doe',
    },
    message: 'This is a notification message without sender role.',
    timeAgo: '10 mins',
    read: false,
  },
}

export const Unread: Story = {
  args: {
    sender: {
      name: 'Jane Smith',
      role: 'DESIGNER',
    },
    message: 'This is an unread notification.',
    timeAgo: '2 mins',
    read: false,
  },
}

export const WithAvatar: Story = {
  args: {
    sender: {
      name: 'Alice Johnson',
      role: 'DEVELOPER',
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
    message: 'Notification with custom avatar image.',
    timeAgo: '1 hour',
    read: true,
    onSend: () => console.log('Send clicked'),
  },
}

export const LongMessage: Story = {
  args: {
    sender: {
      name: 'Bob Wilson',
      role: 'PROJECT MANAGER',
    },
    message: 'This is a very long notification message that should wrap properly within the message bubble. It contains multiple sentences and should display nicely with proper text wrapping and spacing.',
    timeAgo: '30 mins',
    read: true,
  },
}

export const WithoutTime: Story = {
  args: {
    sender: {
      name: 'Sarah Connor',
      role: 'QA ENGINEER',
    },
    message: 'Notification without time information.',
    read: true,
  },
}

export const WithoutReadStatus: Story = {
  args: {
    sender: {
      name: 'Mike Davis',
      role: 'FRONTEND DEVELOPER',
    },
    message: 'Notification without read status.',
    timeAgo: '15 mins',
  },
}

