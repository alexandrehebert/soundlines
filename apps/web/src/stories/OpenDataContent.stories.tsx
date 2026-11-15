import type { Meta, StoryObj } from '@storybook/react-vite'
import { Network } from 'lucide-react'
import { GraphCardHeader } from '../design-system/open-data/GraphCardHeader.tsx'
import { OpenDataCodeBlock } from '../design-system/open-data/OpenDataCodeBlock.tsx'
import { OpenDataSectionHeading } from '../design-system/open-data/OpenDataSectionHeading.tsx'

const meta = { title: 'Foundations/Open Data content' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const SectionHeading: Story = {
  render: () => <OpenDataSectionHeading id="dataset-heading" title="Dataset" description="Explore the entries, relationships, and sources in Soundlines." />,
}

export const GraphCard: Story = {
  render: () => <GraphCardHeader id="graph-heading" icon={<Network size={18} />} title="Graph model" description="Soundlines represents musical connections as a graph of typed nodes and relationships." />,
}

export const CodeExample: Story = {
  render: () => <OpenDataCodeBlock>{JSON.stringify({ locale: 'en', limit: 10 }, null, 2)}</OpenDataCodeBlock>,
}
