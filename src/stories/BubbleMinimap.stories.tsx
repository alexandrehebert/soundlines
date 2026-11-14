import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef } from 'react'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { BubbleMinimap } from '../design-system/bubbles/BubbleMinimap.tsx'
import { useExplorer } from '../ExplorerContext.ts'
import { layoutGenreBubbles } from '../graph/bubbles.ts'
import { chartColor, FAMILY_COLORS } from '../theme.ts'

function Example() {
  const { index, selectedId } = useExplorer()
  const layout = layoutGenreBubbles(index)
  const surface = useRef<HTMLDivElement>(null)
  return (
    <div className="flex w-full max-w-xl items-end gap-4">
      <div ref={surface} className="h-64 flex-1 overflow-auto rounded-md border border-slate-800">
        <svg width={layout.width} height={layout.height} className="max-w-none" aria-hidden="true">
          {layout.bubbles.map(({ node, x, y, diameter, family }) => (
            <circle key={node.id} cx={x} cy={y} r={diameter / 2} fill={chartColor(FAMILY_COLORS[family])} />
          ))}
        </svg>
      </div>
      <div className="w-40">
        <BubbleMinimap layout={layout} surfaceRef={surface} links={[]} distances={null} zoom={1} selectedId={selectedId} />
      </div>
    </div>
  )
}

const meta = {
  title: 'Visualizations/Bubble minimap',
  component: Example,
  decorators: [withExplorer],
} satisfies Meta<typeof Example>

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {}

export const WithSelection: Story = {
  parameters: { explorer: { initialSelectedId: 'genre:house' } },
}
