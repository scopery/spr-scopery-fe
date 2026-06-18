import type { Meta, StoryObj } from '@storybook/react';
import { Link } from './Link';

const meta = {
  title: 'Atoms/Link',
  component: Link,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'muted', 'underline'],
      description: 'Link variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Link size',
    },
    external: {
      control: 'boolean',
      description: 'External link (opens in new tab)',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the link is disabled',
    },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    href: '#',
    children: 'Default Link',
  },
};

export const Primary: Story = {
  args: {
    href: '#',
    children: 'Primary Link',
    variant: 'primary',
  },
};

export const Muted: Story = {
  args: {
    href: '#',
    children: 'Muted Link',
    variant: 'muted',
  },
};

export const Underline: Story = {
  args: {
    href: '#',
    children: 'Underlined Link',
    variant: 'underline',
  },
};

export const External: Story = {
  args: {
    href: 'https://example.com',
    children: 'External Link',
    external: true,
  },
};

export const Disabled: Story = {
  args: {
    href: '#',
    children: 'Disabled Link',
    disabled: true,
  },
};

export const Small: Story = {
  args: {
    href: '#',
    children: 'Small Link',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    href: '#',
    children: 'Medium Link',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    href: '#',
    children: 'Large Link',
    size: 'lg',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-md">
      <Link href="#" variant="default">
        Default Link
      </Link>
      <Link href="#" variant="primary">
        Primary Link
      </Link>
      <Link href="#" variant="muted">
        Muted Link
      </Link>
      <Link href="#" variant="underline">
        Underlined Link
      </Link>
    </div>
  ),
};

