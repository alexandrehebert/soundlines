import { Disc3 } from 'lucide-react'
import { motion, type MotionValue } from 'motion/react'
import { useId } from 'react'
import './Home.css'

/** The two record faces and fixed curved wordmark; gestures belong to the turntable. */
export function VinylRecord({ rotate = -16 }: { rotate?: number | MotionValue<number> }) {
  const captionPathId = useId()
  return (
    <>
      <div className="discovery-record-flip">
        {(['A', 'B'] as const).map((side) => (
          <div key={side} className={`discovery-record-face discovery-record-face-${side.toLowerCase()}`}>
            <motion.div className="discovery-vinyl" style={{ rotate }}>
              <div className="discovery-label"><Disc3 size={28} aria-hidden="true" /></div>
            </motion.div>
          </div>
        ))}
      </div>
      <svg className="discovery-record-caption" viewBox="0 0 360 360" aria-hidden="true">
        <defs><path id={captionPathId} d="M 5 281 A 202 202 0 0 0 180 382" /></defs>
        <text><textPath href={`#${captionPathId}`} startOffset="50%" textAnchor="middle">SOUNDLINES</textPath></text>
      </svg>
    </>
  )
}
