import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular'],
      description: 'Skeleton variant',
    },
    width: {
      control: 'text',
      description: 'Width (number in px or string)',
    },
    height: {
      control: 'text',
      description: 'Height (number in px or string)',
    },
    noAnimation: {
      control: 'boolean',
      description: 'Disable animation',
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    variant: 'text',
    width: '100%',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    width: 40,
    height: 40,
  },
};

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: 300,
    height: 200,
  },
};

export const NoAnimation: Story = {
  args: {
    variant: 'rectangular',
    width: 200,
    height: 100,
    noAnimation: true,
  },
};

export const Avatar: Story = {
  args: {
    variant: 'circular',
    width: 48,
    height: 48,
  },
};

export const Card: Story = {
  render: () => (
    <div style={{ width: '300px' }}>
      <Skeleton variant="rectangular" width="100%" height={200} />
      <div className="mt-md">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  ),
};

export const UserProfile: Story = {
  render: () => (
    <div className="flex items-start gap-md" style={{ width: '400px' }}>
      <Skeleton variant="circular" width={64} height={64} />
      <div className="flex-1">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  ),
};

export const List: Story = {
  render: () => (
    <div style={{ width: '400px' }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-md mb-md">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Article: Story = {
  render: () => (
    <div style={{ width: '600px' }}>
      <Skeleton variant="text" width="70%" height="2em" />
      <Skeleton variant="text" width="50%" />
      <div className="my-lg">
        <Skeleton variant="rectangular" width="100%" height={300} />
      </div>
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
    </div>
  ),
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-md" style={{ width: '600px' }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i}>
          <Skeleton variant="rectangular" width="100%" height={150} />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="60%" />
        </div>
      ))}
    </div>
  ),
};
