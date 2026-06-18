import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'soft'],
      description: 'Visual variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size',
    },
    tone: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'],
      description: 'Semantic tone',
    },
    dot: {
      control: 'boolean',
      description: 'Show dot indicator',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary',
    tone: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    tone: 'secondary',
  },
};

export const Success: Story = {
  args: {
    children: 'Success',
    tone: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning',
    tone: 'warning',
  },
};

export const Error: Story = {
  args: {
    children: 'Error',
    tone: 'error',
  },
};

export const Info: Story = {
  args: {
    children: 'Info',
    tone: 'info',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
    tone: 'primary',
  },
};

export const Soft: Story = {
  args: {
    children: 'Soft',
    variant: 'soft',
    tone: 'primary',
  },
};

export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
};

export const WithDot: Story = {
  args: {
    children: 'Active',
    dot: true,
    tone: 'success',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-md">
      <Badge variant="solid" tone="primary">
        Solid
      </Badge>
      <Badge variant="outline" tone="primary">
        Outline
      </Badge>
      <Badge variant="soft" tone="primary">
        Soft
      </Badge>
    </div>
  ),
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-md">
      <Badge tone="default">Default</Badge>
      <Badge tone="primary">Primary</Badge>
      <Badge tone="secondary">Secondary</Badge>
      <Badge tone="success">Success</Badge>
      <Badge tone="warning">Warning</Badge>
      <Badge tone="error">Error</Badge>
      <Badge tone="info">Info</Badge>
    </div>
  ),
};

