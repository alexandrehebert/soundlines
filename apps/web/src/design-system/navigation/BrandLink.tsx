import { motion, useMotionValueEvent, useScroll, type HTMLMotionProps, type MotionValue } from 'motion/react'
import type { ReactNode } from 'react'
import { SoundlinesMark } from '@soundlines/ui-web/SoundlinesMark'
import { useSoundlinesWaves } from '@soundlines/ui-web/soundlinesMarkMotion'

export function BrandLink({ children, iconClassName, scrollDistance, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props }: Omit<HTMLMotionProps<'a'>, 'children'> & { children: ReactNode; iconClassName?: string; scrollDistance?: MotionValue<number> }) {
  const { scrollY } = useScroll()
  const waves = useSoundlinesWaves()
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
