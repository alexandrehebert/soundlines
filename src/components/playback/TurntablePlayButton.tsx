import { Pause, Play } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import '../home/Home.css'

type Props = Omit<ComponentProps<'button'>, 'children'> & {
  playing?: boolean
  loading?: boolean
  label: string
  hint?: ReactNode
}

export function TurntablePlayButton({ playing = false, loading = false, label, hint, disabled, ...props }: Props) {
  const t = useTranslations('homeContent')
  return (
    <button {...props} type="button" className="discovery-turntable-play" aria-label={label} aria-pressed={playing} aria-busy={loading} disabled={loading || disabled} title={label}>
      {hint}
      <span className="discovery-knob-face" aria-hidden="true">
        <span className="discovery-knob-dial"><span /></span>
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </span>
      <span>{t(playing ? 'pause' : 'play')}</span>
    </button>
  )
}
