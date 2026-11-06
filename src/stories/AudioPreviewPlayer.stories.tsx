import type { Meta, StoryObj } from '@storybook/react-vite'
import { AudioPreviewPlayer } from '../components/AudioPreviewPlayer.tsx'

const meta = {
  title: 'Controls/Audio preview player',
  component: AudioPreviewPlayer,
  tags: ['autodocs'],
  args: {
    url: './genre-previews/jazz.m4a',
    label: 'Jazz preview',
  },
  render: (args) => <AudioPreviewPlayer key={args.url} {...args} />,
} satisfies Meta<typeof AudioPreviewPlayer>

export default meta
type Story = StoryObj<typeof meta>

export const JazzPreview: Story = {}
