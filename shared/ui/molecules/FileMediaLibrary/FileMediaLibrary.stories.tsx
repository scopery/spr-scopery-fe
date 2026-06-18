import type { Meta, StoryObj } from '@storybook/react'
import { FileMediaLibrary } from './FileMediaLibrary'

const meta = {
  title: 'Molecules/FileMediaLibrary',
  component: FileMediaLibrary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title of the file library',
    },
    folder: {
      control: 'object',
      description: 'Folder information',
    },
    actionLabel: {
      control: 'text',
      description: 'Action button text',
    },
    onAdd: {
      action: 'add clicked',
      description: 'Callback when add button is clicked',
    },
    onShare: {
      action: 'share clicked',
      description: 'Callback when share button is clicked',
    },
    onAction: {
      action: 'action clicked',
      description: 'Callback when action button is clicked',
    },
    onPrevious: {
      action: 'previous clicked',
      description: 'Callback when previous navigation is clicked',
    },
    onNext: {
      action: 'next clicked',
      description: 'Callback when next navigation is clicked',
    },
  },
} satisfies Meta<typeof FileMediaLibrary>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    folder: {
      name: 'Visual Vault',
      fileCount: 362,
      description: 'A curated collection of all creative essentials - images, photos, icons, and visual elements. Everything visual lives here.',
      previewImages: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
        'https://images.unsplash.com/photo-1534361960057-19889c4d8d90?w=300',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300',
      ],
    },
    onAdd: () => console.log('Add clicked'),
    onShare: () => console.log('Share clicked'),
    onAction: () => console.log('Open clicked'),
    onPrevious: () => console.log('Previous clicked'),
    onNext: () => console.log('Next clicked'),
  },
}

export const WithoutPreviewImages: Story = {
  args: {
    folder: {
      name: 'Empty Folder',
      fileCount: 0,
      description: 'This folder is empty. Add some files to get started.',
    },
    onAdd: () => console.log('Add clicked'),
    onAction: () => console.log('Open clicked'),
  },
}

export const WithoutDescription: Story = {
  args: {
    folder: {
      name: 'Project Assets',
      fileCount: 125,
      previewImages: [
        'https://images.unsplash.com/photo-1511578314322-379afb476865?w=300',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300',
      ],
    },
    onAction: () => console.log('Open clicked'),
  },
}

export const WithoutNavigation: Story = {
  args: {
    folder: {
      name: 'Single Folder',
      fileCount: 50,
      description: 'A simple folder without navigation.',
      previewImages: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      ],
    },
    onAction: () => console.log('Open clicked'),
  },
}

export const CustomActionLabel: Story = {
  args: {
    folder: {
      name: 'My Files',
      fileCount: 200,
      description: 'Personal file collection',
      previewImages: [
        'https://images.unsplash.com/photo-1534361960057-19889c4d8d90?w=300',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300',
        'https://images.unsplash.com/photo-1511578314322-379afb476865?w=300',
      ],
    },
    actionLabel: 'Browse Files',
    onAction: () => console.log('Browse clicked'),
  },
}

export const LargeFileCount: Story = {
  args: {
    folder: {
      name: 'Media Library',
      fileCount: 15234,
      description: 'Extensive collection of media files',
      previewImages: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
        'https://images.unsplash.com/photo-1534361960057-19889c4d8d90?w=300',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300',
      ],
    },
    onAction: () => console.log('Open clicked'),
  },
}

