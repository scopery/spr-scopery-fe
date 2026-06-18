import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './Progress';

const meta = {
  title: 'Atoms/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress value',
    },
    max: {
      control: 'number',
      description: 'Maximum value',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Progress bar size',
    },
    tone: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'info'],
      description: 'Progress bar tone',
    },
    showValue: {
      control: 'boolean',
      description: 'Show percentage value',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate state',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 50,
  },
};

export const WithValue: Story = {
  args: {
    value: 75,
    showValue: true,
  },
};

export const Primary: Story = {
  args: {
    value: 60,
    tone: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    value: 60,
    tone: 'secondary',
  },
};

export const Success: Story = {
  args: {
    value: 100,
    tone: 'success',
    showValue: true,
  },
};

export const Warning: Story = {
  args: {
    value: 70,
    tone: 'warning',
  },
};

export const Error: Story = {
  args: {
    value: 30,
    tone: 'error',
  },
};

export const Info: Story = {
  args: {
    value: 45,
    tone: 'info',
  },
};

export const Small: Story = {
  args: {
    value: 50,
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    value: 50,
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    value: 50,
    size: 'lg',
  },
};

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    tone: 'success',
    showValue: true,
  },
};

export const Empty: Story = {
  args: {
    value: 0,
    showValue: true,
  },
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-col gap-lg" style={{ width: '400px' }}>
      <Progress value={60} tone="primary" showValue />
      <Progress value={60} tone="secondary" showValue />
      <Progress value={60} tone="success" showValue />
      <Progress value={60} tone="warning" showValue />
      <Progress value={60} tone="error" showValue />
      <Progress value={60} tone="info" showValue />
    </div>
  ),
};
