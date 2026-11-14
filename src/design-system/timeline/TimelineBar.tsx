import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
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
import { chartColor, chartTextColor, DEFAULT_BUBBLE_ZOOM, formatPeriod, formatYear, SELECTION_BORDER, SELECTION_OUTLINE, timelineBarOpacity } from '../../theme.ts'
import type { Locale } from '../../i18n/routing.ts'
import { InstrumentIcon } from '../explorer/InstrumentIcon.tsx'
import {
  ABOVE_BAR_LABEL_FONT_SIZE, BAR_H, BAR_LABEL_FONT_SIZE, barBounds, barLabel, barShape, fitBarLabel,
  INSTRUMENT_ICON_LABEL_GAP, INSTRUMENT_ICON_SIZE, instrumentIconPosition, tailFadeOffset,
  type BarLabel, type BarLabelMetrics, type BarPosition, type OffscreenIndicator,
} from './geometry.ts'
import { afterSvgLayout } from './svgLayout.ts'

interface TimelineBarProps {
  bar: BarPosition
  scale: TimeScale
  dimmed: boolean
  indicator?: OffscreenIndicator
  rowBars?: BarPosition[]
  placement?: BarLabel | null
  renderDetails?: boolean
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

function TimelineInstrumentIcon({ id, x, yCenter, color }: {
  id: string
  x: number
  yCenter: number
  color: string
}) {
  return (
    <foreignObject x={x} y={yCenter - INSTRUMENT_ICON_SIZE / 2}
      width={INSTRUMENT_ICON_SIZE} height={INSTRUMENT_ICON_SIZE} pointerEvents="none">
      <InstrumentIcon id={id} className="block h-full w-full bg-current" style={{ color }} />
    </foreignObject>
  )
}

function TimelineBarContents({ bar, scale, indicator, rowBars, placement, isSelected, locale }: Pick<
  TimelineBarProps, 'bar' | 'scale' | 'indicator' | 'rowBars' | 'placement'
> & { isSelected: boolean; locale: Locale }) {
  const tTimeline = useTranslations('timeline')
  const tDetail = useTranslations('detail')
  const tDates = useTranslations('dates')
  const tProminenceLabels = useTranslations('detail.prominenceLabels')
  const measureRef = useRef<SVGTextElement>(null)
  const [labelMetrics, setLabelMetrics] = useState<(BarLabelMetrics & { name: string; weight: number }) | null>(null)
  const hasVisibleSpan = bar.visibleSpans.some(([start, end]) =>
    Math.min(end, scale.width) > Math.max(start, 0))
  const hasMeasurement = hasVisibleSpan || !!indicator
  const measureWeight = hasVisibleSpan ? 700 : 600
  const metrics = labelMetrics?.name === bar.node.name && labelMetrics.weight === measureWeight ? labelMetrics : undefined
  const label = placement === undefined ? barLabel(bar, scale.width, rowBars, metrics?.width) : placement
  const indicatorIconWidth = bar.node.type === 'instrument' ? INSTRUMENT_ICON_SIZE + INSTRUMENT_ICON_LABEL_GAP : 0
  const indicatorLabelWidth = Math.max(0, (indicator?.width ?? 0) - 42 - indicatorIconWidth)
  const labelMaxWidth = label?.maxWidth ?? (indicator ? indicatorLabelWidth : undefined)
  const labelFontSize = label?.above ? ABOVE_BAR_LABEL_FONT_SIZE : BAR_LABEL_FONT_SIZE

  useLayoutEffect(() => {
    const text = measureRef.current
    if (!hasMeasurement || !text) return
    const length = bar.node.name.length
    return afterSvgLayout(text, () => {
      setLabelMetrics({
        name: bar.node.name,
        weight: measureWeight,
        width: length ? text.getSubStringLength(0, length) : 0,
        ellipsisWidth: text.getSubStringLength(length, 1),
      })
    })
  }, [bar.node.name, hasMeasurement, measureWeight])

  useLayoutEffect(() => {
    const text = measureRef.current
    if (labelMaxWidth === undefined || !metrics || metrics.prefixWidths || !text
      || metrics.width * labelFontSize / BAR_LABEL_FONT_SIZE + 1 <= labelMaxWidth) return
    return afterSvgLayout(text, () => {
      let length = 0
      const prefixWidths = [...bar.node.name].map((character) => {
        length += character.length
        return text.getSubStringLength(0, length)
      })
      setLabelMetrics((current) => current?.name === bar.node.name && current.weight === measureWeight
        ? { ...current, prefixWidths } : current)
    })
  }, [bar.node.name, labelMaxWidth, labelFontSize, measureWeight, metrics])

  if (!bar.visibleSpans.length) return null
  const shape = barShape(bar)
  const bounds = barBounds(bar)
  const phases = prominencePhases(bar.node, bar.end)
  const color = chartColor(bar.color)
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
  const estimated = bar.node.period?.estimated === true
  const hasEdgeFade = bar.ended || estimated
  const hasHiddenPhase = visibility.some((stop) => stop.level < 1)
  const isArtist = bar.node.type === 'artist'
  const icon = instrumentIconPosition(bar, scale.width, rowBars)
  const prominenceType = bar.node.type === 'artist' || bar.node.type === 'instrument' ? bar.node.type : 'other'
  const maskPadding = Math.max(4, (SELECTION_OUTLINE.outlineWidth + SELECTION_OUTLINE.outlineOffset) * DEFAULT_BUBBLE_ZOOM)
  const visibleLabel = label ? fitBarLabel(bar.node.name, label.maxWidth, labelFontSize, metrics) : ''
  const indicatorLabel = indicator
    ? fitBarLabel(bar.node.name, indicatorLabelWidth, BAR_LABEL_FONT_SIZE, metrics) : ''

  return (
    <>
      {hasMeasurement && (
        <text ref={measureRef} data-label-measure={bar.node.id} data-label-weight={measureWeight}
          visibility="hidden" pointerEvents="none" aria-hidden="true"
          fontSize={BAR_LABEL_FONT_SIZE} fontWeight={measureWeight}>{`${bar.node.name}…`}</text>
      )}
      <defs>
        <clipPath id={clipId}><path d={shape} /></clipPath>
        {hasEdgeFade && (
          <>
            <linearGradient id={`${tailId}-gradient`} gradientUnits="userSpaceOnUse"
              x1={bounds.x} y1={bar.yCenter} x2={bounds.x + bounds.width} y2={bar.yCenter}>
              {estimated ? (
                <>
                  <stop offset="0" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.25" stopColor="#fff" stopOpacity="1" />
                  <stop offset="0.75" stopColor="#fff" stopOpacity="1" />
                </>
              ) : (
                <stop offset={tailFadeOffset(bar, scale)} stopColor="#fff" stopOpacity="1" />
              )}
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
                stopColor={intensityColor(color, stop.level)}
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
      <g mask={hasEdgeFade ? `url(#${tailId})` : undefined}>
        {/* SVG masks don't affect hit-testing; hidden phases have no hit rect. */}
        <g mask={hasHiddenPhase ? `url(#${visibilityId})` : undefined}
          pointerEvents={hasHiddenPhase ? 'none' : undefined}>
          <path className="timeline-bar-underlay" d={shape} fill={`color-mix(in srgb, ${bar.color} 4%, #020617)`} />
          {phases.length === 0 ? (
            <path
              d={shape}
              fill={color}
              opacity={timelineBarOpacity(bar.node.type, isSelected)}
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
                    <title>{[
                      tTimeline('phasePeriod', {
                        label: tProminenceLabels(`${prominenceType}.${phase.prominence}`),
                        start: formatYear(phase.start, locale),
                        end: formatYear(phase.end, locale),
                        circa: tDates('circa'),
                      }),
                      phase.note,
                      phase.confidence
                        ? `${tDetail('phaseConfidenceTitle')} ${tDetail(`confidence.${phase.confidence}`)}.`
                        : undefined,
                      bar.node.phaseNote,
                    ].filter(Boolean).join(' ')}</title>
                  </g>
                )
              })}
            </g>
          )}
          <path className="visualization-hover-border" d={shape} pointerEvents="none" aria-hidden="true" />
          <BarSelectionOutline {...bounds} ended={bar.ended} />
        </g>
      </g>
      {icon && (
        <g aria-hidden="true">
          <rect x={icon.x} y={bar.yCenter - 18} width={INSTRUMENT_ICON_SIZE} height={36}
            fill="transparent" pointerEvents="all" />
          {icon.overlapsBar && (
            <rect x={icon.x} y={bar.yCenter - INSTRUMENT_ICON_SIZE / 2}
              width={INSTRUMENT_ICON_SIZE} height={INSTRUMENT_ICON_SIZE} rx={4}
              className="timeline-icon-underlay" fill="#020617" fillOpacity={0.85} pointerEvents="none" />
          )}
          <TimelineInstrumentIcon id={bar.node.id} x={icon.x} yCenter={bar.yCenter} color={chartTextColor(bar.color)} />
        </g>
      )}
      {label && visibleLabel && (
        <text data-bar-label={label.outside ? 'outside' : 'inside'}
          x={label.x} y={bar.yCenter + (label.above ? -14.5 : 4)} textAnchor={label.textAnchor}
          clipPath={label.outside ? undefined : `url(#${clipId})`}
          fill={label.outside || phases.length > 0 || isArtist || estimated ? '#f8fafc' : '#020617'}
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
              <stop offset="0" stopColor={color} stopOpacity={indicator.direction === 'left' ? 0.22 : 0.03} />
              <stop offset="1" stopColor={color} stopOpacity={indicator.direction === 'right' ? 0.22 : 0.03} />
            </linearGradient>
            <clipPath id={`ghost-label-${id}`}>
              <rect x={indicator.x + (indicator.direction === 'left' ? 27 : 10) + indicatorIconWidth}
                y={bar.yCenter - BAR_H / 2} width={indicatorLabelWidth} height={BAR_H} />
            </clipPath>
          </defs>
          <rect x={indicator.x} y={bar.yCenter - BAR_H / 2} width={indicator.width} height={BAR_H}
            rx={BAR_H / 2} fill={`url(#ghost-${id})`} stroke={isSelected ? 'none' : color}
            strokeOpacity={0.4} strokeDasharray="3 4" />
          <rect className="visualization-hover-border" x={indicator.x} y={bar.yCenter - BAR_H / 2}
            width={indicator.width} height={BAR_H} rx={BAR_H / 2} pointerEvents="none" aria-hidden="true" />
          <BarSelectionOutline x={indicator.x} y={bar.yCenter - BAR_H / 2} width={indicator.width} />
          <path d={indicator.direction === 'left'
            ? `M ${indicator.x + 17} ${bar.yCenter - 4} l -4 4 l 4 4`
            : `M ${indicator.x + indicator.width - 17} ${bar.yCenter - 4} l 4 4 l -4 4`}
            stroke={color} strokeWidth={1.5} fill="none" pointerEvents="none" />
          {bar.node.type === 'instrument' && (
            <TimelineInstrumentIcon id={bar.node.id}
              x={indicator.x + (indicator.direction === 'left' ? 27 : 10)} yCenter={bar.yCenter} color={chartTextColor(bar.color)} />
          )}
          <text data-indicator-label=""
            x={indicator.x + (indicator.direction === 'left' ? 27 : 10) + indicatorIconWidth} y={bar.yCenter + 4}
            fill="#cbd5e1" fontSize={11.5} fontWeight={600} clipPath={`url(#ghost-label-${id})`}
            pointerEvents="none">
            {indicatorLabel}
          </text>
        </g>
      )}
    </>
  )
}

