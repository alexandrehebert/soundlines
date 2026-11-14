import type { Meta, StoryObj } from '@storybook/react-vite'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { DatasetStats } from '../components/dataset/DatasetStats.tsx'

const meta = {
  title: 'Overlays/Dataset stats',
  id: 'components-datasetstats',
  component: DatasetStats,
  decorators: [withExplorer],
  args: { onClose: () => {} },
} satisfies Meta<typeof DatasetStats>

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {}
export const Genres: Story = { args: { initialTab: 'genre' } }
export const Artists: Story = { args: { initialTab: 'artist' } }
export const Instruments: Story = { args: { initialTab: 'instrument' } }
export const Links: Story = { args: { initialTab: 'links' } }
