import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { WidgetNav } from '../design-system/home/WidgetNav.tsx'
import '../design-system/home/Home.css'

const meta = {
  title: 'Controls/Widget navigation',
  component: WidgetNav,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="discovery" style={{ minHeight: 0 }}><Story /></div>],
  args: { nextLabel: 'Next sound', onPrevious: fn(), onNext: fn() },
} satisfies Meta<typeof WidgetNav>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AtFirstItem: Story = {
  args: { previousDisabled: true },
  play: async ({ args, canvas }) => {
    expect(canvas.getByRole('button', { name: 'Previous' })).toBeDisabled()
    await userEvent.tab()
    expect(canvas.getByRole('button', { name: 'Next sound' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(args.onNext).toHaveBeenCalledOnce()
  },
}
