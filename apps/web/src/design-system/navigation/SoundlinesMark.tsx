import type { Ref } from 'react'
import { SOUNDLINES_BACKGROUND, SOUNDLINES_ENDPOINT_COLOR, SOUNDLINES_WAVES } from './soundlinesMarkMotion.ts'

export function SoundlinesMark({ className, pathRefs }: { className?: string; pathRefs?: Ref<SVGPathElement>[] }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 32 32" aria-hidden="true" focusable="false" data-soundlines-mark>
      <circle cx="16" cy="16" r="16" fill={SOUNDLINES_BACKGROUND} />
      <svg x="2" y="2" width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {SOUNDLINES_WAVES.map(({ color, d }, index) => (
          <path key={color} ref={pathRefs?.[index]} d={d} stroke={color} />
        ))}
        <circle cx="3" cy="12" r="1.4" fill={SOUNDLINES_ENDPOINT_COLOR} />
        <circle cx="21" cy="12" r="1.4" fill={SOUNDLINES_ENDPOINT_COLOR} />
      </svg>
    </svg>
  )
}
