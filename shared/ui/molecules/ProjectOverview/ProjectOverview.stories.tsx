import type { Meta, StoryObj } from '@storybook/react'
import { ProjectOverview } from './ProjectOverview'

const meta = {
  title: 'Molecules/ProjectOverview',
  component: ProjectOverview,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'Title of the project overview' },
    description: { control: 'text', description: 'Description text' },
    badgeText: { control: 'text', description: 'Badge text in the top-right' },
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 }, description: 'Progress ratio (0-1)' },
    steps: { control: 'object', description: 'Timeline steps array' },
    currentStepNote: { control: 'text', description: 'Current step note text' },
    metrics: { control: 'object', description: 'Metrics card values' },
  },
} satisfies Meta<typeof ProjectOverview>

export default meta
type Story = StoryObj<typeof meta>

const defaultSteps = [
  { id: 'elicitation', label: 'ELICITATION', date: 'Feb 12th', position: 0.05, status: 'completed' as const },
  { id: 'planning', label: 'IN PLANING', date: 'Feb 15th', position: 0.32, status: 'completed' as const },
  { id: 'development', label: 'IN DEVELOPMENT', date: 'Feb 15th', position: 0.6, status: 'current' as const },
  { id: 'testing', label: 'TESTING', date: 'Feb 15th', position: 0.78, status: 'upcoming' as const },
  { id: 'delivered', label: 'DELIVERED', date: 'Feb 15th', position: 0.95, status: 'upcoming' as const },
]

export const Default: Story = {
  args: {
    title: 'Project overview',
    description:
      'Design low-fidelity wireframes for the new landing page, ensuring a user-friendly layout and clear content hierarchy.',
    selectOptions: [
      { value: 'it-ticket', label: 'IT Ticket System' },
      { value: 'project-a', label: 'Project A' },
      { value: 'project-b', label: 'Project B' },
    ],
    selectedValue: 'it-ticket',
    progress: 0.65,
    steps: defaultSteps,
    currentStepNote: 'Notes on interactions and responsives, and links to the file or research',
    metrics: {
      failsLabel: 'FAILS',
      failsValue: '0',
      dueLabel: 'DUE',
      dueValue: 'Apr 28th',
    },
  },
}

export const CustomProgress: Story = {
  args: {
    ...Default.args,
    progress: 0.4,
  },
}

export const WithoutMetrics: Story = {
  args: {
    ...Default.args,
    metrics: undefined,
  },
}

export const WithoutBadge: Story = {
  args: {
    ...Default.args,
    badgeText: undefined,
  },
}

