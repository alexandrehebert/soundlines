'use client'

import { Eject, Pause, Play, Search, Shuffle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useExplorer } from '../../ExplorerContext.ts'
import { hasGenrePreview } from '../../data/genrePreviews.ts'
import { graphLabels } from '../../i18n/graphLabels.ts'
import { publicAsset } from '../../publicAsset.ts'
import { FAMILY_COLORS } from '../../theme.ts'
import { useColorTheme } from '../../useColorTheme.ts'
import { DiscoveryFooter, DiscoveryHeader } from '../DiscoveryChrome.tsx'
import { claimPlayback, releasePlayback } from '../exclusivePlayback.ts'
import { TurntableLcd, type LevelSource } from './TurntableLcd.tsx'
import { spectrumBands } from './vinylScratch.ts'
import './Jukebox.css'

const FADE_IN_SECONDS = .18
const FADE_OUT_SECONDS = .22

function fadeToSilence(gain: GainNode, now: number) {
  const volume = gain.gain
  if (typeof volume.cancelAndHoldAtTime === 'function') volume.cancelAndHoldAtTime(now)
  else {
    const current = volume.value
    volume.cancelScheduledValues(now)
    volume.setValueAtTime(current, now)
  }
  volume.linearRampToValueAtTime(0, now + FADE_OUT_SECONDS)
}

function searchKey(value: string, locale: string) {
  return value.toLocaleLowerCase(locale).normalize('NFD').replace(/\p{M}/gu, '')
}

