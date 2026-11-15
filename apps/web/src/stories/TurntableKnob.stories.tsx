import type { Meta, StoryObj } from '@storybook/react-vite'
import { Moon, Pause, Play, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { expect, userEvent, waitFor } from 'storybook/test'
import { TurntableKnob } from '../design-system/playback/TurntableKnob.tsx'
import { useColorTheme } from '../useColorTheme.ts'

const idleArgs = { variant: 'playback', caption: 'Play', label: 'Play loop', pressed: false, icon: <Play size={16} /> } as const

const meta = {
  title: 'Playback/Turntable/Knob',
  id: 'playback-turntable-knob',
  component: TurntableKnob,
  tags: ['autodocs'],
  decorators: [(Story) => (
    <div className="discovery" style={{ minHeight: 0, padding: '2rem', width: 'fit-content' }}><Story /></div>
  )],
} satisfies Meta<typeof TurntableKnob>

export default meta
type Story = StoryObj<typeof TurntableKnob>

const playingArgs = { ...idleArgs, caption: 'Pause', label: 'Pause loop', pressed: true, icon: <Pause size={16} /> }

export const Idle: Story = { args: idleArgs }
export const Playing: Story = { args: playingArgs }
export const Loading: Story = {
  args: { ...idleArgs, loading: true },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Play loop' })
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('aria-busy', 'true')
  },
}

export const InteractivePlayback: Story = {
  args: idleArgs,
  render: function Playback() {
    const [playing, setPlaying] = useState(false)
    return <TurntableKnob {...(playing ? playingArgs : idleArgs)} onClick={() => setPlaying((value) => !value)} />
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Play loop' })
    await userEvent.click(button)
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await userEvent.keyboard(' ')
    await expect(button).toHaveAttribute('aria-pressed', 'false')
  },
}

export const SlowLoading: Story = {
  args: idleArgs,
  render: function Playback() {
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
    return <TurntableKnob {...(playing ? playingArgs : idleArgs)} loading={loading} onClick={() => {
      if (playing) setPlaying(false)
      else setLoading(true)
    }} />
  },
}

const sideA = { variant: 'side', caption: 'Side', label: 'Flip to Side B · Light theme', pressed: false, icon: <Moon size={16} /> } as const
const sideB = { ...sideA, label: 'Flip to Side A · Dark theme', pressed: true, icon: <Sun size={16} /> } as const

export const SideA: Story = { args: sideA }
export const SideB: Story = { args: sideB }

export const InteractiveSide: Story = {
  args: sideA,
  render: function Side() {
    const { theme, toggleTheme } = useColorTheme()
    return <TurntableKnob {...(theme === 'light' ? sideB : sideA)} onClick={toggleTheme} />
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button')
    const previous = button.getAttribute('aria-pressed')
    await userEvent.click(button)
    await waitFor(() => expect(button).not.toHaveAttribute('aria-pressed', previous))
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', previous))
  },
}
