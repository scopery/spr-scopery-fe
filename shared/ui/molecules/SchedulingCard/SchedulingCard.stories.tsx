import type { Meta, StoryObj } from '@storybook/react'
import { SchedulingCard } from './SchedulingCard'

const meta = {
  title: 'Molecules/SchedulingCard',
  component: SchedulingCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title of the scheduling section',
    },
    description: {
      control: 'text',
      description: 'Description text below title',
    },
    day: {
      control: 'text',
      description: 'Day of the week',
    },
    date: {
      control: 'text',
      description: 'Date',
    },
    event: {
      control: 'object',
      description: 'Event information',
    },
    actionLabel: {
      control: 'text',
      description: 'Action button text',
    },
    onAction: {
      action: 'action clicked',
      description: 'Callback when action button is clicked',
    },
  },
} satisfies Meta<typeof SchedulingCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    description: 'You have one scheduled event today - don\'t miss them!',
    day: 'FRIDAY',
    date: 'Mar 28',
    event: {
      title: 'Expo world press photo Montreal',
      location: '325 Rue de la Commune E',
      time: '10:30am',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    },
    onAction: () => console.log('Marked'),
  },
}

export const WithoutImage: Story = {
  args: {
    ...Default.args,
    event: {
      title: 'Team Meeting',
      location: 'Conference Room A',
      time: '2:00pm',
    },
  },
}

export const WithoutLocation: Story = {
  args: {
    ...Default.args,
    event: {
      title: 'Virtual Conference',
      time: '3:00pm',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    },
  },
}

export const WithoutTime: Story = {
  args: {
    ...Default.args,
    event: {
      title: 'Workshop Session',
      location: 'Training Center',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    },
  },
}

export const WithoutAction: Story = {
  args: {
    ...Default.args,
    onAction: undefined,
  },
}

export const CustomActionLabel: Story = {
  args: {
    ...Default.args,
    actionLabel: 'Attend Event',
    onAction: () => console.log('Attending'),
  },
}

export const MultipleEvents: Story = {
  args: {
    ...Default.args,
    description: 'You have 3 scheduled events today - don\'t miss them!',
    day: 'MONDAY',
    date: 'Apr 1',
    event: {
      title: 'Product Launch Event',
      location: 'Grand Hall',
      time: '6:00pm',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    },
  },
}

