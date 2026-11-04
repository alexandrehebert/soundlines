import type { Meta, StoryObj } from '@storybook/react-vite'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { DetailPanel } from '../components/DetailPanel.tsx'

type DetailPanelProps = NonNullable<Parameters<typeof DetailPanel>[0]>

const meta = {
  title: 'Components/Detail panel',
  component: DetailPanel,
  decorators: [
    withExplorer,
    (Story) => (
      <div className="h-[640px] w-full max-w-[360px] overflow-hidden border border-slate-800">
        <Story />
      </div>
    ),
  ],
  argTypes: { onClose: { control: false } },
} satisfies Meta<DetailPanelProps>

export default meta
type Story = StoryObj<DetailPanelProps>

export const GenreWithPhases: Story = {
  parameters: { explorer: { initialSelectedId: 'genre:house' } },
}

export const ArtistWithCareerPhases: Story = {
  parameters: { explorer: { initialSelectedId: 'artist:kraftwerk' } },
}

export const Label: Story = {
  parameters: { explorer: { initialSelectedId: 'label:trax' } },
}

export const KotoWithHeaderArtwork: Story = {
  parameters: { explorer: { initialSelectedId: 'instrument:koto' } },
}

export const MinimoogWithHeaderArtwork: Story = {
  parameters: { explorer: { initialSelectedId: 'instrument:minimoog' } },
}

export const AccordionWithHeaderArtwork: Story = {
  parameters: { explorer: { initialSelectedId: 'instrument:accordion' } },
}

export const BandoneonWithHeaderArtwork: Story = {
  parameters: { explorer: { initialSelectedId: 'instrument:bandoneon' } },
}

export const TriangleWithHeaderArtwork: Story = {
  parameters: { explorer: { initialSelectedId: 'instrument:triangle' } },
}
