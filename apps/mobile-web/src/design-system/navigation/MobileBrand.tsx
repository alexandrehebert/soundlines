import { SoundlinesMark } from '@soundlines/ui-web/SoundlinesMark'
import { useSoundlinesWaves } from '@soundlines/ui-web/soundlinesMarkMotion'
import { useEffect } from 'react'
import './MobileBrand.css'

export function MobileBrand() {
  const { nudge, pathRefs } = useSoundlinesWaves()

  useEffect(() => {
    // Element scroll events reach the document during capture even though they do not bubble.
    document.addEventListener('scroll', nudge, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', nudge, true)
  }, [nudge])

  return (
    <div className="mobile-brand">
      <SoundlinesMark className="mobile-brand-mark" pathRefs={pathRefs} />
      <span>Soundlines<span className="mobile-brand-dot">.</span></span>
    </div>
  )
}
