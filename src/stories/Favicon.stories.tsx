/// <reference types="vite/client" />

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'
import { faviconUrl } from '../favicon.ts'
import { createWaveModel, sampleWave, WaveTape } from '../components/navigation/soundlinesWave.ts'
import soundlineSvg from './fixtures/favicon-concepts/soundline.svg?raw'
import soundlinesSvg from './fixtures/favicon-concepts/soundlines.svg?raw'
import './Favicon.css'

const soundlinePreviewSvg = soundlineSvg.replace('<svg ', '<svg aria-hidden="true" focusable="false" ')
const soundlinesPreviewSvg = soundlinesSvg.replace('<svg ', '<svg aria-hidden="true" focusable="false" ')
const officialFavicon = faviconUrl('dark')
const officialLightFavicon = faviconUrl('light')

const favicons = [
  {
    id: 'soundlines',
    name: 'Soundlines',
    badge: 'Current',
    description: 'The official favicon: cyan and pink waves, violet endpoints, and a circular dark background.',
    src: officialFavicon,
  },
  {
    id: 'vinyl',
    name: 'Vinyl disc',
    badge: 'Previous',
    description: 'The previous favicon, retained for comparison.',
    src: new URL('./fixtures/favicon-concepts/vinyl.svg?no-inline', import.meta.url).href,
  },
  {
    id: 'soundline',
    name: 'Soundline',
    badge: 'Concept',
    description: 'A continuous waveform connects two points: sound moving along a line.',
    src: new URL('./fixtures/favicon-concepts/soundline.svg?no-inline', import.meta.url).href,
  },
] as const

const sizes = [16, 24, 32] as const

const meta = {
  title: 'Foundations/Favicon',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

interface WaveGroup {
  paths: SVGPathElement[]
  original: string
  tape: WaveTape
  cyclesPerSecond: number
}

function createWaveGroups(root: HTMLElement): WaveGroup[] {
  const waves = [
    { selector: '.favicon-preview--soundline svg svg path', cyclesPerSecond: 0.22 },
    { selector: '.favicon-preview--soundlines svg svg path[stroke="#22d3ee"]', cyclesPerSecond: 0.2 },
    { selector: '.favicon-preview--soundlines svg svg path[stroke="#f472b6"]', cyclesPerSecond: 0.2 },
  ]
  return waves.map(({ selector, cyclesPerSecond }) => {
    const paths = [...root.querySelectorAll<SVGPathElement>(selector)]
    const original = paths[0]?.getAttribute('d')
    if (!original) throw new Error(`Missing favicon wave path: ${selector}`)
    return { paths, original, tape: new WaveTape(createWaveModel(sampleWave(paths[0]))), cyclesPerSecond }
  })
}

function FaviconPreview({ favicon, size, decorative = false, lightTheme = false }: {
  favicon: typeof favicons[number]
  size: number
  decorative?: boolean
  lightTheme?: boolean
}) {
  const waveSvg = favicon.id === 'soundline'
    ? soundlinePreviewSvg
    : favicon.id === 'soundlines' ? soundlinesPreviewSvg : null
  const className = `favicon-preview favicon-preview--${favicon.id}${lightTheme && favicon.id === 'soundlines' ? ' favicon-preview--light' : ''}`
  const style = { width: size, height: size }

  if (waveSvg) {
    return (
      <span
        className={className}
        style={style}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : `${favicon.name} favicon`}
        aria-hidden={decorative || undefined}
        dangerouslySetInnerHTML={{ __html: waveSvg }}
      />
    )
  }

  return (
    <span className={className} style={style}>
      <img src={favicon.src} alt={decorative ? '' : `${favicon.name} favicon`} width={size} height={size} />
    </span>
  )
}

