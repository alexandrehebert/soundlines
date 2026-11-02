import { useLayoutEffect, useRef, useState } from 'react'
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
import { DEFAULT_BUBBLE_ZOOM, SELECTION_BORDER, SELECTION_OUTLINE } from '../../theme.ts'
import {
  ABOVE_BAR_LABEL_FONT_SIZE, BAR_H, BAR_LABEL_FONT_SIZE, barBounds, barLabel, barShape, fitBarLabel,
  tailFadeOffset, type BarLabel, type BarLabelMetrics, type BarPosition, type OffscreenIndicator,
} from './geometry.ts'

interface TimelineBarProps {
  bar: BarPosition
  scale: TimeScale
  dimmed: boolean
  indicator?: OffscreenIndicator
  rowBars?: BarPosition[]
  placement?: BarLabel | null
  onHover: (id: string | null) => void
  onSelect: (id: string, revealYear?: number) => void
}

function BarSelectionOutline({ x, y, width, ended = false }: {
  x: number
  y: number
  width: number
  ended?: boolean
}) {
  const radius = BAR_H / 2 / DEFAULT_BUBBLE_ZOOM
  return (
    <foreignObject data-bar-selection-outline="" x={x} y={y} width={width} height={BAR_H}
      overflow="visible" pointerEvents="none" aria-hidden="true">
      {/* HTML follows the rounded border; SVG native outlines use its bounding box. */}
      <div style={{
        boxSizing: 'border-box',
        width: width / DEFAULT_BUBBLE_ZOOM,
        height: BAR_H / DEFAULT_BUBBLE_ZOOM,
        borderRadius: ended ? `${radius}px 0 0 ${radius}px` : radius,
        ...SELECTION_BORDER,
        ...SELECTION_OUTLINE,
        transform: `scale(${DEFAULT_BUBBLE_ZOOM})`,
        transformOrigin: 'top left',
      }} />
    </foreignObject>
  )
}

