import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  FAMILY_LABELS, FAMILY_ORDER, INSTRUMENT_FAMILY_ORDER, NODE_TYPE_LABELS, type LaneFamily, type NodeType,
} from '../graph/types.ts'
import { FAMILY_COLORS, NODE_TYPE_COLORS } from '../theme.ts'

const meta = {
  title: 'Foundations/Colors',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function FamilySwatches({ title, families }: { title: string; families: readonly LaneFamily[] }) {
  return (
    <section className="max-w-4xl">
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm text-slate-400">Colors used by the timeline and influence map.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {families.map((family) => (
          <div key={family} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
            <span className="h-10 w-10 shrink-0 rounded-lg" style={{ backgroundColor: FAMILY_COLORS[family] }} />
            <div>
              <div className="text-sm font-semibold text-slate-100">{FAMILY_LABELS[family]}</div>
              <div className="font-mono text-xs text-slate-400">{FAMILY_COLORS[family]}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export const GenreFamilies: Story = {
  render: () => <FamilySwatches title="Genre families" families={FAMILY_ORDER} />,
}

export const InstrumentFamilies: Story = {
  render: () => <FamilySwatches title="Instrument families" families={INSTRUMENT_FAMILY_ORDER} />,
}

export const NodeTypes: Story = {
  render: () => (
    <section className="max-w-4xl">
      <h1 className="text-xl font-bold text-white">Node types</h1>
      <p className="mt-2 text-sm text-slate-400">Accent colors used in search and details.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(NODE_TYPE_COLORS) as NodeType[]).map((type) => (
          <div key={type} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
            <span className="h-10 w-10 shrink-0 rounded-lg" style={{ backgroundColor: NODE_TYPE_COLORS[type] }} />
            <div>
              <div className="text-sm font-semibold text-slate-100">{NODE_TYPE_LABELS[type]}</div>
              <div className="font-mono text-xs text-slate-400">{NODE_TYPE_COLORS[type]}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  ),
}