export function TimelineBar({
  bar, scale, dimmed, indicator, rowBars, placement, renderDetails = true, onSelect,
}: TimelineBarProps) {
  const { locale, selectedId, selectNode, viewRange, setViewRange } = useExplorer()
  const t = useTranslations('timeline')
  const tDirections = useTranslations('timeline.directions')
  if (!bar.visibleSpans.length) return null
  const isSelected = bar.node.id === selectedId
  const revealYear = indicator ? xToYear(scale, indicator.targetX) : undefined
  const offscreenLabel = indicator
    ? t('offscreen', { name: bar.node.name, direction: tDirections(indicator.direction) })
    : null
  const estimatedLabel = bar.node.period?.estimated
    ? t('estimatedPeriod', { period: formatPeriod(bar.node.period, locale) ?? '' }) : ''
  const prominenceLabel = !offscreenLabel && bar.node.type === 'artist' && !prominencePhases(bar.node, bar.end).length
    ? t('prominenceUnannotated') : ''
  const estimateNote = bar.node.period?.estimated ? bar.node.period.estimateNote : undefined
  return (
    <g
      data-timeline-bar={bar.node.id}
      className="visualization-item"
      data-node-type={bar.node.type}
      data-estimated-period={bar.node.period?.estimated || undefined}
      data-offscreen-direction={indicator?.direction}
      role="button"
      tabIndex={0}
      aria-label={`${offscreenLabel ?? bar.node.name}${estimatedLabel}`}
      aria-pressed={isSelected}
      opacity={dimmed ? 0.2 : 1}
      style={{ cursor: 'pointer', outline: 'none' }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          selectNode(bar.node.id)
          if (revealYear !== undefined) setViewRange(revealEraRange(viewRange, revealYear))
        }
      }}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(bar.node.id, revealYear)
      }}
    >
      {renderDetails ? (
        <TimelineBarContents bar={bar} scale={scale} indicator={indicator} rowBars={rowBars}
          locale={locale}
          placement={placement} isSelected={isSelected} />
      ) : (
        // Native keyboard scrolling needs the offscreen target's actual row bounds.
        <rect x={0} y={bar.yCenter - 18} width={scale.width} height={36}
          fill="none" pointerEvents="none" aria-hidden="true" />
      )}
      <title>{`${offscreenLabel ?? bar.node.name}${prominenceLabel}${estimatedLabel}${estimateNote ? `. ${estimateNote}` : ''}`}</title>
    </g>
  )
}
