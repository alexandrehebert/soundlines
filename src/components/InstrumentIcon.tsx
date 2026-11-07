import type { CSSProperties } from 'react'
import { publicAsset } from '../publicAsset.ts'

export function InstrumentIcon({ id, className, style }: {
  id: string
  className?: string
  style?: CSSProperties
}) {
  const file = `${encodeURIComponent(id.slice('instrument:'.length))}.svg`
  const mask = `url("${publicAsset(`/instrument-icons/${file}`)}") center / contain no-repeat`

  return (
    <span data-instrument-icon={id} aria-hidden="true" className={className}
      style={{ ...style, mask, WebkitMask: mask }} />
  )
}
