import { ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { IndexEntry, StoryIndex } from 'storybook/internal/types'
import { publicAsset } from '../publicAsset.ts'
import './Overview.css'

function catalogueSections({ entries }: StoryIndex) {
  const components = new Map<string, IndexEntry>()
  for (const entry of Object.values(entries)) {
    if (entry.title === 'Overview' || !entry.tags?.includes('dev')) continue

    const current = components.get(entry.title)
    if (!current || (current.type === 'story' && entry.type === 'docs')) {
      components.set(entry.title, entry)
    }
  }

  const sections = new Map<string, IndexEntry[]>()
  for (const entry of components.values()) {
    const separator = entry.title.indexOf('/')
    const group = separator === -1 ? 'Components' : entry.title.slice(0, separator)
    const links = sections.get(group)
    if (links) links.push(entry)
    else sections.set(group, [entry])
  }
  return sections
}

export function Overview() {
  const [index, setIndex] = useState<StoryIndex>()
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    // The preview iframe, manager and index share a directory in both builds.
    fetch('./index.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Story index returned ${response.status}`)
        return response.json() as Promise<StoryIndex>
      })
      .then(setIndex)
      .catch(() => {
        if (!controller.signal.aborted) setLoadFailed(true)
      })
    return () => controller.abort()
  }, [])

  return (
    <div className="styleguide-overview">
      <header className="styleguide-overview-hero">
        <div>
          <h1>Soundlines styleguide</h1>
          <p>Explore the colors, controls, and screens behind the interactive atlas of musical lineages.</p>
        </div>
        <img src={publicAsset('/favicon.svg')} alt="" width={112} height={112} />
      </header>
      {index ? (
        <nav aria-label="Styleguide sections" className="styleguide-overview-sections">
          {[...catalogueSections(index)].map(([group, links]) => (
            <section key={group}>
              <h2>{group}</h2>
              <ul>
                {links.map(({ title, id, type }) => (
                  <li key={id}>
                    <a href={`./?path=/${type}/${id}`} target="_top">
                      {title.slice(title.indexOf('/') + 1).replaceAll('/', ' / ')}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      ) : (
        <p role="status">
          {loadFailed ? 'Could not load the story catalogue. You can still browse the sidebar.' : 'Loading the story catalogue…'}
        </p>
      )}
    </div>
  )
}
