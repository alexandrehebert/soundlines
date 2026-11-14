import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, waitFor } from 'storybook/test'
import { Turntable } from '../components/playback/Turntable.tsx'
import { useColorTheme } from '../useColorTheme.ts'

function InteractiveTurntable() {
  const { theme, toggleTheme } = useColorTheme()
  return <div className="discovery" style={{ minHeight: 0, padding: '1.5rem' }}><Turntable theme={theme} toggleTheme={toggleTheme}><p className="discovery-intro">Drag the vinyl to scratch. Press play to listen, and use Side to change the appearance and record side.</p></Turntable></div>
}

const meta = {
  title: 'Components/Turntable',
  component: Turntable,
  tags: ['autodocs'],
  args: { theme: 'dark', toggleTheme: () => {} },
  parameters: { layout: 'fullscreen' },
  render: () => <InteractiveTurntable />,
} satisfies Meta<typeof Turntable>
export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const knob = canvasElement.querySelector<HTMLButtonElement>('.discovery-turntable-side-toggle')!
    const record = canvasElement.querySelector<HTMLElement>('.discovery-record-perspective')!
    const previous = record.dataset.side
    await fireEvent.click(knob)
    await waitFor(() => expect(record.dataset.side).not.toBe(previous))
    expect(knob.dataset.side).toBe(record.dataset.side)
    await fireEvent.click(knob)
  },
}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
