import type { Meta, StoryObj } from '@storybook/react-vite'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { Jukebox } from '../design-system/playback/Jukebox.tsx'
import '../design-system/home/Home.css'

const meta = {
  title: 'Screens/Jukebox',
  component: Jukebox,
  decorators: [withExplorer],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Jukebox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
