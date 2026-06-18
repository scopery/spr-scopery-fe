import type { Meta, StoryObj } from '@storybook/react'
import { UserProfileCard } from './UserProfileCard'

const meta = {
  title: 'Molecules/UserProfileCard',
  component: UserProfileCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'User name',
    },
    title: {
      control: 'text',
      description: 'User title/role',
    },
    avatar: {
      control: 'text',
      description: 'User avatar image URL',
    },
    onNotificationClick: {
      action: 'notification clicked',
      description: 'Callback when notification bell is clicked',
    },
  },
} satisfies Meta<typeof UserProfileCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: 'Paityn Levin',
    title: 'SR. UI DESIGNER',
    onNotificationClick: () => console.log('Notifications clicked'),
  },
}

export const WithAvatar: Story = {
  args: {
    name: 'John Doe',
    title: 'SENIOR DEVELOPER',
    avatar: 'https://i.pravatar.cc/150?img=12',
    onNotificationClick: () => console.log('Notifications clicked'),
  },
}

export const WithoutNotification: Story = {
  args: {
    name: 'Jane Smith',
    title: 'UI DESIGNER',
  },
}

export const LongName: Story = {
  args: {
    name: 'Christopher Alexander Johnson',
    title: 'SENIOR PRODUCT MANAGER',
    onNotificationClick: () => console.log('Notifications clicked'),
  },
}

export const LongTitle: Story = {
  args: {
    name: 'Sarah Chen',
    title: 'SENIOR FRONTEND DEVELOPER & TEAM LEAD',
    onNotificationClick: () => console.log('Notifications clicked'),
  },
}