function FaviconComparison() {
  const [paused, setPaused] = useState(false)
  const root = useRef<HTMLElement>(null)
  const waveGroups = useRef<WaveGroup[] | null>(null)
  const elapsed = useRef(0)

  useEffect(() => {
    if (!root.current) return
    const cached = waveGroups.current
    const groups = cached && cached.every(({ paths }) => paths.every((path) => root.current?.contains(path)))
      ? cached
      : createWaveGroups(root.current)
    waveGroups.current = groups

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame: number | null = null
    let previousFrame: number | null = null

    function animate(now: number) {
      if (previousFrame !== null) elapsed.current += Math.min((now - previousFrame) / 1000, 0.1)
      previousFrame = now
      for (const group of groups) {
        const path = group.tape.pathAt(elapsed.current * group.cyclesPerSecond * group.tape.intervals)
        for (const element of group.paths) element.setAttribute('d', path)
      }
      frame = window.requestAnimationFrame(animate)
    }

    function updateMotion() {
      if (frame !== null) window.cancelAnimationFrame(frame)
      frame = null
      previousFrame = null
      if (motionPreference.matches) {
        for (const group of groups) {
          for (const element of group.paths) element.setAttribute('d', group.original)
        }
      } else if (!paused) {
        frame = window.requestAnimationFrame(animate)
      }
    }

    motionPreference.addEventListener('change', updateMotion)
    updateMotion()
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      motionPreference.removeEventListener('change', updateMotion)
    }
  }, [paused])

  return (
    <main ref={root} className={`favicon-story ${paused ? 'favicon-story--paused' : ''} min-h-screen bg-slate-950 px-4 py-8 text-slate-200 sm:px-6 sm:py-10`}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex shrink-0 gap-2">
              <div className="rounded-xl bg-[#020617] p-2">
                <img src={officialFavicon} alt="Official Soundlines favicon" width={64} height={64} />
              </div>
              <div className="rounded-xl bg-[#eee9de] p-2">
                <img src={officialLightFavicon} alt="Light theme Soundlines favicon" width={64} height={64} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">Project identity</p>
              <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Soundlines favicon</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                The still frames above are the official dark and light favicons. The animated
                previews below retain the motion studies for hover and scroll interactions,
                alongside the previous vinyl icon and the Soundline concept.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 motion-reduce:hidden"
          >
            {paused ? 'Resume animations' : 'Pause animations'}
          </button>
          <p className="hidden text-xs text-slate-400 motion-reduce:block">Animations are off because reduced motion is enabled.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favicons.map((favicon) => (
            <article key={favicon.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-white">{favicon.name}</h2>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  favicon.badge === 'Current' ? 'bg-violet-500/15 text-violet-300' : 'bg-slate-800 text-slate-400'
                }`}
                >
                  {favicon.badge}
                </span>
              </div>
              <div className="mt-4 flex h-36 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/50">
                <FaviconPreview favicon={favicon} size={96} />
              </div>
              <p className="mt-4 min-h-12 flex-1 text-sm leading-6 text-slate-400">{favicon.description}</p>

              <div className="mt-5 border-t border-slate-800 pt-4">
                <h3 className="text-xs font-medium text-slate-300">Actual sizes</h3>
                <div className="mt-2 flex gap-6">
                  {sizes.map((size) => (
                    <div key={size} className="text-center">
                      <div className="flex h-8 items-end justify-center">
                        <FaviconPreview favicon={favicon} size={size} decorative />
                      </div>
                      <span className="mt-1 block text-[10px] text-slate-500">{size} px</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 border-t border-slate-800 pt-4">
                <h3 className="text-xs font-medium text-slate-300">Browser tabs</h3>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100">
                    <FaviconPreview favicon={favicon} size={16} decorative />
                    <span>Soundlines</span>
                    <span aria-hidden="true" className="ml-auto text-slate-400">&times;</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-xs text-slate-800">
                    <FaviconPreview favicon={favicon} size={16} decorative lightTheme />
                    <span>Soundlines</span>
                    <span aria-hidden="true" className="ml-auto text-slate-500">&times;</span>
                  </div>
                </div>
              </div>

              <a
                href={favicon.src}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${favicon.name} SVG`}
                className="mt-5 self-start text-xs font-medium text-violet-300 hover:text-violet-200"
              >
                View SVG
              </a>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}

export const Comparison = {
  render: () => <FaviconComparison />,
} satisfies Story
