import type { Meta, StoryObj } from '@storybook/react';
import { Spacer } from './Spacer';

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
} satisfies Meta<typeof Spacer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: () => (
    <div>
      <div className="p-md bg-primary text-white rounded">Content Above</div>
      <Spacer size="md" />
      <div className="p-md bg-primary text-white rounded">Content Below</div>
    </div>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <div className="flex">
      <div className="p-md bg-primary text-white rounded">Left</div>
      <Spacer axis="horizontal" size="md" />
      <div className="p-md bg-primary text-white rounded">Right</div>
    </div>
  ),
};

export const SmallVertical: Story = {
  render: () => (
    <div>
      <div className="p-md bg-primary text-white rounded">Content Above</div>
      <Spacer size="sm" />
      <div className="p-md bg-primary text-white rounded">Content Below</div>
    </div>
  ),
};

export const LargeVertical: Story = {
  render: () => (
    <div>
      <div className="p-md bg-primary text-white rounded">Content Above</div>
      <Spacer size="xl" />
      <div className="p-md bg-primary text-white rounded">Content Below</div>
    </div>
  ),
};

export const SmallHorizontal: Story = {
  render: () => (
    <div className="flex">
      <div className="p-md bg-primary text-white rounded">Left</div>
      <Spacer axis="horizontal" size="sm" />
      <div className="p-md bg-primary text-white rounded">Right</div>
    </div>
  ),
};

export const LargeHorizontal: Story = {
  render: () => (
    <div className="flex">
      <div className="p-md bg-primary text-white rounded">Left</div>
      <Spacer axis="horizontal" size="xl" />
      <div className="p-md bg-primary text-white rounded">Right</div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div>
      <div className="p-sm bg-neutral-200 rounded">XS</div>
      <Spacer size="xs" />
      <div className="p-sm bg-neutral-200 rounded">SM</div>
      <Spacer size="sm" />
      <div className="p-sm bg-neutral-200 rounded">MD</div>
      <Spacer size="md" />
      <div className="p-sm bg-neutral-200 rounded">LG</div>
      <Spacer size="lg" />
      <div className="p-sm bg-neutral-200 rounded">XL</div>
      <Spacer size="xl" />
      <div className="p-sm bg-neutral-200 rounded">2XL</div>
    </div>
  ),
};

