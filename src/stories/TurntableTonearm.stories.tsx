import type { Meta, StoryObj } from '@storybook/react-vite'
import { TurntableTonearm } from '../design-system/playback/TurntableTonearm.tsx'
import '../design-system/home/Home.css'

const meta = {
  title: 'Playback/Turntable/Tonearm',
  id: 'playback-turntable-tonearm',
  component: TurntableTonearm,
  tags: ['autodocs'],
  decorators: [(Story) => (
    <div className="discovery" style={{ minHeight: 0 }}>
      <div className="discovery-record" data-tonearm style={{ width: 320, height: 320 }}>
        <Story />
      </div>
    </div>
  )],
  args: { active: false },
} satisfies Meta<typeof TurntableTonearm>

export default meta
type Story = StoryObj<typeof meta>

export const AtRest: Story = {}
export const Engaged: Story = { args: { active: true } }
