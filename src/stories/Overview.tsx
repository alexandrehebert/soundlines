import { ArrowUpRight } from 'lucide-react'
import { publicAsset } from '../publicAsset.ts'
import './Overview.css'

const sections = [
  {
    title: 'Foundations',
    links: [
      ['Genre family colors', 'foundations-colors--genre-families'],
      ['Instrument artwork', 'foundations-instrument-artwork--catalog'],
    ],
  },
  {
    title: 'Controls',
    links: [['Segmented control', 'controls-segmented-control--keyboard-selection']],
  },
  {
    title: 'Overlays',
    links: [
      ['Mobile modal panel', 'overlays-modal-panel--mobile'],
      ['Entry details', 'screens-explorer--mobile-details'],
    ],
  },
  {
    title: 'Visualizations',
    links: [['Genre timeline', 'visualizations-timeline--family-groups']],
  },
  {
    title: 'Playback',
    links: [
      ['Jazz preview', 'controls-audio-preview-player--jazz-preview'],
      ['Interactive turntable', 'components-turntable--interactive'],
    ],
  },
  {
    title: 'Screens',
    links: [
      ['Landing page', 'screens-home--default'],
      ['Explorer', 'screens-explorer--genres'],
    ],
  },
] as const

export function Overview() {
  return (
    <div className="styleguide-overview">
      <header className="styleguide-overview-hero">
        <div>
          <h1>Soundlines styleguide</h1>
          <p>Explore the colors, controls, and screens behind the interactive atlas of musical lineages.</p>
        </div>
        <img src={publicAsset('/favicon.svg')} alt="" width={112} height={112} />
      </header>
      <nav aria-label="Styleguide sections" className="styleguide-overview-sections">
        {sections.map(({ title, links }) => (
          <section key={title}>
            <h2>{title}</h2>
            <ul>
              {links.map(([label, id]) => (
                <li key={id}>
                  <a href={`./?path=/story/${id}`} target="_top">
                    {label} <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </div>
  )
}
