import type { Meta, StoryObj } from '@storybook/react-vite'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { Timeline } from '../components/Timeline.tsx'

const meta = {
  title: 'Visualizations/Timeline',
  component: Timeline,
  parameters: { layout: 'fullscreen' },
  decorators: [
    withExplorer,
    (Story) => (
      <div className="w-full overflow-hidden border border-slate-800 bg-slate-950"
        style={{ height: 'min(70vh, 640px)', minHeight: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Timeline>

export default meta
type Story = StoryObj<typeof meta>

export const FamilyGroups: Story = {}

export const OldestFirst: Story = {
  parameters: { explorer: { initialGenreOrder: 'oldest-first' } },
}

export const Artists: Story = {
  parameters: { explorer: { initialView: 'artist' } },
}

export const SelectedGenre: Story = {
  parameters: { explorer: { initialSelectedId: 'genre:house' } },
}
