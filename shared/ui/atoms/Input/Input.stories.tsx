import type { Meta, StoryObj } from '@storybook/react';
import { Mail, Lock, Eye } from 'lucide-react';
import { Input } from './Input';

const meta = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Input size',
    },
    variant: {
      control: 'select',
      options: ['outline', 'filled'],
      description: 'Visual variant',
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'Input state',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Required field indicator',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width input',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

export const EmailWithIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    type: 'email',
    prefix: <Mail className="w-full h-full" />,
  },
};

export const PasswordWithIcons: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    prefix: <Lock className="w-full h-full" />,
    postfix: <Eye className="w-full h-full" />,
  },
};

export const Required: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    required: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    helperText: 'Must be at least 8 characters',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    type: 'email',
    error: 'Please enter a valid email address',
  },
};

export const Success: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    state: 'success',
    defaultValue: 'johndoe',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
    defaultValue: 'Disabled value',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Small Input',
    placeholder: 'Small input',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Medium Input',
    placeholder: 'Medium input',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Large Input',
    placeholder: 'Large input',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    label: 'Filled Variant',
    placeholder: 'Filled variant',
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Full Width Input',
    placeholder: 'This input takes full width',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export const CompleteExample: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    type: 'email',
    prefix: <Mail className="w-full h-full" />,
    helperText: 'We will never share your email with anyone else',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

