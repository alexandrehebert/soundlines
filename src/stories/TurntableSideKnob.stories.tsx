import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { TurntableSideKnob } from '../components/TurntableSideKnob.tsx'
import { useColorTheme } from '../useColorTheme.ts'

const meta = {
  title: 'Controls/Turntable side knob',
  component: TurntableSideKnob,
  tags: ['autodocs'],
  args: { theme: 'dark', onClick: () => {} },
  decorators: [(Story) => <div className="discovery" style={{ minHeight: 0, padding: '2rem', width: 'fit-content' }}><Story /></div>],
  render: function InteractiveKnob() {
    const { theme, toggleTheme } = useColorTheme()
    return <TurntableSideKnob theme={theme} onClick={toggleTheme} />
  },
} satisfies Meta<typeof TurntableSideKnob>
export default meta
type Story = StoryObj<typeof meta>
export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    const previous = button.getAttribute('aria-pressed')
    await userEvent.click(button)
    await waitFor(() => expect(button.getAttribute('aria-pressed')).not.toBe(previous))
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(button.getAttribute('aria-pressed')).toBe(previous))
  },
}
