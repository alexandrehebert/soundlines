import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { expect, userEvent, waitFor } from 'storybook/test'
import { Turntable } from '../design-system/playback/Turntable.tsx'

const meta = {
  title: 'Playback/Turntable/Deck',
  id: 'components-turntable',
  component: Turntable,
  tags: ['autodocs'],
  args: { theme: 'dark', toggleTheme: () => {} },
  parameters: { layout: 'padded' },
  render: function Deck(args) {
    const [{ theme }, updateArgs] = useArgs<typeof args>()
    return <Turntable {...args} theme={theme} toggleTheme={() => updateArgs({ theme: theme === 'dark' ? 'light' : 'dark' })} />
  },
} satisfies Meta<typeof Turntable>
export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
  play: async ({ canvas }) => {
    const deck = canvas.getByRole('region', { name: 'Turntable' })
    const side = canvas.getByRole('button', { name: /flip to side/i })
    const initialSide = deck.getAttribute('data-side')
    await userEvent.click(side)
    await waitFor(() => expect(deck).not.toHaveAttribute('data-side', initialSide))
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(deck).toHaveAttribute('data-side', initialSide))
  },
}

export const SideB: Story = { args: { theme: 'light' } }

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvas }) => {
    const deck = canvas.getByRole('region', { name: 'Turntable' })
    await expect(deck.querySelector('.discovery-tonearm')).toBeVisible()
    await expect(deck.querySelector('.discovery-turntable-lcd')).toBeVisible()
  },
}
