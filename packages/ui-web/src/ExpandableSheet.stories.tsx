import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { ExpandableSheet } from './ExpandableSheet.tsx'

const meta = {
  title: 'Overlays/Expandable sheet',
  component: ExpandableSheet,
  parameters: { layout: 'fullscreen' },
  args: {
    height: 0.8,
    collapsedOffset: 0.55,
    closeLabel: 'Close details',
    expandLabel: 'Expand details',
    collapseLabel: 'Collapse details',
    onClose: fn(),
    children: (expanded) => (
      <div className="px-5 pb-5 text-slate-200">
        <h2 className="font-bold">Entry details</h2>
        {expanded && <p className="mt-2">Sources and related entries</p>}
      </div>
    ),
  },
} satisfies Meta<typeof ExpandableSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1' } },
}

export const Expanded: Story = {
  ...Mobile,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Expand details' }))
    await expect(canvas.getByText('Sources and related entries')).toBeVisible()
  },
}
