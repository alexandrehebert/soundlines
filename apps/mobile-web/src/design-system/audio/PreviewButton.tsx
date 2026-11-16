import { LoaderCircle, Pause, Play } from 'lucide-react'

const waveform = [10, 16, 7, 20, 26, 12, 18, 30, 21, 12, 24, 32, 17, 11, 24, 27, 19, 13, 25, 16, 9, 21, 14, 7]
const labels = {
  ready: 'Play preview',
  playing: 'Pause preview',
  error: 'Retry preview',
} as const

type Props = {
  genre: string
  state: keyof typeof labels | 'loading'
  progress: number
  onPress: () => void
}

export function PreviewButton({ genre, state, progress, onPress }: Props) {
  const loading = state === 'loading'

  return (
    <button
      className="listen"
      type="button"
      data-playing={state === 'playing' || undefined}
      aria-label={loading ? `Loading audio for ${genre}` : `${labels[state]} for ${genre}`}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={() => { if (!loading) onPress() }}
    >
      <span className="listen-icon" aria-hidden="true">
        <span data-current={!loading && state !== 'playing'}><Play size={18} fill="currentColor" /></span>
        <span data-current={state === 'playing'}><Pause size={18} fill="currentColor" /></span>
        {loading ? <span className="listen-loader"><LoaderCircle size={18} /></span> : null}
      </span>
      <span className="listen-label" aria-hidden="true">
        {Object.entries(labels).map(([key, label]) => <strong key={key} data-current={state === key}>{label}</strong>)}
      </span>
      <span className="wave" aria-hidden="true">
        {waveform.map((height, index) => (
          <i key={index} className={progress > index / waveform.length ? 'wave-played' : undefined}
            style={{ height }} />
        ))}
      </span>
    </button>
  )
}
