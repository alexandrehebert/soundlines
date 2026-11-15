import type { Meta, StoryObj } from '@storybook/react-vite'
import { BarList, Metric, Section, StackedBar } from '../design-system/dataset/DatasetStatsCharts.tsx'
import { NODE_TYPE_COLORS } from '../theme.ts'

const counts = [
  { key: 'genre', label: 'Genres', count: 120, color: NODE_TYPE_COLORS.genre },
  { key: 'artist', label: 'Artists', count: 75, color: NODE_TYPE_COLORS.artist },
  { key: 'instrument', label: 'Instruments', count: 28, color: NODE_TYPE_COLORS.instrument },
]

const meta = { title: 'Visualizations/Dataset statistics' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const MetricCard: Story = {
  render: () => <Metric label="Entries" value="223" hint="Genres, artists, and instruments" />,
}

export const EntriesByType: Story = {
  render: () => (
    <Section title="Entries by type">
      <StackedBar items={counts} />
      <div className="mt-6"><BarList items={counts} /></div>
    </Section>
  ),
}
