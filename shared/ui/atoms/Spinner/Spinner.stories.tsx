import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';

const meta = {
  title: 'Atoms/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Spinner size',
    },
    tone: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'],
      description: 'Spinner tone',
    },
    label: {
      control: 'text',
      description: 'Accessible label',
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Primary: Story = {
  args: {
    tone: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    tone: 'secondary',
  },
};

export const Success: Story = {
  args: {
    tone: 'success',
  },
};

export const Warning: Story = {
  args: {
    tone: 'warning',
  },
};

export const Error: Story = {
  args: {
    tone: 'error',
  },
};

export const Info: Story = {
  args: {
    tone: 'info',
  },
};

export const ExtraSmall: Story = {
  args: {
    size: 'xs',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const CustomLabel: Story = {
  args: {
    label: 'Loading content, please wait...',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-lg">
      <Spinner size="xs" />
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  ),
};

export const AllTones: Story = {
  render: () => (
    <div className="flex items-center gap-lg">
      <Spinner tone="default" />
      <Spinner tone="primary" />
      <Spinner tone="secondary" />
      <Spinner tone="success" />
      <Spinner tone="warning" />
      <Spinner tone="error" />
      <Spinner tone="info" />
    </div>
  ),
};

