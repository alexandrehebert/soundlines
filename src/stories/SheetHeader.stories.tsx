import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SheetHeader } from '../design-system/ui/SheetHeader.tsx'

const meta = {
  title: 'Overlays/Sheet header',
  component: SheetHeader,
  args: {
    closeLabel: 'Close details',
    onClose: fn(),
    children: <h2 className="font-bold text-white">Entry details</h2>,
  },
  decorators: [(Story) => <div className="relative w-full max-w-sm bg-slate-950"><Story /></div>],
} satisfies Meta<typeof SheetHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithExpansionHandle: Story = {
  args: { handleButton: { label: 'Expand details', onClick: fn() } },
}
