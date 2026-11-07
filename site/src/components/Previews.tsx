import { useEffect, useRef, type CSSProperties } from 'react'
import brief from '../../../docs/loops/briefs/turntable-hip-hop.json'
import selection from '../../../docs/loops/briefs/turntable-hip-hop.selection.json'
import saxophoneIcon from '../../../public/instrument-icons/saxophone.svg?raw'
import type { Locale, Preview } from '../content.ts'
import { hipHopLoop, saxophone, screens } from './assets.ts'
import { readIconBlueprint } from './blueprint.ts'
import { followWaveformPlayback } from './playback.ts'

const card = 'rounded-xl border border-line bg-surface'

const tick = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 shrink-0 text-test" aria-hidden="true">
    <path d="m3.5 8.5 3 3 6-7" />
  </svg>
)

/** Deterministic pseudo-random values, so schematic pictures render the same on the server and the client. */
const noise = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function Waveform({ peaks, className = 'h-12', muted = false }: { peaks: number[]; className?: string; muted?: boolean }) {
  return (
    <svg viewBox={`0 0 ${peaks.length} 2`} preserveAspectRatio="none" className={`w-full ${className}`} aria-hidden="true">
      {peaks.map((peak, i) => (
        <rect key={i} x={i + 0.15} y={1 - peak} width="0.7" height={peak * 2} rx="0.2" fill={muted ? 'var(--color-muted)' : 'var(--actor)'} opacity={muted ? '0.4' : '0.85'} />
      ))}
    </svg>
  )
}

const saxophoneBlueprint = readIconBlueprint(saxophoneIcon)

function VectorBlueprint({ preview, locale }: { preview: Extract<Preview, { kind: 'blueprint' }>; locale: Locale }) {
  const { path, viewBox: { x, y, width, height }, curve } = saxophoneBlueprint
  const right = x + width
  const bottom = y + height
  const horizontalRuler = bottom + 1.8
  const verticalRuler = right + 1.8
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
  const widthLabel = format.format(width)
  const heightLabel = format.format(height)
  const guides = [
    [curve.start, curve.control1],
    [curve.end, curve.control2],
  ] as const

  return (
    <figure className={`${card} w-full max-w-88 overflow-hidden`}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line px-3.5 py-2.5 text-xs">
        <span className="font-semibold">{preview.title}</span>
        <span className="text-muted">{widthLabel} × {heightLabel} {preview.units}</span>
      </figcaption>
      <svg viewBox={`${x - 3} ${y - 3} ${width + 8} ${height + 8}`} role="img" aria-label={`${preview.description} ${widthLabel} × ${heightLabel} ${preview.units}.`} className="mx-auto w-full max-w-64">
        <rect x={x} y={y} width={width} height={height} fill="var(--color-bg)" stroke="var(--actor)" strokeOpacity="0.45" strokeWidth="0.12" />
        <g fill="none" stroke="var(--actor)" strokeOpacity="0.15" strokeWidth="0.08">
          {[1, 2, 3, 4, 5].map((step) => (
            <path key={step} d={`M${x + width * step / 6} ${y}v${height} M${x} ${y + height * step / 6}h${width}`} />
          ))}
        </g>
        <path d={path} fill="none" stroke="var(--actor)" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round" />
        <g fill="none" stroke="var(--color-human)" strokeWidth="0.16" strokeDasharray="0.4 0.25">
          {guides.map(([anchor, control]) => <path key={anchor.join(',')} d={`M${anchor[0]} ${anchor[1]}L${control[0]} ${control[1]}`} />)}
        </g>
        {guides.map(([anchor, control]) => (
          <g key={anchor.join(',')}>
            <circle cx={control[0]} cy={control[1]} r="0.32" fill="var(--color-bg)" stroke="var(--color-human)" strokeWidth="0.18" />
            <rect x={anchor[0] - 0.3} y={anchor[1] - 0.3} width="0.6" height="0.6" fill="var(--color-bg)" stroke="var(--actor)" strokeWidth="0.18" />
          </g>
        ))}
        <g fill="none" stroke="var(--color-muted)" strokeOpacity="0.75" strokeWidth="0.12">
          <path d={`M${x} ${bottom + 0.5}v2.2 M${right} ${bottom + 0.5}v2.2 M${x} ${horizontalRuler}H${right} M${x} ${horizontalRuler}l0.8 -0.45 M${x} ${horizontalRuler}l0.8 0.45 M${right} ${horizontalRuler}l-0.8 -0.45 M${right} ${horizontalRuler}l-0.8 0.45`} />
          <path d={`M${right + 0.5} ${y}h2.2 M${right + 0.5} ${bottom}h2.2 M${verticalRuler} ${y}V${bottom} M${verticalRuler} ${y}l-0.45 0.8 M${verticalRuler} ${y}l0.45 0.8 M${verticalRuler} ${bottom}l-0.45 -0.8 M${verticalRuler} ${bottom}l0.45 -0.8`} />
        </g>
        <g fill="var(--color-muted)" fontSize="1.4" textAnchor="middle">
          <text x={x + width / 2} y={bottom + 3.5}>{widthLabel} u</text>
          <text transform={`translate(${right + 3.5} ${y + height / 2}) rotate(-90)`}>{heightLabel} u</text>
        </g>
      </svg>
      <div aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 px-3.5 pb-3 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="size-2 border border-(--actor) bg-bg" />{preview.anchors}</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-human bg-bg" />{preview.handles}</span>
      </div>
    </figure>
  )
}

