import type { Meta, StoryObj } from '@storybook/react-vite'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { DatasetGraph } from '../design-system/open-data/DatasetGraph.tsx'

const meta = {
  title: 'Visualizations/Dataset graph',
  component: DatasetGraph,
  decorators: [withExplorer],
} satisfies Meta<typeof DatasetGraph>

export default meta
type Story = StoryObj<typeof meta>

export const Examples: Story = {}
