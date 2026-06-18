import type { Meta, StoryObj } from '@storybook/react';
import { Star, ChevronRight, X } from 'lucide-react';
import { Button } from './Button';

const meta = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'glass'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    tone: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error'],
      description: 'Semantic tone for the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the button is in a loading state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width button',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Glass: Story = {
  args: {
    children: 'Glass Button',
    variant: 'glass',
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

// Sizes
export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium Button',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

// Tones
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

// States
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading Button',
    loading: true,
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

// With Icons
export const WithIcon: Story = {
  args: {
    children: 'With Icon',
    icon: <Star size={16} />,
  },
};

export const WithIconRight: Story = {
  args: {
    children: 'With Icon Right',
    iconRight: <ChevronRight size={16} />,
  },
};

export const IconOnly: Story = {
  args: {
    iconOnly: true,
    icon: <X size={16} />,
    'aria-label': 'Close',
  },
};

// Polymorphic
export const AsLink: Story = {
  args: {
    children: 'Link Button',
    as: 'a',
    href: 'https://example.com',
  },
};
