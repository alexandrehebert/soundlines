import type { Meta, StoryObj } from '@storybook/react-vite'
import { withExplorer } from './withExplorer.tsx'
import { ChronologyPreview } from '../design-system/home/ChronologyPreview.tsx'
import '../design-system/home/Home.css'

const meta = {
  title: 'Visualizations/Chronology preview',
  component: ChronologyPreview,
  tags: ['autodocs'],
  decorators: [
    withExplorer,
    (Story) => <div className="discovery" style={{ minHeight: 0, width: 'min(640px, 100%)' }}><Story /></div>,
  ],
  args: { view: 'genre' },
} satisfies Meta<typeof ChronologyPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Genres: Story = {}
export const Artists: Story = { args: { view: 'artist' } }
export const Instruments: Story = { args: { view: 'instrument' } }
export const History: Story = { args: { view: 'history' } }
