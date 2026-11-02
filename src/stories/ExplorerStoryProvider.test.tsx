import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ExplorerStoryProvider } from '../../.storybook/ExplorerStoryProvider.tsx'
import { useExplorer } from '../ExplorerContext.ts'

function Probe() {
  const { view, selectedId, viewRange } = useExplorer()
  return <output data-view={view} data-selected={selectedId} data-start={viewRange[0]} data-end={viewRange[1]} />
}

describe('Storybook explorer provider', () => {
  it('initializes the selected node in its corresponding view', () => {
    const markup = renderToStaticMarkup(
      <ExplorerStoryProvider initialSelectedId="artist:kraftwerk">
        <Probe />
      </ExplorerStoryProvider>,
    )
    expect(markup).toContain('data-view="artist"')
    expect(markup).toContain('data-selected="artist:kraftwerk"')
  })

  it('reveals an initially selected node outside the default range', () => {
    const markup = renderToStaticMarkup(
      <ExplorerStoryProvider initialSelectedId="genre:baroque">
        <Probe />
      </ExplorerStoryProvider>,
    )
    const start = Number(markup.match(/data-start="([^"]+)"/)?.[1])
    const end = Number(markup.match(/data-end="([^"]+)"/)?.[1])
    expect(start).toBeLessThanOrEqual(1600)
    expect(end).toBeGreaterThanOrEqual(1600)
  })

  it('rejects unknown fixture nodes', () => {
    expect(() => renderToStaticMarkup(
      <ExplorerStoryProvider initialSelectedId="genre:does-not-exist">
        <Probe />
      </ExplorerStoryProvider>,
    )).toThrow('Unknown story node genre:does-not-exist')
  })
})