export function TimelineBar({ bar, scale, dimmed, indicator, rowBars, placement, onHover, onSelect }: TimelineBarProps) {
  const { selectedId, selectNode, viewRange, setViewRange } = useExplorer()
  const measureRef = useRef<SVGTextElement>(null)
  const [labelMetrics, setLabelMetrics] = useState<(BarLabelMetrics & { name: string; weight: number }) | null>(null)
  const hasVisibleSpan = bar.visibleSpans.some(([start, end]) =>
    Math.min(end, scale.width) > Math.max(start, 0))
  const hasMeasurement = hasVisibleSpan || !!indicator
  const measureWeight = hasVisibleSpan ? 700 : 600
  const metrics = labelMetrics?.name === bar.node.name && labelMetrics.weight === measureWeight ? labelMetrics : undefined
  const label = placement === undefined ? barLabel(bar, scale.width, rowBars, metrics?.width) : placement
  const labelMaxWidth = label?.maxWidth ?? (indicator ? Math.max(0, indicator.width - 42) : undefined)
  const labelFontSize = label?.above ? ABOVE_BAR_LABEL_FONT_SIZE : BAR_LABEL_FONT_SIZE

  useLayoutEffect(() => {
    const text = measureRef.current
    if (!hasMeasurement || !text) return
    const length = bar.node.name.length
    setLabelMetrics({
      name: bar.node.name,
      weight: measureWeight,
      width: length ? text.getSubStringLength(0, length) : 0,
      ellipsisWidth: text.getSubStringLength(length, 1),
    })
  }, [bar.node.name, hasMeasurement, measureWeight])

  useLayoutEffect(() => {
    const text = measureRef.current
    if (labelMaxWidth === undefined || !metrics || metrics.prefixWidths || !text
      || metrics.width * labelFontSize / BAR_LABEL_FONT_SIZE + 1 <= labelMaxWidth) return
    let length = 0
    const prefixWidths = [...bar.node.name].map((character) => {
      length += character.length
      return text.getSubStringLength(0, length)
    })
    setLabelMetrics((current) => current?.name === bar.node.name && current.weight === measureWeight
      ? { ...current, prefixWidths } : current)
  }, [bar.node.name, labelMaxWidth, labelFontSize, measureWeight, metrics])

  if (!bar.visibleSpans.length) return null
  const isSelected = bar.node.id === selectedId
  const shape = barShape(bar)
  const bounds = barBounds(bar)
  const phases = prominencePhases(bar.node, bar.end)
  const phaseStart = phases[0]?.start ?? bar.start
  const phaseEnd = phases.at(-1)?.end ?? bar.end
  const gradientStart = yearToX(scale, phaseStart)
  const gradientEnd = yearToX(scale, phaseEnd)
  const scaledOffset = (offset: number) => (
    (yearToX(scale, phaseStart + offset * (phaseEnd - phaseStart)) - gradientStart)
    / (gradientEnd - gradientStart)
  )
  const stops = intensityStops(bar.node, bar.end)
    .map((stop) => ({ ...stop, offset: scaledOffset(stop.offset) }))
  const visibility = visibilityStops(bar.node, bar.end)
    .map((stop) => ({ ...stop, offset: scaledOffset(stop.offset) }))
  const id = bar.node.id.replace(':', '-')
  const clipId = `bar-clip-${id}`
  const gradientId = `bar-prominence-${id}`
  const visibilityId = `bar-visibility-${id}`
  const tailId = `bar-tail-${id}`
  const hasHiddenPhase = visibility.some((stop) => stop.level < 1)
  const isArtist = bar.node.type === 'artist'
  const labels = prominenceLabels(bar.node.type)
  const revealYear = indicator ? xToYear(scale, indicator.targetX) : undefined
  const offscreenLabel = indicator ? `${bar.node.name} · off-screen to the ${indicator.direction}; activate to reveal` : null
  const maskPadding = Math.max(4, (SELECTION_OUTLINE.outlineWidth + SELECTION_OUTLINE.outlineOffset) * DEFAULT_BUBBLE_ZOOM)
  const visibleLabel = label ? fitBarLabel(bar.node.name, label.maxWidth, labelFontSize, metrics) : ''
  const indicatorLabel = indicator
    ? fitBarLabel(bar.node.name, Math.max(0, indicator.width - 42), BAR_LABEL_FONT_SIZE, metrics) : ''

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
      style={{ cursor: 'pointer', transition: 'opacity 150ms', outline: 'none' }}
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
      {hasMeasurement && (
        <text ref={measureRef} data-label-measure={bar.node.id} data-label-weight={measureWeight}
          visibility="hidden" pointerEvents="none" aria-hidden="true"
          fontSize={BAR_LABEL_FONT_SIZE} fontWeight={measureWeight}>{`${bar.node.name}…`}</text>
      )}
      <defs>
        <clipPath id={clipId}><path d={shape} /></clipPath>
        {bar.ended && (
          <>
            <linearGradient id={`${tailId}-gradient`} gradientUnits="userSpaceOnUse"
              x1={bounds.x} y1={bar.yCenter} x2={bounds.x + bounds.width} y2={bar.yCenter}>
              <stop offset={tailFadeOffset(bar, scale)} stopColor="#fff" stopOpacity="1" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id={tailId} maskUnits="userSpaceOnUse"
              x={bounds.x - maskPadding} y={bar.yCenter - BAR_H} width={bounds.width + maskPadding * 2} height={BAR_H * 2}>
              <rect x={bounds.x - maskPadding} y={bar.yCenter - BAR_H}
                width={bounds.width + maskPadding * 2} height={BAR_H * 2} fill={`url(#${tailId}-gradient)`} />
            </mask>
          </>
        )}
        {stops.length > 0 && (
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse"
            x1={gradientStart} x2={gradientEnd} y1={bar.yCenter} y2={bar.yCenter}>
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
              x1={gradientStart} x2={gradientEnd} y1={bar.yCenter} y2={bar.yCenter}>
              {visibility.map((stop) => (
                <stop key={stop.offset} offset={stop.offset} stopColor="#fff" stopOpacity={stop.level} />
              ))}
            </linearGradient>
            <mask id={visibilityId} maskUnits="userSpaceOnUse"
              x={bounds.x - maskPadding} y={bar.yCenter - BAR_H} width={bounds.width + maskPadding * 2} height={BAR_H * 2}>
              <rect x={bounds.x - maskPadding} y={bar.yCenter - BAR_H} width={bounds.width + maskPadding * 2}
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
          <BarSelectionOutline {...bounds} ended={bar.ended} />
        </g>
      </g>
      {label && visibleLabel && (
        <text data-bar-label={label.outside ? 'outside' : 'inside'}
          x={label.x} y={bar.yCenter + (label.above ? -14.5 : 4)} textAnchor={label.textAnchor}
          clipPath={label.outside ? undefined : `url(#${clipId})`}
          fill={label.outside || phases.length > 0 || isArtist ? '#f8fafc' : '#020617'}
          stroke={label.outside ? '#020617' : undefined}
          strokeWidth={label.outside ? 3 : undefined} paintOrder={label.outside ? 'stroke' : undefined}
          fontSize={labelFontSize} fontWeight={700}>
          <title>{bar.node.name}</title>
          {visibleLabel}
        </text>
      )}
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
            rx={BAR_H / 2} fill={`url(#ghost-${id})`} stroke={isSelected ? 'none' : bar.color}
            strokeOpacity={0.4} strokeDasharray="3 4" />
          <BarSelectionOutline x={indicator.x} y={bar.yCenter - BAR_H / 2} width={indicator.width} />
          <path d={indicator.direction === 'left'
            ? `M ${indicator.x + 17} ${bar.yCenter - 4} l -4 4 l 4 4`
            : `M ${indicator.x + indicator.width - 17} ${bar.yCenter - 4} l 4 4 l -4 4`}
            stroke={bar.color} strokeWidth={1.5} fill="none" pointerEvents="none" />
          <text data-indicator-label="" x={indicator.x + (indicator.direction === 'left' ? 27 : 10)} y={bar.yCenter + 4}
            fill="#cbd5e1" fontSize={11.5} fontWeight={600} clipPath={`url(#ghost-label-${id})`}
            pointerEvents="none">
            {indicatorLabel}
          </text>
        </g>
      )}
      <title>{offscreenLabel ?? `${bar.node.name}${isArtist && !phases.length ? ' · prominence not annotated' : ''}`}</title>
    </g>
  )
}
