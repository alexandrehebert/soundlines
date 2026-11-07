import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { TurntablePlayButton } from '../components/TurntablePlayButton.tsx'

const meta = {
  title: 'Controls/Turntable play button',
  component: TurntablePlayButton,
  tags: ['autodocs'],
  args: { label: 'Play loop', playing: false, loading: false },
  decorators: [(Story) => <div className="discovery" style={{ minHeight: 0, padding: '2rem', width: 'fit-content' }}><Story /></div>],
} satisfies Meta<typeof TurntablePlayButton>
export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {}
export const Playing: Story = { args: { playing: true, label: 'Pause loop' } }
export const Loading: Story = { args: { loading: true } }
export const Interactive: Story = {
  render: function InteractiveButton(args) {
    const [playing, setPlaying] = useState(false)
    return <TurntablePlayButton {...args} playing={playing} label={playing ? 'Pause loop' : 'Play loop'} onClick={() => setPlaying((value) => !value)} />
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    await userEvent.keyboard(' ')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  },
}

/** Simulates a slow download without delaying real audio playback. */
export const SlowLoading: Story = {
  render: function SlowLoadingButton(args) {
    const [loading, setLoading] = useState(false)
    const [playing, setPlaying] = useState(false)
    useEffect(() => {
      if (!loading) return
      const timer = window.setTimeout(() => {
        setLoading(false)
        setPlaying(true)
      }, 5000)
      return () => window.clearTimeout(timer)
    }, [loading])
    return <TurntablePlayButton {...args} loading={loading} playing={playing} label={playing ? 'Pause loop' : 'Play loop'} onClick={() => {
      if (playing) setPlaying(false)
      else setLoading(true)
    }} />
  },
}
