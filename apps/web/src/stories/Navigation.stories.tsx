import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { withExplorer } from './withExplorer.tsx'
import { BrandLink } from '../design-system/navigation/BrandLink.tsx'
import { DiscoveryFooter, DiscoveryHeader } from '../design-system/navigation/DiscoveryChrome.tsx'
import { EntryLink, ViewLink } from '../design-system/navigation/ExplorerLinks.tsx'
import { SoundlinesMark } from '../design-system/navigation/SoundlinesMark.tsx'
import { useExplorer } from '../ExplorerContext.ts'

const meta = {
  title: 'Navigation/Discovery',
  decorators: [withExplorer],
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Header: Story = {
  render: () => <div className="discovery"><DiscoveryHeader current="home" /></div>,
}

export const Footer: Story = {
  render: () => <div className="discovery"><DiscoveryFooter current="data" /></div>,
}

export const Brand: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-6 text-slate-200">
      <SoundlinesMark className="size-10" />
      <BrandLink className="inline-flex items-center gap-2 font-bold" href="/" onClick={(event) => event.preventDefault()}>
        Soundlines
      </BrandLink>
    </div>
  ),
}

function ExplorerLinksExample() {
  const { index, selectedId, view } = useExplorer()
  const house = index.nodeById.get('genre:house')
  if (!house) throw new Error('House is missing from the graph fixture')
  return (
    <div className="space-y-2 p-6 text-slate-200">
      <div className="flex gap-4">
        <ViewLink className="underline" view="artist">Artists</ViewLink>
        <EntryLink className="underline" node={house}>House</EntryLink>
      </div>
      <output aria-label="Current explorer selection">{selectedId ?? view}</output>
    </div>
  )
}

export const ExplorerLinks: Story = {
  render: () => <ExplorerLinksExample />,
  play: async ({ canvas, userEvent }) => {
    const house = canvas.getByRole('link', { name: 'House' })
    await expect(house).toHaveAttribute('href', '/en/genres/house')
    await userEvent.click(house)
    await expect(canvas.getByRole('status', { name: 'Current explorer selection' })).toHaveTextContent('genre:house')
  },
}
