import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta = {
  title: 'Atoms/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Textarea size',
    },
    variant: {
      control: 'select',
      options: ['outline', 'filled'],
      description: 'Visual variant',
    },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both'],
      description: 'Resize behavior',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Required field indicator',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width textarea',
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your message...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter description',
  },
};

export const Required: Story = {
  args: {
    label: 'Comments',
    placeholder: 'Enter your comments',
    required: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself',
    helperText: 'Maximum 500 characters',
  },
};

export const WithError: Story = {
  args: {
    label: 'Message',
    placeholder: 'Enter message',
    error: 'Message is required',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Textarea',
    placeholder: 'Cannot edit',
    disabled: true,
    defaultValue: 'This is disabled',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small textarea',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    placeholder: 'Medium textarea',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large textarea',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    placeholder: 'Filled variant',
  },
};

export const NoResize: Story = {
  args: {
    label: 'Fixed size',
    placeholder: 'Cannot resize',
    resize: 'none',
  },
};

export const HorizontalResize: Story = {
  args: {
    label: 'Horizontal resize',
    placeholder: 'Resize horizontally',
    resize: 'horizontal',
  },
};

export const BothResize: Story = {
  args: {
    label: 'Both directions',
    placeholder: 'Resize in both directions',
    resize: 'both',
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Full Width Textarea',
    placeholder: 'This textarea takes full width',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export const CustomRows: Story = {
  args: {
    label: 'Custom rows',
    placeholder: 'This has 10 rows',
    rows: 10,
  },
};

