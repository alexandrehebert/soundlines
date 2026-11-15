import type { ComponentProps, ReactNode } from 'react'
import '../home/Home.css'

type Props = Omit<ComponentProps<'button'>, 'children'> & {
  label: string
  caption: string
  icon: ReactNode
  pressed: boolean
} & (
  | { variant: 'playback'; loading?: boolean; hint?: ReactNode }
  | { variant: 'side'; loading?: never; hint?: never }
)

export function TurntableKnob({ variant, label, caption, icon, pressed, loading, hint, disabled, ...props }: Props) {
  const isPlayback = variant === 'playback'
  const side = pressed ? 'B' : 'A'
  return (
    <button
      {...props}
      type="button"
      className={isPlayback ? 'discovery-turntable-play' : 'discovery-turntable-side-toggle'}
      aria-label={label}
      aria-pressed={pressed}
      aria-busy={isPlayback ? loading ?? false : undefined}
      disabled={loading || disabled}
      title={label}
      data-side={isPlayback ? undefined : side}
    >
      {hint}
      <span className="discovery-knob-face" aria-hidden="true">
        <span className="discovery-knob-dial"><span /></span>
        {icon}
      </span>
      <span>{caption}</span>
    </button>
  )
}
