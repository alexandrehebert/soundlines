import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useState, type ComponentProps, type CSSProperties } from 'react'
import { PreviewButton } from '../../../mobile-web/src/design-system/audio/PreviewButton.tsx'
import { PreviewAvailability } from '../../../mobile-web/src/design-system/audio/PreviewAvailability.tsx'
import mobileStyles from '../../../mobile-web/src/styles.css?inline'

const meta = {
  title: 'Screens/Mobile Preview',
  component: PreviewButton,
  args: { genre: 'Disco', state: 'ready', progress: 0, onPress: () => {} },
  decorators: [(Story) => (
    <>
      <style>{mobileStyles}</style>
      <div style={{ width: 'min(272px, 100%)', '--accent': '#bca0f5' } as CSSProperties}><Story /></div>
    </>
  )],
} satisfies Meta<typeof PreviewButton>

export default meta
type Story = StoryObj<typeof meta>

function PreviewDemo(props: ComponentProps<typeof PreviewButton>) {
  const [state, setState] = useState(props.state)
  return (
    <>
      <PreviewButton {...props} state={state} onPress={() => setState(state === 'playing' ? 'ready' : 'loading')} />
      <button type="button" onClick={() => setState('playing')}>Simulate audio ready</button>
    </>
  )
}

export const Loading: Story = { args: { state: 'loading' } }
export const Playing: Story = { args: { state: 'playing', progress: 0.45 } }
export const Retry: Story = { args: { state: 'error' } }

export const CheckingAvailability: Story = { render: () => <PreviewAvailability checking /> }
export const NoPreview: Story = { render: () => <PreviewAvailability checking={false} /> }

export const Playback: Story = {
  render: (args) => <PreviewDemo {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Play preview for Disco' })
    const motionAllowed = window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    const shimmer = () => window.getComputedStyle(button, '::after')
    const dimensions = () => {
      const { width, height } = button.getBoundingClientRect()
      const label = button.querySelector('strong')!
      const { x, y } = label.getBoundingClientRect()
      return { width, height, x, y }
    }
    const ready = dimensions()
    await userEvent.click(button)
    const loader = button.querySelector('.listen-loader')!
    await expect(getComputedStyle(loader).opacity).toBe('0')
    await expect(button).toHaveAccessibleName('Loading audio for Disco')
    await expect(button).toHaveFocus()
    await expect(dimensions()).toEqual(ready)
    for (const label of button.querySelectorAll('strong')) {
      await expect(getComputedStyle(label).opacity).toBe('0')
    }
    await waitFor(() => expect(getComputedStyle(loader).opacity).toBe('1'))
    await userEvent.click(canvas.getByRole('button', { name: 'Simulate audio ready' }))
    await expect(button.querySelector('.listen-loader')).toBeNull()
    await expect(button).toHaveAccessibleName('Pause preview for Disco')
    await expect(dimensions()).toEqual(ready)
    await expect(shimmer().animationName).toBe(motionAllowed ? 'preview-shimmer' : 'none')
    if (motionAllowed) await expect(shimmer().animationPlayState).toBe('running')
    else await expect(shimmer().opacity).toBe('1')

    await userEvent.click(button)
    await expect(button).toHaveAccessibleName('Play preview for Disco')
    if (motionAllowed) await expect(shimmer().animationPlayState).toBe('paused')
    else await expect(shimmer().opacity).toBe('0')
  },
}
