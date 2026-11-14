import type { Meta, StoryObj } from '@storybook/react-vite'
import { PageLoading } from './PageLoading.tsx'

const meta = {
  title: 'Overlays/Page Loading',
  component: PageLoading,
  parameters: { layout: 'fullscreen' },
  args: { label: 'Loading Soundlines' },
} satisfies Meta<typeof PageLoading>

export default meta
type Story = StoryObj<typeof meta>

export const Opening: Story = {}
