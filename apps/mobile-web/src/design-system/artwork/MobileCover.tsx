import type { CSSProperties } from 'react'

export function MobileCover({ accent, kind, src, eager }: {
  accent: string
  kind: 'genre' | 'instrument'
  src?: string
  eager: boolean
}) {
  const variant = kind === 'instrument' ? ' cover--instrument' : src ? ' cover--photo' : ''
  return (
    <div style={{ '--accent': accent } as CSSProperties} className={`cover${variant}`} aria-hidden="true">
      {src
        ? <img src={src} alt="" loading={eager ? 'eager' : 'lazy'} draggable={false} />
        : <div className="record"><span /></div>}
    </div>
  )
}