/** The shipped loop's place in its source take, from the selection report. */
const cutStart = (selection.source_start_seconds / brief.duration) * 100
const cutWidth = (selection.duration_seconds / brief.duration) * 100
const cutEnd = cutStart + cutWidth
const cut = {
  left: `${cutStart}%`,
  width: `${cutWidth}%`,
}
const takePeaks = Array.from({ length: __LOOP_PEAKS__.length }, (_, i) => 0.25 + noise(selection.source_seed + i) * 0.55)
const cutPeakCount = Math.max(1, Math.round(__LOOP_PEAKS__.length * selection.duration_seconds / brief.duration))
const cutPeaks = Array.from({ length: cutPeakCount }, (_, i) => Math.max(...__LOOP_PEAKS__.slice(
  Math.floor(i * __LOOP_PEAKS__.length / cutPeakCount),
  Math.floor((i + 1) * __LOOP_PEAKS__.length / cutPeakCount),
)))

function LoopSelection({ preview, locale }: { preview: Extract<Preview, { kind: 'loop' }>; locale: Locale }) {
  const seconds = (value: number, maximumFractionDigits = 3) =>
    `${new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value)} s`
  const tickSeconds = (value: number) =>
    `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} s`
  const start = seconds(selection.source_start_seconds)
  const end = seconds(selection.source_start_seconds + selection.duration_seconds)
  const total = seconds(brief.duration)
  const length = seconds(selection.duration_seconds, 1)
  const description = `${preview.takeLabel}: ${total} (${preview.schematicLabel}). ${preview.selectionLabel}: ${start} – ${end}. ${preview.discardedLabel}: 0 s – ${start}, ${end} – ${total}. ${preview.keptLabel}: ${length}.`

  return (
    <figure className={`${card} w-full max-w-120 p-4`}>
      <div role="img" aria-label={description}>
        <div aria-hidden="true">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
            <span className="font-semibold">{preview.takeLabel} · {total}</span>
            <span className="text-muted">{preview.schematicLabel}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="size-2 rounded-sm bg-muted/40" />{preview.discardedLabel}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-(--actor)">
              <span className="size-2 rounded-sm bg-(--actor)" />{preview.selectionLabel}
            </span>
          </div>
          <div className="relative mt-2 h-16 overflow-hidden rounded-lg border border-line bg-bg">
            <div className="absolute inset-x-0 inset-y-3">
              <Waveform peaks={takePeaks} className="h-full" muted />
            </div>
            <div className="absolute inset-y-0 overflow-hidden border-x-2 border-(--actor) bg-bg" style={cut}>
              <span className="absolute inset-0 bg-(--actor)/10" />
              <div className="absolute inset-x-0 inset-y-3">
                <Waveform peaks={cutPeaks} className="h-full" />
              </div>
            </div>
          </div>
          <div className="relative mt-1 h-4 text-[0.65rem] tabular-nums text-muted">
            <span className="absolute left-0">0 s</span>
            <span className="absolute -translate-x-1/2 whitespace-nowrap text-(--actor)" style={{ left: cut.left }}>{tickSeconds(selection.source_start_seconds)}</span>
            <span className="absolute -translate-x-1/2 whitespace-nowrap text-(--actor)" style={{ left: `${cutEnd}%` }}>{tickSeconds(selection.source_start_seconds + selection.duration_seconds)}</span>
            <span className="absolute right-0">{total}</span>
          </div>
          <div className="relative h-7">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-full w-full">
              <path d={`M ${cutStart} 0 L 1 20 M ${cutEnd} 0 L 99 20`} fill="none" stroke="var(--actor)" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="absolute inset-x-0 top-0 text-center text-lg leading-none text-(--actor)">↓</span>
          </div>
          <div className="rounded-lg border border-(--actor)/40 bg-(--actor)/10 p-3">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-semibold">{preview.keptLabel}</span>
              <span className="shrink-0 whitespace-nowrap tabular-nums text-(--actor)">{length}</span>
            </div>
            <Waveform peaks={__LOOP_PEAKS__} className="mt-2 h-10" />
          </div>
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-muted">{preview.caption}</figcaption>
    </figure>
  )
}

