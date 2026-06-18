import type { Meta, StoryObj } from '@storybook/react';
import { Typography } from './Typography';

const meta = {
  title: 'Atoms/Typography',
  component: Typography,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'lead', 'large', 'small', 'muted', 'caption', 'overline'],
      description: 'Typography variant',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'],
      description: 'Text size',
    },
    weight: {
      control: 'select',
      options: ['normal', 'medium', 'semibold', 'bold'],
      description: 'Font weight',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
      description: 'Text alignment',
    },
    tone: {
      control: 'select',
      options: ['default', 'muted', 'primary', 'secondary', 'success', 'warning', 'error', 'info'],
      description: 'Text tone',
    },
    truncate: {
      control: 'boolean',
      description: 'Truncate text with ellipsis',
    },
    italic: {
      control: 'boolean',
      description: 'Italic text',
    },
  },
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Heading1: Story = {
  args: {
    variant: 'h1',
    children: 'Heading 1',
  },
};

export const Heading2: Story = {
  args: {
    variant: 'h2',
    children: 'Heading 2',
  },
};

export const Heading3: Story = {
  args: {
    variant: 'h3',
    children: 'Heading 3',
  },
};

export const Heading4: Story = {
  args: {
    variant: 'h4',
    children: 'Heading 4',
  },
};

export const Heading5: Story = {
  args: {
    variant: 'h5',
    children: 'Heading 5',
  },
};

export const Heading6: Story = {
  args: {
    variant: 'h6',
    children: 'Heading 6',
  },
};

export const Body: Story = {
  args: {
    variant: 'body',
    children: 'This is body text. It is used for regular paragraphs and content.',
  },
};

export const Lead: Story = {
  args: {
    variant: 'lead',
    children: 'This is lead text. It is slightly larger and used for introductory paragraphs.',
  },
};

export const Large: Story = {
  args: {
    variant: 'large',
    children: 'This is large text.',
  },
};

export const Small: Story = {
  args: {
    variant: 'small',
    children: 'This is small text.',
  },
};

export const Muted: Story = {
  args: {
    variant: 'muted',
    children: 'This is muted text with reduced emphasis.',
  },
};

export const Caption: Story = {
  args: {
    variant: 'caption',
    children: 'This is caption text for images or figures.',
  },
};

export const Overline: Story = {
  args: {
    variant: 'overline',
    children: 'Overline Text',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary colored text',
    tone: 'primary',
  },
};

export const Success: Story = {
  args: {
    children: 'Success colored text',
    tone: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning colored text',
    tone: 'warning',
  },
};

export const Error: Story = {
  args: {
    children: 'Error colored text',
    tone: 'error',
  },
};

export const Italic: Story = {
  args: {
    children: 'This is italic text',
    italic: true,
  },
};

export const Truncated: Story = {
  args: {
    children: 'This is a very long text that will be truncated with an ellipsis when it exceeds the container width',
    truncate: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '200px' }}>
        <Story />
      </div>
    ),
  ],
};

export const AllHeadings: Story = {
  render: () => (
    <div className="flex flex-col gap-md">
      <Typography variant="h1">Heading 1</Typography>
      <Typography variant="h2">Heading 2</Typography>
      <Typography variant="h3">Heading 3</Typography>
      <Typography variant="h4">Heading 4</Typography>
      <Typography variant="h5">Heading 5</Typography>
      <Typography variant="h6">Heading 6</Typography>
    </div>
  ),
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-col gap-sm">
      <Typography tone="default">Default tone</Typography>
      <Typography tone="muted">Muted tone</Typography>
      <Typography tone="primary">Primary tone</Typography>
      <Typography tone="secondary">Secondary tone</Typography>
      <Typography tone="success">Success tone</Typography>
      <Typography tone="warning">Warning tone</Typography>
      <Typography tone="error">Error tone</Typography>
      <Typography tone="info">Info tone</Typography>
    </div>
  ),
};

