import type { Meta, StoryObj } from '@storybook/react'
import { AISuggestion } from './AISuggestion'

const meta = {
  title: 'Molecules/AISuggestion',
  component: AISuggestion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title/heading of the suggestion',
    },
    question: {
      control: 'text',
      description: 'Question or suggestion text',
    },
    yesLabel: {
      control: 'text',
      description: 'Label for the "Yes" option',
    },
    noLabel: {
      control: 'text',
      description: 'Label for the "No" option',
    },
    onYes: {
      action: 'yes clicked',
      description: 'Callback when "Yes" is clicked',
    },
    onNo: {
      action: 'no clicked',
      description: 'Callback when "No" is clicked',
    },
    showIcon: {
      control: 'boolean',
      description: 'Show icon next to title',
    },
  },
} satisfies Meta<typeof AISuggestion>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    question: 'Would you like to set this task to High Priority and add a due date for this week?',
    onYes: () => console.log('Yes clicked'),
    onNo: () => console.log('No clicked'),
  },
}

export const CustomTitle: Story = {
  args: {
    title: 'Smart Suggestions',
    question: 'Would you like to set this task to High Priority and add a due date for this week?',
    onYes: () => console.log('Yes clicked'),
    onNo: () => console.log('No clicked'),
  },
}

export const CustomLabels: Story = {
  args: {
    question: 'Would you like to set this task to High Priority and add a due date for this week?',
    yesLabel: 'Accept',
    noLabel: 'Decline',
    onYes: () => console.log('Accept clicked'),
    onNo: () => console.log('Decline clicked'),
  },
}

export const WithoutIcon: Story = {
  args: {
    question: 'Would you like to set this task to High Priority and add a due date for this week?',
    showIcon: false,
    onYes: () => console.log('Yes clicked'),
    onNo: () => console.log('No clicked'),
  },
}

export const OnlyYes: Story = {
  args: {
    question: 'Would you like to set this task to High Priority and add a due date for this week?',
    onYes: () => console.log('Yes clicked'),
  },
}

export const OnlyNo: Story = {
  args: {
    question: 'Would you like to set this task to High Priority and add a due date for this week?',
    onNo: () => console.log('No clicked'),
  },
}

export const LongQuestion: Story = {
  args: {
    question: 'Would you like to set this task to High Priority and add a due date for this week? This will help you stay organized and ensure important tasks are completed on time.',
    onYes: () => console.log('Yes clicked'),
    onNo: () => console.log('No clicked'),
  },
}