function LoopPlayer({ preview, final }: { preview: Extract<Preview, { kind: 'player' }>; final: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const waveformRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    const waveform = waveformRef.current
    if (!audio || !waveform) return
    return followWaveformPlayback(audio, waveform)
  }, [])

  return (
    <figure className={`${card} w-full ${final ? 'max-w-160' : 'max-w-120'} p-4`}>
      <div ref={waveformRef} role="img" aria-label={preview.waveformLabel} className="relative overflow-hidden py-2" style={{ '--progress': '0%' } as CSSProperties}>
        <Waveform peaks={__LOOP_PEAKS__} className={final ? 'h-16' : 'h-12'} muted />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 py-2" style={{ clipPath: 'inset(0 calc(100% - var(--progress)) 0 0)' }}>
          <Waveform peaks={__LOOP_PEAKS__} className={final ? 'h-16' : 'h-12'} />
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 bg-fg" style={{ left: 'clamp(0px, var(--progress), calc(100% - 2px))' }}>
          <span className="absolute -left-[3px] top-0 size-2 rotate-45 bg-fg" />
        </span>
      </div>
      <audio ref={audioRef} aria-label={preview.playerLabel} controls loop preload="none" src={hipHopLoop} className="mt-3 w-full" />
      <figcaption className="mt-2 text-xs text-muted">{preview.caption}</figcaption>
    </figure>
  )
}

