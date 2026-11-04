import type { Meta, StoryObj } from '@storybook/react-vite'
import graph from '../data/graph.json'

const instruments = graph.nodes
  .filter((node) => node.type === 'instrument')
  .sort((a, b) => a.name.localeCompare(b.name))

const variants = [
  { label: 'Avatar', folder: 'instrument-avatars', width: 160, height: 160, className: 'w-20' },
  { label: 'Banner', folder: 'instrument-banners', width: 360, height: 160, className: 'w-full' },
  { label: 'Header background', folder: 'instrument-header-backgrounds', width: 360, height: 120, className: 'w-full' },
] as const

const meta = {
  title: 'Foundations/Instrument artwork',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Catalog: Story = {
  render: () => (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
      <h1 className="mb-5 text-xl font-bold">Instrument artwork</h1>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-4">
        {instruments.map((instrument) => {
          const file = `${encodeURIComponent(instrument.id.slice('instrument:'.length))}.svg`
          return (
            <li key={instrument.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <span
                  aria-hidden="true"
                  className="size-6 shrink-0 bg-current"
                  style={{ mask: `url("./instrument-icons/${file}") center / contain no-repeat` }}
                />
                {instrument.name}
              </h2>
              <div className="grid grid-cols-[5rem_minmax(0,1fr)_minmax(0,1fr)] gap-3">
                {variants.map(({ label, folder, width, height, className }) => (
                  <figure key={folder}>
                    <img
                      src={`./${folder}/${file}`}
                      alt=""
                      width={width}
                      height={height}
                      loading="lazy"
                      className={`h-auto rounded-md border border-slate-800 bg-slate-950 ${className}`}
                    />
                    <figcaption className="mt-1 text-xs text-slate-400">{label}</figcaption>
                  </figure>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  ),
}
