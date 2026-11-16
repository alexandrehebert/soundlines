import { ArrowLeft } from 'lucide-react'
import type { MouseEventHandler } from 'react'
import { pageHref } from '../../nodeUrl.ts'
import { MobileBrand } from './MobileBrand.tsx'
import './MobileMasthead.css'

export function MobileMasthead({ back, onNavigate, onBrandClick = onNavigate }: {
  back?: { href: string; label: string }
  onNavigate: MouseEventHandler<HTMLAnchorElement>
  onBrandClick?: MouseEventHandler<HTMLAnchorElement>
}) {
  return (
    <header className="masthead">
      {back ? (
        <a className="masthead-back" href={back.href} onClick={onNavigate}>
          <ArrowLeft size={17} aria-hidden="true" /> {back.label}
        </a>
      ) : (
        <a className="masthead-brand" href={pageHref('home')} aria-label="Soundlines home" onClick={onBrandClick}>
          <MobileBrand />
        </a>
      )}
    </header>
  )
}