export function PreviewView({ preview, locale, final }: { preview: Preview; locale: Locale; final: boolean }) {
  switch (preview.kind) {
    case 'note':
    case 'page':
      return (
        <div className={`${card} max-w-88 overflow-hidden text-sm`}>
          {preview.kind === 'page' && (
            <div className="flex items-center gap-1.5 border-b border-line bg-bg px-3 py-2 text-xs text-muted">
              {[0, 1, 2].map((dot) => <span key={dot} className="size-2 rounded-full bg-line" />)}
              <span className="ml-2 truncate">{preview.title}</span>
            </div>
          )}
          <div className="border-l-3 border-(--actor) p-3.5">
            {preview.kind === 'note' && <p className="font-semibold">{preview.title}</p>}
            <ul className="mt-1.5 grid gap-1 text-muted first:mt-0">
              {preview.lines.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </div>
        </div>
      )
    case 'checks':
      return (
        <ul className={`${card} grid max-w-88 gap-1.5 p-3.5 text-sm`}>
          {preview.items.map((item) => (
            <li key={item} className="flex items-center gap-2">{tick}{item}</li>
          ))}
        </ul>
      )
    case 'log':
      return (
        <ul className={`${card} grid max-w-88 divide-y divide-line text-sm`}>
          {preview.items.map(([status, text]) => (
            <li key={text} className="flex items-center gap-2.5 px-3.5 py-2">
              <span className={`size-2 shrink-0 rounded-full ${status === 'ok' ? 'bg-test' : 'bg-red-400'}`} />
              <span className={status === 'ok' ? '' : 'text-muted'}>{text}</span>
            </li>
          ))}
        </ul>
      )
    case 'link':
      return (
        <div className={`${card} flex max-w-88 flex-wrap items-center gap-2 p-3.5 text-sm`}>
          <span className="rounded-full bg-[#be185d]/70 px-3 py-1 font-medium">{preview.from}</span>
          <span className="flex flex-col items-center text-[0.65rem] leading-tight text-muted">
            {preview.type}
            <span aria-hidden="true" className="text-base text-(--actor)">⟶</span>
          </span>
          <span className="rounded-full bg-[#ec4899] px-3 py-1 font-medium text-bg">{preview.to}</span>
          <span className="ml-auto text-[0.65rem] font-semibold tracking-widest text-amber-300 uppercase">{preview.confidence}</span>
        </div>
      )
    case 'files':
      return (
        <ul className="flex flex-wrap gap-2 text-sm">
          {preview.items.map((item) => (
            <li key={item} className={`${card} flex items-center gap-2 px-3 py-1.5`}>
              <span aria-hidden="true" className="size-2 rounded-sm bg-(--actor)" />
              {item}
            </li>
          ))}
        </ul>
      )
    case 'verdict':
      return (
        <ul className="flex flex-wrap gap-2 text-sm">
          {preview.options.map((option, i) => (
            <li
              key={option}
              className={`rounded-full border px-3.5 py-1 font-semibold ${i === preview.chosen ? 'border-test bg-test/15 text-test' : 'border-line text-muted line-through decoration-muted/50'}`}
            >
              {option}
            </li>
          ))}
        </ul>
      )
    case 'blueprint':
      return <VectorBlueprint preview={preview} locale={locale} />
    case 'artwork':
      return (
        <div className="grid max-w-120 grid-cols-[auto_auto_1fr] items-center gap-3">
          <span className="grid size-14 place-items-center rounded-xl bg-accent">
            <span className="mask-icon size-9 bg-bg" style={{ '--icon': `url(${saxophone.icon})` } as CSSProperties} />
          </span>
          <img src={saxophone.avatar} width={56} height={56} alt="" loading="lazy" className="size-14 rounded-full" />
          <img src={saxophone.banner} width={640} height={160} alt="" loading="lazy" className="h-14 w-auto rounded-lg" />
          <img src={saxophone.header} width={1200} height={400} alt="" loading="lazy" className={`${card} col-span-3 h-20 w-full object-cover`} />
        </div>
      )
    case 'codes':
      return (
        <div className={`${card} grid w-full max-w-88 grid-cols-[repeat(24,1fr)] gap-0.75 p-3`} aria-hidden="true">
          {Array.from({ length: 24 * 5 }, (_, i) => (
            <span key={i} className="aspect-square rounded-[2px] bg-(--actor)" style={{ opacity: 0.12 + noise(i) * 0.8 }} />
          ))}
        </div>
      )
    case 'takes':
      return (
        <ul className={`${card} grid w-full max-w-88 gap-1.5 p-3.5 text-xs`}>
          {brief.seeds.map((seed) => (
            <li key={seed} className="grid grid-cols-[3.5rem_1fr] items-center gap-2">
              <span className="text-muted tabular-nums">#{seed}</span>
              <Waveform peaks={Array.from({ length: 48 }, (_, i) => 0.25 + noise(seed + i) * 0.55)} className="h-4" />
            </li>
          ))}
        </ul>
      )
    case 'loop':
      return <LoopSelection preview={preview} locale={locale} />
    case 'player':
      return <LoopPlayer preview={preview} final={final} />
    case 'screen':
      return (
        <figure className={`${card} w-full overflow-hidden ${final ? 'max-w-160' : 'max-w-100'}`}>
          <div className="flex items-center gap-1.5 border-b border-line bg-bg px-3 py-2" aria-hidden="true">
            {[0, 1, 2].map((dot) => <span key={dot} className="size-2 rounded-full bg-line" />)}
          </div>
          <img src={screens[preview.shot][locale]} width={960} height={600} alt={preview.alt} loading="lazy" className="w-full" />
        </figure>
      )
  }
}
