import { useExplorer } from '../../ExplorerContext.ts'
import { revealEraRange, xToYear, yearToX, type TimeScale } from '../../graph/layout.ts'
import {
  intensityColor,
  intensityOpacity,
  intensityStops,
  phaseIntensity,
  prominencePhases,
  visibilityStops,
} from '../../graph/phases.ts'
import { prominenceLabels } from '../../graph/types.ts'
import { BAR_H, barShape, labelX, tailFadeOffset, type BarPosition, type OffscreenIndicator } from './geometry.ts'

interface TimelineBarProps {
  bar: BarPosition
  scale: TimeScale
  dimmed: boolean
  indicator?: OffscreenIndicator
  onHover: (id: string | null) => void
  onSelect: (id: string, revealYear?: number) => void
}

export function TimelineBar({ bar, scale, dimmed, indicator, onHover, onSelect }: TimelineBarProps) {
  const { selectedId, selectNode, viewRange, setViewRange } = useExplorer()
  if (!bar.visibleSpans.length) return null
  const isSelected = bar.node.id === selectedId
  const shape = barShape(bar)
  const phases = prominencePhases(bar.node, bar.end)
  const stops = intensityStops(bar.node, bar.end)
  const visibility = visibilityStops(bar.node, bar.end)
  const id = bar.node.id.replace(':', '-')
  const clipId = `bar-clip-${id}`
  const gradientId = `bar-prominence-${id}`
  const visibilityId = `bar-visibility-${id}`
  const tailId = `bar-tail-${id}`
  const hasHiddenPhase = visibility.some((stop) => stop.level < 1)
  const textX = labelX(bar, scale.width)
  const isArtist = bar.node.type === 'artist'
  const labels = prominenceLabels(bar.node.type)
  const revealYear = indicator ? xToYear(scale, indicator.targetX) : undefined
  const offscreenLabel = indicator ? `${bar.node.name} · off-screen to the ${indicator.direction}; activate to reveal` : null

  return (
    <g
      data-timeline-bar={bar.node.id}
      data-node-type={bar.node.type}
      data-offscreen-direction={indicator?.direction}
      role="button"
      tabIndex={0}
      aria-label={offscreenLabel ?? bar.node.name}
      aria-pressed={isSelected}
      opacity={dimmed ? 0.2 : 1}
      style={{ cursor: 'pointer', transition: 'opacity 150ms' }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') onHover(bar.node.id)
        else onHover(null)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') onHover(null)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          selectNode(bar.node.id)
          if (revealYear !== undefined) setViewRange(revealEraRange(viewRange, revealYear))
        }
      }}
      onClick={(event) => {
        event.stopPropagation()
        onHover(null)
        onSelect(bar.node.id, revealYear)
      }}
    >
      <defs>
        <clipPath id={clipId}><path d={shape} /></clipPath>
        {bar.ended && (
          <>
            <linearGradient id={`${tailId}-gradient`} x1="0" y1="0" x2="1" y2="0">
              <stop offset={tailFadeOffset(bar)} stopColor="#fff" stopOpacity="1" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.05" />
            </linearGradient>
            <mask id={tailId} maskContentUnits="objectBoundingBox">
              <rect x="0" y="0" width="1" height="1" fill={`url(#${tailId}-gradient)`} />
            </mask>
          </>
        )}
        {stops.length > 0 && (
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse"
            x1={bar.x1} x2={bar.x2} y1={bar.yCenter} y2={bar.yCenter}>
            {stops.map((stop) => (
              <stop key={stop.offset} offset={stop.offset}
                stopColor={intensityColor(bar.color, stop.level)}
                stopOpacity={intensityOpacity(stop.level)} />
            ))}
          </linearGradient>
        )}
        {hasHiddenPhase && (
          <>
            <linearGradient id={`${visibilityId}-gradient`} gradientUnits="userSpaceOnUse"
              x1={bar.x1} x2={bar.x2} y1={bar.yCenter} y2={bar.yCenter}>
              {visibility.map((stop) => (
                <stop key={stop.offset} offset={stop.offset} stopColor="#fff" stopOpacity={stop.level} />
              ))}
            </linearGradient>
            <mask id={visibilityId} maskUnits="userSpaceOnUse"
              x={bar.x1 - 4} y={bar.yCenter - BAR_H} width={bar.x2 - bar.x1 + 8} height={BAR_H * 2}>
              <rect x={bar.x1 - 4} y={bar.yCenter - BAR_H} width={bar.x2 - bar.x1 + 8}
                height={BAR_H * 2} fill={`url(#${visibilityId}-gradient)`} />
            </mask>
          </>
        )}
      </defs>
      {bar.visibleSpans.map(([start, end], index) => (
        <rect
          key={`hit-area-${index}`}
          x={start}
          y={bar.yCenter - 18}
          width={Math.max(0, end - start)}
          height={36}
          fill="transparent"
          pointerEvents="all"
          aria-hidden="true"
        />
      ))}
      <g mask={bar.ended ? `url(#${tailId})` : undefined}>
        {/* SVG masks don't affect hit-testing; hidden phases have no hit rect. */}
        <g mask={hasHiddenPhase ? `url(#${visibilityId})` : undefined}
          pointerEvents={hasHiddenPhase ? 'none' : undefined}>
          <path d={shape} fill={`color-mix(in srgb, ${bar.color} 4%, #020617)`} />
          {phases.length === 0 ? (
            <path
              d={shape}
              fill={bar.color}
              opacity={isSelected ? 0.95 : isArtist ? 0.32 : 0.55}
              stroke={isSelected ? '#f8fafc' : bar.color}
              strokeWidth={isSelected ? 1.5 : 0}
            />
          ) : (
            <g clipPath={`url(#${clipId})`}>
              <path d={shape} fill={`url(#${gradientId})`} />
              {phases.map((phase) => {
                if (phaseIntensity(phase) <= 0) return null
                const x = yearToX(scale, phase.start)
                const endX = yearToX(scale, phase.end)
                return (
                  <g key={phase.start} data-prominence={phase.prominence} pointerEvents="all">
                    <rect x={x} y={bar.yCenter - BAR_H / 2}
                      width={Math.max(0, endX - x)} height={BAR_H} fill="transparent" />
                    <title>{`${labels[phase.prominence]}: c. ${phase.start}–${phase.end}. ${bar.node.phaseNote ?? ''}`}</title>
                  </g>
                )
              })}
            </g>
          )}
          {phases.length > 0 && isSelected && (
            <path d={shape} fill="none" stroke="#f8fafc" strokeWidth={1.5} />
          )}
          {textX !== null && (
            <text x={textX} y={bar.yCenter + 4} clipPath={`url(#${clipId})`}
              fill={phases.length > 0 || isArtist ? '#f8fafc' : '#020617'}
              fontSize={11.5} fontWeight={700} pointerEvents="none">
              {bar.node.name}
            </text>
          )}
        </g>
      </g>
      {indicator && (
        <g data-offscreen-indicator={bar.node.id}>
          <defs>
            <linearGradient id={`ghost-${id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={bar.color} stopOpacity={indicator.direction === 'left' ? 0.22 : 0.03} />
              <stop offset="1" stopColor={bar.color} stopOpacity={indicator.direction === 'right' ? 0.22 : 0.03} />
            </linearGradient>
            <clipPath id={`ghost-label-${id}`}>
              <rect x={indicator.x + (indicator.direction === 'left' ? 27 : 10)}
                y={bar.yCenter - BAR_H / 2} width={indicator.width - 42} height={BAR_H} />
            </clipPath>
          </defs>
          <rect x={indicator.x} y={bar.yCenter - BAR_H / 2} width={indicator.width} height={BAR_H}
            rx={BAR_H / 2} fill={`url(#ghost-${id})`} stroke={isSelected ? '#f8fafc' : bar.color}
            strokeOpacity={isSelected ? 0.9 : 0.4} strokeDasharray="3 4" />
          <path d={indicator.direction === 'left'
            ? `M ${indicator.x + 17} ${bar.yCenter - 4} l -4 4 l 4 4`
            : `M ${indicator.x + indicator.width - 17} ${bar.yCenter - 4} l 4 4 l -4 4`}
            stroke={bar.color} strokeWidth={1.5} fill="none" pointerEvents="none" />
          <text x={indicator.x + (indicator.direction === 'left' ? 27 : 10)} y={bar.yCenter + 4}
            fill="#cbd5e1" fontSize={11.5} fontWeight={600} clipPath={`url(#ghost-label-${id})`}
            pointerEvents="none">
            {bar.node.name}
          </text>
        </g>
      )}
      <title>{offscreenLabel ?? `${bar.node.name}${isArtist && !phases.length ? ' · prominence not annotated' : ''}`}</title>
    </g>
  )
}
