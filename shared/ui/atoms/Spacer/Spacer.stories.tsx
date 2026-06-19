import type { Meta, StoryObj } from '@storybook/react'
import { Spacer } from './Spacer'

const meta = {
  title: 'Atoms/Spacer',
  component: Spacer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Spacer size',
    },
    axis: {
      control: 'select',
      options: ['vertical', 'horizontal', 'both'],
      description: 'Spacing axis',
    },
  },
} satisfies Meta<typeof Spacer>

export default meta
type Story = StoryObj<typeof meta>

export const Vertical: Story = {
  render: () => (
    <div>
      <div className="rounded bg-primary p-md text-white">Content Above</div>
      <Spacer size="md" />
      <div className="rounded bg-primary p-md text-white">Content Below</div>
    </div>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <div className="flex">
      <div className="rounded bg-primary p-md text-white">Left</div>
      <Spacer axis="horizontal" size="md" />
      <div className="rounded bg-primary p-md text-white">Right</div>
    </div>
  ),
}

export const SmallVertical: Story = {
  render: () => (
    <div>
      <div className="rounded bg-primary p-md text-white">Content Above</div>
      <Spacer size="sm" />
      <div className="rounded bg-primary p-md text-white">Content Below</div>
    </div>
  ),
}

export const LargeVertical: Story = {
  render: () => (
    <div>
      <div className="rounded bg-primary p-md text-white">Content Above</div>
      <Spacer size="xl" />
      <div className="rounded bg-primary p-md text-white">Content Below</div>
    </div>
  ),
}

export const SmallHorizontal: Story = {
  render: () => (
    <div className="flex">
      <div className="rounded bg-primary p-md text-white">Left</div>
      <Spacer axis="horizontal" size="sm" />
      <div className="rounded bg-primary p-md text-white">Right</div>
    </div>
  ),
}

export const LargeHorizontal: Story = {
  render: () => (
    <div className="flex">
      <div className="rounded bg-primary p-md text-white">Left</div>
      <Spacer axis="horizontal" size="xl" />
      <div className="rounded bg-primary p-md text-white">Right</div>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div>
      <div className="rounded bg-neutral-200 p-sm">XS</div>
      <Spacer size="xs" />
      <div className="rounded bg-neutral-200 p-sm">SM</div>
      <Spacer size="sm" />
      <div className="rounded bg-neutral-200 p-sm">MD</div>
      <Spacer size="md" />
      <div className="rounded bg-neutral-200 p-sm">LG</div>
      <Spacer size="lg" />
      <div className="rounded bg-neutral-200 p-sm">XL</div>
      <Spacer size="xl" />
      <div className="rounded bg-neutral-200 p-sm">2XL</div>
    </div>
  ),
}
