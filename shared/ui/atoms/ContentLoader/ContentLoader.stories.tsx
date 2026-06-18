import type { Meta, StoryObj } from '@storybook/react'
import { ContentLoader } from './ContentLoader'

const meta = {
  title: 'Atoms/ContentLoader',
  component: ContentLoader,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'easeOut'],
      description: 'default = 2x4 pulse; easeOut = 2x3 four-frame ease-out animation',
    },
    animated: {
      control: 'boolean',
      description: 'Show pulse (default variant only)',
    },
    width: {
      control: 'text',
      description: 'Optional width (e.g. 320, "100%")',
    },
    height: {
      control: 'text',
      description: 'Optional height (e.g. 160, "200px")',
    },
  },
} satisfies Meta<typeof ContentLoader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    animated: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
}

export const Static: Story = {
  args: {
    animated: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
}

export const Small: Story = {
  args: {
    animated: true,
    width: 160,
  },
}

export const FullWidth: Story = {
  args: {
    animated: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Story />
      </div>
    ),
  ],
}

export const EaseOut: Story = {
  args: {
    variant: 'easeOut',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
}
