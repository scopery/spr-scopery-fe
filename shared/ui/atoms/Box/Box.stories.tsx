import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';

const meta = {
  title: 'Atoms/Box',
  component: Box,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    display: {
      control: 'select',
      options: ['block', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid'],
      description: 'Display type',
    },
    padding: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Padding on all sides',
    },
    paddingX: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Horizontal padding',
    },
    paddingY: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Vertical padding',
    },
    radius: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'],
      description: 'Border radius',
    },
    shadow: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Box shadow',
    },
    background: {
      control: 'select',
      options: ['transparent', 'white', 'neutral-50', 'neutral-100', 'neutral-900', 'primary'],
      description: 'Background color',
    },
    borderWidth: {
      control: 'select',
      options: ['none', '1', '2'],
      description: 'Border width',
    },
    borderColor: {
      control: 'select',
      options: ['none', 'neutral-200', 'neutral-300', 'primary'],
      description: 'Border color',
    },
  },
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Box content',
    padding: 'md',
  },
};

export const WithShadow: Story = {
  args: {
    children: 'Box with shadow',
    padding: 'lg',
    shadow: 'md',
    radius: 'md',
    background: 'white',
  },
};

export const WithBorder: Story = {
  args: {
    children: 'Box with border',
    padding: 'md',
    borderWidth: '1',
    borderColor: 'neutral-200',
    radius: 'md',
  },
};

export const Card: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-bold mb-2">Card Title</h3>
        <p>This is a card-like box with shadow and padding.</p>
      </div>
    ),
    padding: 'lg',
    shadow: 'lg',
    radius: 'lg',
    background: 'white',
  },
};

export const FlexContainer: Story = {
  args: {
    display: 'flex',
    padding: 'md',
    children: (
      <>
        <div className="p-sm bg-primary text-white rounded">Item 1</div>
        <div className="p-sm bg-primary text-white rounded">Item 2</div>
        <div className="p-sm bg-primary text-white rounded">Item 3</div>
      </>
    ),
  },
};

export const ColoredBackground: Story = {
  args: {
    children: 'Box with colored background',
    padding: 'xl',
    background: 'primary',
    radius: 'md',
  },
};

export const RoundedFull: Story = {
  args: {
    children: '🎯',
    padding: 'lg',
    radius: 'full',
    background: 'neutral-100',
    display: 'inline-flex',
  },
};

export const LargeShadow: Story = {
  args: {
    children: 'Box with large shadow',
    padding: 'xl',
    shadow: 'xl',
    radius: 'lg',
    background: 'white',
  },
};

export const CustomPadding: Story = {
  args: {
    children: 'Custom horizontal and vertical padding',
    paddingX: 'xl',
    paddingY: 'sm',
    background: 'neutral-50',
    radius: 'md',
  },
};

export const AsSection: Story = {
  args: {
    as: 'section',
    children: 'Box rendered as section element',
    padding: 'lg',
    background: 'neutral-50',
    borderWidth: '1',
    borderColor: 'neutral-200',
  },
};

