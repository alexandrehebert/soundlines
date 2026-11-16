import { ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEventHandler, type PointerEvent, type ReactNode } from 'react'
import type { AtlasEntry, FeedNode } from '../../feed.ts'
import { nodeUrl, type LibrarySelection } from '../../nodeUrl.ts'

function dateLabel(year: number | undefined, periodSize = 1) {
  if (year === undefined) return 'Undated'
  if (periodSize > 1) {
    if (year < 1) return 'Before 1 CE'
    if (year === 1) return `1–${periodSize - 1} CE`
    return `${year}–${year + periodSize - 1}`
  }
  if (year < 1) return `${Math.abs(year) || 1} BCE`
  return String(year)
}

function instrumentPeriodSize(entries: AtlasEntry[]) {
  let oldest = Infinity
  let newest = -Infinity
  for (const { startYear } of entries) {
    if (startYear === undefined) continue
    oldest = Math.min(oldest, startYear)
    newest = Math.max(newest, startYear)
  }
  if (!Number.isFinite(oldest) || oldest < 1 || newest - oldest >= 100) return 100
  return Math.floor(oldest / 10) === Math.floor(newest / 10) ? 1 : 10
}

function groupByDate(entries: AtlasEntry[], periodSize: number) {
  const dates = new Map<number | undefined, AtlasEntry[]>()
  for (const entry of entries) {
    const year = entry.startYear
    const start = periodSize > 1 && year !== undefined
      ? (year < 1 ? 0 : Math.max(1, Math.floor(year / periodSize) * periodSize))
      : year
    const group = dates.get(start)
    if (group) group.push(entry)
    else dates.set(start, [entry])
  }
  return [...dates].sort(([a], [b]) => (b ?? -Infinity) - (a ?? -Infinity))
}

function dateScale(dates: ReturnType<typeof groupByDate>) {
  const newest = dates[0]?.[0] ?? 0
  const hasUndated = dates.at(-1)?.[0] === undefined
  const oldest = dates.at(hasUndated ? -2 : -1)?.[0] ?? newest
  const roughStep = Math.max(1, (newest - oldest) / 5)
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const step = [1, 2, 2.5, 5, 10].map((size) => size * magnitude)
    .find((years) => Number.isInteger(years) && years >= roughStep) ?? 10 * magnitude
  const firstTick = Math.floor(newest / step) * step
  const lastTick = Math.ceil(oldest / step) * step
  const dateExtent = hasUndated ? .85 : 1
  const position = (year: number | undefined) =>
    year === undefined ? 1 : (newest - year) / Math.max(1, newest - oldest) * dateExtent
  const roundYears = Array.from({ length: (firstTick - lastTick) / step + 1 }, (_, index) => firstTick - step * index)
  // Give the exact endpoints room without changing the spacing of the interior marks.
  const interiorTicks = roundYears.filter((year) => position(year) > .09 && position(year) < dateExtent - .09)
  const ticks = newest === oldest ? [newest] : [newest, ...interiorTicks, oldest]
  const minorStep = Math.max(1, step / (step === 2 * magnitude ? 2 : 5))
  const minorTicks: number[] = []
  for (let year = Math.floor(newest / minorStep) * minorStep; year > oldest; year -= minorStep) {
    const offset = position(year)
    if (year % step !== 0 && offset > .02 && offset < dateExtent - .02) minorTicks.push(year)
  }
  return { ticks, minorTicks, position, positions: dates.map(([year]) => position(year)) }
}

