import type { Meta, StoryObj } from '@storybook/react-vite'
import { TurntableLcd } from '../design-system/playback/TurntableLcd.tsx'
import '../design-system/home/Home.css'

const source = {
  current: {
    readLevels(levels: Float32Array) {
      for (let i = 0; i < levels.length; i++) levels[i] = (levels.length - i) / levels.length
    },
  },
}

const meta = {
  title: 'Playback/Turntable/LCD',
  id: 'playback-turntable-lcd',
  component: TurntableLcd,
  tags: ['autodocs'],
  decorators: [(Story) => (
    <div className="discovery" style={{ minHeight: 0 }}>
      <div style={{ position: 'relative', width: 280, height: 110 }}><Story /></div>
    </div>
  )],
  args: { source, active: false },
  argTypes: { source: { control: false } },
} satisfies Meta<typeof TurntableLcd>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {}
export const Playing: Story = { args: { active: true, playing: true } }
export const Loading: Story = { args: { loading: true } }
