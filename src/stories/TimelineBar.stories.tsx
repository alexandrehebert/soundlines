import { useMemo, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { useExplorer } from '../ExplorerContext.ts'
import { TimelineBar } from '../components/timeline/TimelineBar.tsx'
import { offscreenIndicators, positionTimeline, type BarPosition } from '../components/timeline/geometry.ts'
import rawGraph from '../data/graph.json'
import { buildIndex } from '../graph/graph.ts'
import { DEFAULT_START_YEAR, MAX_YEAR, TIMELINE_PADDING, revealEraRange, type TimeScale } from '../graph/layout.ts'
import { createTimelineModel, type TimelineView } from '../graph/timeline.ts'
import type { MusicGraph } from '../graph/types.ts'

const scale: TimeScale = { start: DEFAULT_START_YEAR, end: MAX_YEAR, width: 720, padding: TIMELINE_PADDING }
const index = buildIndex(rawGraph as MusicGraph)

function exampleBar(view: TimelineView, id: string): BarPosition {
  const model = createTimelineModel(index, view)
  const bar = positionTimeline(model.lanes, scale).bars.find((candidate) => candidate.node.id === id)
  if (!bar) throw new Error(`Missing timeline story node ${id}`)
  return { ...bar, yCenter: 52 }
}

function BarExample(args: ComponentProps<typeof TimelineBar>) {
  const { model, viewRange, selectNode, setViewRange } = useExplorer()
  const activeScale = useMemo(
    () => ({ ...args.scale, start: viewRange[0], end: viewRange[1] }),
    [args.scale, viewRange],
  )
  const bar = useMemo(() => {
    const position = positionTimeline(model.lanes, activeScale).bars
      .find((candidate) => candidate.node.id === args.bar.node.id)
    if (!position) throw new Error(`Missing timeline story node ${args.bar.node.id}`)
    return { ...position, yCenter: 52 }
  }, [model, activeScale, args.bar.node.id])
  const indicator = useMemo(
    () => offscreenIndicators([bar], activeScale.width).get(bar.node.id),
    [bar, activeScale.width],
  )

  return (
    <svg viewBox={`0 0 ${activeScale.width} 104`} className="block w-full max-w-[720px]">
      <TimelineBar {...args} bar={bar} scale={activeScale} indicator={indicator} onSelect={(id, revealYear) => {
        args.onSelect(id, revealYear)
        selectNode(id)
        if (revealYear !== undefined) setViewRange((range) => revealEraRange(range, revealYear))
      }} />
    </svg>
  )
}

const meta = {
  title: 'Visualizations/Timeline bar',
  component: TimelineBar,
  decorators: [withExplorer],
  args: {
    bar: exampleBar('genre', 'genre:house'),
    scale,
    dimmed: false,
    onHover: fn(),
    onSelect: fn(),
  },
  argTypes: {
    bar: { control: false },
    scale: { control: false },
    indicator: { control: false },
    rowBars: { control: false },
    onHover: { control: false },
    onSelect: { control: false },
  },
  render: (args) => <BarExample {...args} />,
} satisfies Meta<typeof TimelineBar>

export default meta
type Story = StoryObj<typeof meta>

export const WithProminence: Story = {}

export const Selected: Story = {
  parameters: { explorer: { initialSelectedId: 'genre:house' } },
}

export const Dimmed: Story = { args: { dimmed: true } }

export const UnannotatedArtist: Story = {
  args: { bar: exampleBar('artist', 'artist:miles-davis') },
  parameters: { explorer: { initialView: 'artist' } },
}

export const OffscreenIndicator: Story = {
  args: { bar: exampleBar('genre', 'genre:baroque') },
}
