import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from './Divider';

const meta = {
  title: 'Atoms/Divider',
  component: Divider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Divider orientation',
    },
    variant: {
      control: 'select',
      options: ['solid', 'dashed', 'dotted'],
      description: 'Visual variant',
    },
    label: {
      control: 'text',
      description: 'Label text (horizontal only)',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Solid: Story = {
  args: {
    variant: 'solid',
  },
};

export const Dashed: Story = {
  args: {
    variant: 'dashed',
  },
};

export const Dotted: Story = {
  args: {
    variant: 'dotted',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'OR',
  },
};

export const WithLabelDashed: Story = {
  args: {
    label: 'OR',
    variant: 'dashed',
  },
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100px', display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
};

export const VerticalDashed: Story = {
  args: {
    orientation: 'vertical',
    variant: 'dashed',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100px', display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
};

export const InContent: Story = {
  render: () => (
    <div className="flex flex-col gap-md" style={{ width: '400px' }}>
      <p>This is some content above the divider.</p>
      <Divider />
      <p>This is some content below the divider.</p>
    </div>
  ),
};

export const WithLabelInContent: Story = {
  render: () => (
    <div className="flex flex-col gap-md" style={{ width: '400px' }}>
      <p>Sign in with your email</p>
      <Divider label="OR" />
      <p>Sign in with social media</p>
    </div>
  ),
};

export const VerticalInContent: Story = {
  render: () => (
    <div className="flex items-center gap-md" style={{ height: '100px' }}>
      <div>Left content</div>
      <Divider orientation="vertical" />
      <div>Right content</div>
    </div>
  ),
};

