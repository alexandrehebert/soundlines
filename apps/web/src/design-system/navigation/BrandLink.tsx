import { motion, useMotionValueEvent, useReducedMotion, useScroll, type HTMLMotionProps, type MotionValue } from 'motion/react'
import type { ReactNode } from 'react'
import { SoundlinesMark } from './SoundlinesMark.tsx'
import { useSoundlinesWaves } from './soundlinesMarkMotion.ts'

export function BrandLink({ children, iconClassName, scrollDistance, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props }: Omit<HTMLMotionProps<'a'>, 'children'> & { children: ReactNode; iconClassName?: string; scrollDistance?: MotionValue<number> }) {
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const waves = useSoundlinesWaves(!reduceMotion)
  useMotionValueEvent(scrollDistance ?? scrollY, 'change', waves.nudge)

  return (
    <motion.a
      {...props}
      data-soundlines-brand
      onPointerEnter={(event) => { waves.setHovered(true); onPointerEnter?.(event) }}
      onPointerLeave={(event) => { waves.setHovered(false); onPointerLeave?.(event) }}
      onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) waves.setHovered(true); onFocus?.(event) }}
      onBlur={(event) => { waves.setHovered(false); onBlur?.(event) }}
    >
      <SoundlinesMark className={iconClassName} pathRefs={waves.pathRefs} />
      {children}
    </motion.a>
  )
}