function JukeboxTitle({ name }: { name: string }) {
  const viewport = useRef<HTMLElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(0)

  useEffect(() => {
    const frame = viewport.current
    const text = label.current
    if (!frame || !text) return

    const measure = () => {
      setOverflow(Math.max(0, text.getBoundingClientRect().width - frame.clientWidth))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    observer.observe(text)
    measure()
    return () => observer.disconnect()
  }, [name])

  return (
    <strong className="jukebox-title" ref={viewport} title={name}>
      <span
        ref={label}
        className="jukebox-title-strip"
        data-scrolling={overflow > 0}
        style={{
          '--jukebox-title-offset': `${-overflow}px`,
          '--jukebox-title-duration': `${Math.max(3, overflow / 32 + 2)}s`,
        } as CSSProperties}
      >
        {name}
      </span>
    </strong>
  )
}

export function Jukebox() {
  const t = useTranslations('jukebox')

  return (
    <div className="discovery">
      <DiscoveryHeader current="jukebox" />
      <main className="discovery-width jukebox">
        <header className="jukebox-heading">
          <h1>{t('title')}</h1>
          <p className="discovery-intro">{t('description')}</p>
        </header>
        <JukeboxPlayer />
      </main>
      <DiscoveryFooter current="jukebox" />
    </div>
  )
}

export function JukeboxPlayer({ embedded = false }: { embedded?: boolean }) {
  const catalogueTitle = useId()
  const { index, locale } = useExplorer()
  const { theme } = useColorTheme()
  const t = useTranslations('jukebox')
  const audioCopy = useTranslations('audio')
  const soundtrailCopy = useTranslations('homeCopy.soundtrails')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'failed'>('idle')
  const audio = useRef<HTMLAudioElement>(null)
  const request = useRef(0)
  const audioContext = useRef<AudioContext | null>(null)
  const levels = useRef<LevelSource | null>(null)
  const outputGain = useRef<GainNode | null>(null)

  const stopPlayback = useCallback(() => {
    request.current++
    audio.current?.pause()
    const context = audioContext.current
    const volume = outputGain.current?.gain
    if (context && volume) {
      volume.cancelScheduledValues(context.currentTime)
      volume.setValueAtTime(0, context.currentTime)
    }
    setStatus('idle')
    releasePlayback(stopPlayback)
  }, [])
  const attachAudio = useCallback((element: HTMLAudioElement | null) => {
    if (!element) return
    audio.current = element
    return () => {
      request.current++
      releasePlayback(stopPlayback)
      element.pause()
      audio.current = null
      const context = audioContext.current
      audioContext.current = null
      levels.current = null
      outputGain.current = null
      if (context) void context.close().catch(() => {})
    }
  }, [stopPlayback])

  const tracks = useMemo(() => {
    const collator = new Intl.Collator(locale, { sensitivity: 'base' })
    const families = graphLabels(locale).families
    return index.graph.nodes
      .filter((node) => node.type === 'genre' && hasGenrePreview(node.id))
      .sort((a, b) => collator.compare(a.name, b.name))
      .map(({ id, name, family }, number) => ({
        id, name, number,
        code: String(number + 1).padStart(3, '0'),
        family: family ? families[family] : '',
        color: family ? FAMILY_COLORS[family] : undefined,
      }))
  }, [index, locale])

  const term = searchKey(query.trim(), locale)
  const results = tracks.filter(({ name, family, code }) => searchKey(`${name} ${family} ${code}`, locale).includes(term))
  const track = selected === null ? undefined : tracks[selected]
  const active = status === 'playing' || status === 'loading'

  function startSpectrum(element: HTMLAudioElement) {
    if (!audioContext.current && typeof AudioContext === 'function') {
      const context = new AudioContext()
      audioContext.current = context
      const analyser = context.createAnalyser()
      // Resolve the lowest bands separately and leave headroom for strong bass.
      analyser.fftSize = 4096
      analyser.maxDecibels = -18
      analyser.smoothingTimeConstant = .72
      const bins = new Uint8Array(analyser.frequencyBinCount)
      const gain = context.createGain()
      gain.gain.value = 0
      analyser.connect(gain).connect(context.destination)
      outputGain.current = gain
      context.createMediaElementSource(element).connect(analyser)
      levels.current = {
        readLevels(output) {
          analyser.getByteFrequencyData(bins)
          spectrumBands(bins, context.sampleRate, output)
          // Weight the display only. Fade in the correction above the noise floor
          // so quiet high bands don't light up on their own.
          const range = analyser.maxDecibels - analyser.minDecibels
          for (let band = 0; band < output.length; band++) {
            const position = band / (output.length - 1)
            const level = output[band]
            const correction = (-6 + 22 * position) / range
            const signal = Math.min(1, level * 4)
            output[band] = Math.max(0, Math.min(1, level + correction * signal))
          }
        },
      }
    }
    const context = audioContext.current
    if (context?.state === 'suspended' || context?.state === 'interrupted') {
      void context.resume().catch(() => {})
    }
  }

  async function play(number: number) {
    const element = audio.current
    if (!element) return
    const token = ++request.current
    try {
      startSpectrum(element)
    } catch (error) {
      console.warn('Unable to initialize the jukebox spectrum.', error)
    }
    if (selected !== number) {
      if (!element.paused && !element.ended) {
        await fadeOut()
        if (request.current !== token) return
      }
      element.pause()
      setSelected(number)
      const slug = tracks[number].id.slice('genre:'.length)
      element.src = publicAsset(`/genre-previews/${encodeURIComponent(slug)}.m4a`)
    }
    claimPlayback(stopPlayback)
    setStatus('loading')
    try {
      await element.play()
    } catch {
      if (request.current === token && audio.current === element) fail()
    }
  }

  function settle() {
    setStatus('idle')
    releasePlayback(stopPlayback)
  }

  function fail() {
    setStatus('failed')
    releasePlayback(stopPlayback)
  }

  function fadeOut() {
    const context = audioContext.current
    const gain = outputGain.current
    if (context?.state !== 'running' || !gain) return
    fadeToSilence(gain, context.currentTime)
    return new Promise<void>((resolve) => setTimeout(resolve, FADE_OUT_SECONDS * 1000))
  }

  function fadeIn(element: HTMLAudioElement) {
    const context = audioContext.current
    const gain = outputGain.current
    if (!context || !gain) return

    const now = context.currentTime
    const remaining = (element.duration - element.currentTime) / element.playbackRate
    const fadeInEnd = now + (remaining > 0 ? Math.min(FADE_IN_SECONDS, remaining / 2) : FADE_IN_SECONDS)
    const volume = gain.gain
    volume.cancelScheduledValues(now)
    volume.setValueAtTime(0, now)
    volume.linearRampToValueAtTime(1, fadeInEnd)

    if (Number.isFinite(remaining) && remaining > 0) {
      const end = now + remaining
      volume.setValueAtTime(1, Math.max(fadeInEnd, end - FADE_OUT_SECONDS))
      volume.linearRampToValueAtTime(0, end)
    }
  }

  async function toggle(number: number) {
    if (selected !== number || !active) {
      await play(number)
      return
    }
    const token = ++request.current
    await fadeOut()
    if (request.current === token) stopPlayback()
  }

  function eject() {
    stopPlayback()
    setSelected(null)
    const element = audio.current
    if (element) {
      element.removeAttribute('src')
      element.load()
    }
  }

  function surprise() {
    const alternatives = results.filter(({ number }) => number !== selected)
    const choices = alternatives.length ? alternatives : results
    if (choices.length) void play(choices[Math.floor(Math.random() * choices.length)].number)
  }

  return (
    <div className={embedded ? "jukebox-cabinet jukebox-cabinet-embedded" : "jukebox-cabinet"}>
      <section className="jukebox-deck" aria-label={t('player')}>
        <div className="jukebox-glass" data-loading={status === 'loading'} aria-hidden="true">
          <div className="jukebox-platter">
            <div
              className="jukebox-disc jukebox-player-disc"
              data-loaded={!!track}
              data-spinning={active}
              style={{ '--jukebox-disc-color': track?.color } as CSSProperties}
            />
          </div>
        </div>
        <span role="status" className="sr-only">{status === 'loading' ? audioCopy('buffering') : ''}</span>
        <div className="jukebox-display" data-active={active || undefined} role="status">
          <div className="jukebox-display-text">
            <span>{track ? `№ ${track.code} / ${track.family}` : t('ready')}</span>
            <JukeboxTitle key={track?.id} name={track?.name ?? t('select')} />
            {status === 'failed' && <small>{audioCopy('failed')}</small>}
          </div>
          <TurntableLcd source={levels} active={status === 'playing'} playing={status === 'playing'} theme={theme} />
        </div>
        <div className="jukebox-controls">
          <button type="button" className="jukebox-play" disabled={!track}
            aria-label={track ? `${audioCopy(active ? 'pause' : 'play')} · ${track.name}` : undefined}
            onClick={() => track && toggle(track.number)}>
            {active ? <Pause size={20} fill="currentColor" aria-hidden="true" />
              : <Play size={20} fill="currentColor" aria-hidden="true" />}
            <span className="jukebox-key-label">
              <span data-inactive={active} aria-hidden={active}>{audioCopy('play')}</span>
              <span data-inactive={!active} aria-hidden={!active}>{audioCopy('pause')}</span>
            </span>
          </button>
          <button type="button" className="jukebox-shuffle" disabled={!results.length}
            onClick={surprise}>
            <Shuffle size={20} aria-hidden="true" />
            <span className="jukebox-key-label">{t('surprise')}</span>
          </button>
          <button type="button" disabled={!track} onClick={eject} aria-label={t('eject')} title={t('eject')}>
            <Eject size={20} aria-hidden="true" />
          </button>
        </div>
        <audio
          ref={attachAudio}
          preload="none"
          onPlaying={({ currentTarget }) => {
            if (currentTarget.paused) return
            fadeIn(currentTarget)
            setStatus('playing')
          }}
          onWaiting={({ currentTarget }) => { if (!currentTarget.paused) setStatus('loading') }}
          onEnded={({ currentTarget }) => { if (currentTarget.ended) settle() }}
          onError={({ currentTarget }) => { if (currentTarget.error) fail() }}
        />
        <p className="jukebox-attribution">
          <a href="https://ace-step.github.io/ACE-Step-1.5/">ACE-Step</a> {audioCopy('previewAttribution')}
        </p>
      </section>

      <section className="jukebox-catalogue" aria-labelledby={catalogueTitle}>
        <div className="jukebox-catalogue-head">
          <h2 id={catalogueTitle}>{t('catalogue')}</h2>
          <p className="jukebox-count" role="status">{t('count', { count: results.length })}</p>
          <label className="jukebox-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">{t('search')}</span>
            <input type="search" value={query} placeholder={t('search')} onChange={(event) => setQuery(event.target.value)} />
          </label>
        </div>
        {results.length ? (
          <ul className="jukebox-tracks">
            {results.map(({ id, code, name, family, color, number }) => (
              <li key={id}>
                <button type="button" className="jukebox-track" aria-current={selected === number || undefined}
                  aria-label={soundtrailCopy(active && selected === number ? 'pause' : 'listen', { name })}
                  onClick={() => toggle(number)}>
                  <span className="jukebox-code" aria-hidden="true">{code}</span>
                  <span
                    className="jukebox-disc jukebox-track-disc"
                    style={{ '--jukebox-disc-color': color } as CSSProperties}
                    aria-hidden="true"
                  />
                  <span className="jukebox-track-label"><strong>{name}</strong><small>{family}</small></span>
                  {active && selected === number ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="jukebox-empty">{t('empty')}</p>}
      </section>
    </div>
  )
}
