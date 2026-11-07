import type { Meta, StoryObj } from '@storybook/react-vite'
import { VinylRecord } from '../components/VinylRecord.tsx'

const meta = {
  title: 'Components/Vinyl record',
  component: VinylRecord,
  tags: ['autodocs'],
  args: { rotate: -16 },
  decorators: [(Story) => <div className="discovery" style={{ minHeight: 0, padding: '3rem', width: 'min(100%, 28rem)' }}><div className="discovery-record-perspective" aria-hidden="true"><Story /></div></div>],
} satisfies Meta<typeof VinylRecord>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Rotated: Story = { args: { rotate: 45 } }