export function MobileChronology({ entries, selection, onNavigate, renderArtwork }: {
  entries: AtlasEntry[]
  selection: LibrarySelection
  onNavigate: MouseEventHandler<HTMLAnchorElement>
  renderArtwork?: (node: FeedNode) => ReactNode
}) {
  const album = selection.type === 'instrument'
  const periodSize = useMemo(() => album ? instrumentPeriodSize(entries) : 1, [entries, album])
  const dates = useMemo(() => groupByDate(entries, periodSize), [entries, periodSize])
  const scale = useMemo(() => dateScale(dates), [dates])
  const [active, setActive] = useState(0)
  const [dragPosition, setDragPosition] = useState<number | null>(null)
  const gesture = useRef<{ pointerId: number; startY: number; startPosition: number; moved: boolean } | null>(null)
  const chronology = useRef<HTMLDivElement>(null)
  const rail = useRef<HTMLDivElement>(null)
  const slider = useRef<HTMLInputElement>(null)
  const sections = useRef(new Map<number, HTMLElement>())
  const last = dates.length - 1
  const current = Math.max(0, Math.min(active, last))
  const currentYear = dates[current]?.[0]
  const currentLabel = dateLabel(currentYear, periodSize)
  const showStartYear = periodSize > 1 && currentYear !== undefined && currentYear >= 1
  const readout = showStartYear ? dateLabel(currentYear) : currentLabel
  const currentPosition = scale.positions[current] ?? 0

  useEffect(() => {
    const page = chronology.current?.closest<HTMLElement>('.library-page')
    if (!page) return
    function syncDate() {
      if (!page?.clientHeight) return
      const top = page.getBoundingClientRect().top + 14
      let low = 0
      let high = last
      while (low < high) {
        const middle = Math.ceil((low + high) / 2)
        const section = sections.current.get(middle)
        if (section && section.getBoundingClientRect().top <= top) low = middle
        else high = middle - 1
      }
      setActive(low)
    }

    page.addEventListener('scroll', syncDate, { passive: true })
    return () => page.removeEventListener('scroll', syncDate)
  }, [last])

  function jumpTo(index: number) {
    const page = chronology.current?.closest<HTMLElement>('.library-page')
    const section = sections.current.get(index)
    if (!page || !section) return
    const top = page.scrollTop + section.getBoundingClientRect().top - page.getBoundingClientRect().top - 12
    page.scrollTo?.({ top, behavior: 'instant' })
    setActive(index)
  }

  function selectPosition(position: number) {
    const index = scale.positions.reduce((nearest, value, index) =>
      Math.abs(value - position) < Math.abs(scale.positions[nearest] - position) ? index : nearest, 0)
    if (index !== current) jumpTo(index)
  }

  function moveScale(event: PointerEvent<HTMLElement>) {
    const drag = gesture.current
    const height = rail.current?.clientHeight
    if (drag?.pointerId !== event.pointerId || !height) return
    const distance = drag.startY - event.clientY
    if (!drag.moved && Math.abs(distance) < 5) return
    drag.moved = true
    const position = Math.max(0, Math.min(1, drag.startPosition + distance / height))
    setDragPosition(position)
    selectPosition(position)
  }

  function endGesture(event: PointerEvent<HTMLElement>) {
    const drag = gesture.current
    if (drag?.pointerId !== event.pointerId) return
    const bounds = rail.current?.getBoundingClientRect()
    if (event.type === 'pointerup' && !drag.moved && bounds?.height) {
      const offset = (event.clientY - bounds.top) / bounds.height - .5
      selectPosition(drag.startPosition + offset)
    }
    gesture.current = null
    setDragPosition(null)
  }

  if (!dates.length) return <p>No library entries yet.</p>

  return (
    <div ref={chronology} className={`chronology-results${last > 0 ? ' chronology-results--indexed' : ''}`}>
      {last > 0 && (
        <nav className="chronology-index" aria-label="Browse by date"
          data-dragging={dragPosition !== null || undefined}
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0 || gesture.current) return
            event.preventDefault()
            event.currentTarget.setPointerCapture(event.pointerId)
            slider.current?.focus({ preventScroll: true })
            gesture.current = { pointerId: event.pointerId, startY: event.clientY, startPosition: currentPosition, moved: false }
          }}
          onPointerMove={moveScale}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
          onLostPointerCapture={endGesture}>
          <div ref={rail} className="chronology-rail" aria-hidden="true"><span /></div>
          <div className="chronology-scale">
            <input ref={slider} type="range" min={0} max={last} value={current}
              aria-label="Jump to date" aria-orientation="vertical" aria-valuetext={currentLabel}
              onChange={(event) => jumpTo(event.currentTarget.valueAsNumber)} />
            <div className="chronology-ticks" aria-hidden="true"
              style={{ '--chronology-position': dragPosition ?? currentPosition } as CSSProperties}>
              {scale.minorTicks.map((year) => (
                <span key={year} className="chronology-minor-tick"
                  style={{ '--tick-position': scale.position(year) } as CSSProperties} />
              ))}
              {scale.ticks.map((year) => (
                <span key={year} style={{ '--tick-position': scale.position(year) } as CSSProperties}>
                  <b>{year === 0 ? '1 CE' : dateLabel(year)}</b>
                </span>
              ))}
              {dates[last][0] === undefined && <span style={{ '--tick-position': 1 } as CSSProperties}><b>Undated</b></span>}
            </div>
            <strong className="chronology-readout" aria-hidden="true">{readout}</strong>
          </div>
        </nav>
      )}
      <div className="chronology-sections">
        {dates.map(([year, group], index) => {
          const label = dateLabel(year, periodSize)
          return (
            <section key={label} className="chronology-date" aria-label={label}
              ref={(section) => {
                if (section) sections.current.set(index, section)
                else sections.current.delete(index)
              }}>
              <h2>{label}</h2>
              <ul className={album ? 'instrument-album' : 'chronology-cards'}>
                {group.map(({ node, period, estimateNote }) => (
                  <li key={node.id}>
                    {album ? (
                      <a href={nodeUrl(node, undefined, selection)} onClick={onNavigate}>
                        {renderArtwork?.(node)}
                        <span>{node.name}</span>
                      </a>
                    ) : (
                      <a href={nodeUrl(node, undefined, selection)} onClick={onNavigate}
                        style={{ '--entry-accent': node.accent } as CSSProperties}>
                        <strong>{node.name}</strong>
                        {period && (period !== label || estimateNote) && (
                          <small>{period}{estimateNote && ' (estimated)'}</small>
                        )}
                        <ChevronRight size={16} aria-hidden="true" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
