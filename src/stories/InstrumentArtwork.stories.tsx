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

const revisedInstruments = new Set([
  'algerian-mandole', 'cello', 'charango', 'double-bass', 'hichiriki', 'lute',
  'pedal-steel-guitar', 'sarod', 'sitar', 'tanpura', 'tb-303', 'tr-909', 'viola',
  'auto-tune', 'bassoon', 'conga', 'harmonium', 'juno-106', 'minimoog', 'piccolo',
  'saxophone', 'vibraphone', 'violin',
  'bass-drum', 'celesta', 'cuban-tres', 'cuica', 'dominican-tambora', 'erhu',
  'kayamb', 'kora', 'maravann', 'ney', 'rouler', 'sabar', 'sheng',
  'taiko', 'viola-da-gamba', 'yueqin',
  'euphonium', 'french-horn', 'trombone', 'trumpet', 'tuba',
])

const comparisonInstruments = instruments.filter(({ id }) => revisedInstruments.has(id.slice('instrument:'.length)))
const comparisonVariants = [variants[1], variants[2], variants[0], {
  label: 'Icon', folder: 'instrument-icons', width: 24, height: 24, className: 'w-6',
}] as const
const versions = [
  { label: 'Previous', prefix: './instrument-artwork-v1/' },
  { label: 'Revised', prefix: './' },
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

export const BeforeAndAfter: Story = {
  name: 'Before & after',
  render: () => (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-200 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-xl font-bold">Instrument artwork: before &amp; after</h1>
        <p className="mt-2 text-sm text-slate-300">
          Compare the original and revised artwork for {comparisonInstruments.length} instruments at each size.
        </p>
        <nav aria-label="Jump to an instrument" className="mt-4">
          <ul className="flex flex-wrap gap-2">
            {comparisonInstruments.map(({ id, name }) => (
              <li key={id}>
                <a href={`#${id}`} className="block rounded-md border border-slate-700 px-2 py-1 text-sm hover:bg-slate-800">
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 space-y-4">
          {comparisonInstruments.map(({ id, name }) => {
            const file = `${encodeURIComponent(id.slice('instrument:'.length))}.svg`

            return (
              <section key={id} id={id} aria-labelledby={`${id}-title`} className="rounded-xl border border-slate-800 p-3 sm:p-4">
                <h2 id={`${id}-title`} className="mb-3 font-semibold">{name}</h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-5">
                  {versions.map(({ label: version, prefix }) => (
                    <div key={version} className="min-w-0 space-y-3">
                      <h3 className="text-sm font-medium text-slate-300">{version}</h3>
                      {comparisonVariants.map(({ label, folder, width, height, className }) => {
                        const src = `${prefix}${folder}/${file}`

                        return (
                          <figure key={folder}>
                            <div className="rounded-md border border-slate-800 bg-slate-900">
                              {folder === 'instrument-icons' ? (
                                <span
                                  role="img"
                                  aria-label={`${version} ${name} icon`}
                                  className="m-2 block size-6 bg-current"
                                  style={{ mask: `url("${src}") center / contain no-repeat` }}
                                />
                              ) : (
                                <img
                                  src={src}
                                  alt={`${version} ${name} ${label.toLowerCase()}`}
                                  width={width}
                                  height={height}
                                  loading="lazy"
                                  className={`h-auto rounded-md ${className}`}
                                />
                              )}
                            </div>
                            <figcaption className="mt-1 text-xs text-slate-400">{label}</figcaption>
                          </figure>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  ),
}
