import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { VinylRecord } from '../components/playback/VinylRecord.tsx'

const meta = {
  title: 'Components/Vinyl record',
  component: VinylRecord,
  tags: ['autodocs'],
  args: { rotate: -16 },
  decorators: [(Story) => <div className="discovery" style={{ minHeight: 0, padding: '3rem', width: 'min(100%, 28rem)' }}><div className="discovery-record-perspective" aria-hidden="true"><Story /></div></div>],
} satisfies Meta<typeof VinylRecord>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  play: ({ canvasElement }) => {
    const record = canvasElement.querySelector<HTMLElement>('.discovery-record-perspective')
    if (!record) throw new Error('Vinyl record is missing')
    const rootFontSize = Number.parseFloat(getComputedStyle(canvasElement.ownerDocument.documentElement).fontSize)
    expect(getComputedStyle(record).transform).toBe('none')
    expect(record.getBoundingClientRect().width).toBeGreaterThan(0)
    expect(record.getBoundingClientRect().width).toBeLessThanOrEqual(21 * rootFontSize + .5)
  },
}
export const Rotated: Story = { args: { rotate: 45 } }
