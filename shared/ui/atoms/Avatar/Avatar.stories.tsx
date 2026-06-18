import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta = {
  title: 'Atoms/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Avatar size',
    },
    shape: {
      control: 'select',
      options: ['circle', 'square'],
      description: 'Avatar shape',
    },
    status: {
      control: 'select',
      options: ['online', 'offline', 'away', 'busy'],
      description: 'Status indicator',
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fallback: 'JD',
  },
};

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=1',
    alt: 'John Doe',
  },
};

export const WithFallback: Story = {
  args: {
    fallback: 'AB',
    alt: 'Alice Brown',
  },
};

export const Online: Story = {
  args: {
    fallback: 'JD',
    status: 'online',
  },
};

export const Offline: Story = {
  args: {
    fallback: 'JD',
    status: 'offline',
  },
};

export const Away: Story = {
  args: {
    fallback: 'JD',
    status: 'away',
  },
};

export const Busy: Story = {
  args: {
    fallback: 'JD',
    status: 'busy',
  },
};

export const Square: Story = {
  args: {
    fallback: 'AB',
    shape: 'square',
  },
};

export const ExtraSmall: Story = {
  args: {
    fallback: 'XS',
    size: 'xs',
  },
};

export const Small: Story = {
  args: {
    fallback: 'SM',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    fallback: 'MD',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    fallback: 'LG',
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    fallback: 'XL',
    size: 'xl',
  },
};

export const TwoExtraLarge: Story = {
  args: {
    fallback: '2X',
    size: '2xl',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-md">
      <Avatar size="xs" fallback="XS" />
      <Avatar size="sm" fallback="SM" />
      <Avatar size="md" fallback="MD" />
      <Avatar size="lg" fallback="LG" />
      <Avatar size="xl" fallback="XL" />
      <Avatar size="2xl" fallback="2X" />
    </div>
  ),
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-md">
      <Avatar fallback="ON" status="online" />
      <Avatar fallback="OF" status="offline" />
      <Avatar fallback="AW" status="away" />
      <Avatar fallback="BS" status="busy" />
    </div>
  ),
};

