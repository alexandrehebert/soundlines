import type { Meta, StoryObj } from '@storybook/react-vite'
import { InstrumentIcon } from '../design-system/explorer/InstrumentIcon.tsx'
import { InstrumentIconCatalog } from './InstrumentIconCatalog.tsx'

const meta = {
  title: 'Foundations/Instrument icon',
  component: InstrumentIcon,
  args: { id: 'instrument:koto', className: 'inline-block size-10 bg-current text-cyan-300' },
} satisfies Meta<typeof InstrumentIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Catalog: Story = {
  parameters: {
    controls: { disable: true },
    docs: { description: { story: 'Browse all instrument icons or narrow the catalogue by family and name.' } },
  },
  render: () => <InstrumentIconCatalog />,
}

export const Koto: Story = {}

export const Accordion: Story = { args: { id: 'instrument:accordion' } }
