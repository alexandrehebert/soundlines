import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { useExplorer } from '../ExplorerContext.ts'
import { TimelineLinks } from '../design-system/timeline/TimelineLinks.tsx'
import { positionTimeline } from '../design-system/timeline/geometry.ts'
import { lineageHighlight } from '../graph/graph.ts'

function TimelineLinksExample(args: ComponentProps<typeof TimelineLinks>) {
  const { model } = useExplorer()
  const { bars } = positionTimeline(model.lanes, args.scale)
  const sample = bars.filter((bar) => ['genre:soul', 'genre:funk', 'genre:disco'].includes(bar.node.id))
  const barById = new Map(sample.map((bar, row) => [bar.node.id, { ...bar, yCenter: 36 + 48 * row }]))
  const highlighted = lineageHighlight(model.index, 'genre:funk')
  return (
    <svg viewBox={`0 0 ${args.scale.width} 160`} className="block w-full">
      <TimelineLinks {...args} barById={barById} highlightedEdges={highlighted?.edges ?? null} />
      {[...barById.values()].map((bar) => (
        <text key={bar.node.id} x={bar.x1} y={bar.yCenter - 12} fill="currentColor" fontSize={13}>{bar.node.name}</text>
      ))}
    </svg>
  )
}

const meta = {
  title: 'Visualizations/Timeline links',
  component: TimelineLinks,
  tags: ['autodocs'],
  decorators: [withExplorer],
  parameters: { layout: 'fullscreen' },
  args: {
    scale: { start: 1950, end: 1990, width: 720, padding: 24 },
    barById: new Map(),
    highlightedEdges: null,
  },
  render: (args) => <TimelineLinksExample {...args} />,
} satisfies Meta<typeof TimelineLinks>

export default meta
type Story = StoryObj<typeof meta>

export const RelatedGenres: Story = {}
