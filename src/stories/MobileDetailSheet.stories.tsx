import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { MobileDetailSheet } from '../design-system/explorer/MobileDetailSheet.tsx'

const meta = {
  title: 'Overlays/Mobile detail sheet',
  component: MobileDetailSheet,
  decorators: [withExplorer],
  parameters: { layout: 'fullscreen', explorer: { initialSelectedId: 'instrument:koto' } },
  args: { onClose: fn(), showGenreSample: false },
  globals: { viewport: { value: 'mobile1' } },
} satisfies Meta<typeof MobileDetailSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Instrument: Story = {}
