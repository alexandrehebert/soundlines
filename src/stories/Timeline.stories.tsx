import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
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
  parameters: { explorer: { initialOrder: 'oldest-first' } },
}

export const Artists: Story = {
  parameters: { explorer: { initialView: 'artist' } },
}

export const ArtistsOldestFirst: Story = {
  parameters: { explorer: { initialView: 'artist', initialOrder: 'oldest-first' } },
}

export const ArtistOffscreenNavigation: Story = {
  parameters: { explorer: { initialView: 'artist', initialOrder: 'oldest-first' } },
  play: async ({ canvasElement }) => {
    const bar = await within(canvasElement).findByRole('button', {
      name: 'Hildegard of Bingen · off-screen to the left; activate to reveal',
    })
    const indicator = bar.querySelector('[data-offscreen-indicator] > rect')
    if (!indicator) throw new Error('Artist off-screen indicator not found')
    await userEvent.click(indicator)
    await waitFor(() => expect(bar).toHaveAttribute('aria-pressed', 'true'))
    await waitFor(() => expect(bar.querySelector('[data-offscreen-indicator]')).not.toBeInTheDocument())
  },
}

export const Instruments: Story = {
  parameters: { explorer: { initialView: 'instrument' } },
}

export const InstrumentsOldestFirst: Story = {
  parameters: { explorer: { initialView: 'instrument', initialOrder: 'oldest-first' } },
}

export const SelectedInstrument: Story = {
  parameters: { explorer: { initialView: 'instrument', initialSelectedId: 'instrument:tr-808' } },
}

export const SelectedGenre: Story = {
  parameters: { explorer: { initialSelectedId: 'genre:house' } },
}
