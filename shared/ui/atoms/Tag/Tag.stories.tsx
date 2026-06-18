import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from './Tag';

const meta = {
  title: 'Atoms/Tag',
  component: Tag,
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
      description: 'Tag size',
    },
    tone: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'],
      description: 'Semantic tone',
    },
    removable: {
      control: 'boolean',
      description: 'Show remove button',
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Tag',
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

export const Solid: Story = {
  args: {
    children: 'Solid',
    variant: 'solid',
    tone: 'primary',
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

export const Removable: Story = {
  args: {
    children: 'Removable',
    removable: true,
    onRemove: () => alert('Tag removed'),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-md">
      <Tag variant="solid" tone="primary">
        Solid
      </Tag>
      <Tag variant="outline" tone="primary">
        Outline
      </Tag>
      <Tag variant="soft" tone="primary">
        Soft
      </Tag>
    </div>
  ),
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-md">
      <Tag tone="default">Default</Tag>
      <Tag tone="primary">Primary</Tag>
      <Tag tone="secondary">Secondary</Tag>
      <Tag tone="success">Success</Tag>
      <Tag tone="warning">Warning</Tag>
      <Tag tone="error">Error</Tag>
      <Tag tone="info">Info</Tag>
    </div>
  ),
};

export const TagList: Story = {
  render: () => (
    <div className="flex flex-wrap gap-sm">
      <Tag variant="soft" tone="primary" removable>
        React
      </Tag>
      <Tag variant="soft" tone="primary" removable>
        TypeScript
      </Tag>
      <Tag variant="soft" tone="primary" removable>
        Next.js
      </Tag>
      <Tag variant="soft" tone="primary" removable>
        Tailwind
      </Tag>
    </div>
  ),
};
