import { Disc3 } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useTransform, type HTMLMotionProps, type MotionValue, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

const recordVariants = {
  rest: { rotate: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  spinning: { rotate: 360, transition: { duration: 1.6, ease: 'linear', repeat: Infinity } },
} as const

const idleVariants: Variants = {
  still: { rotate: 0 },
  rest: {
    rotate: [0, -10, 6, 0],
    transition: { delay: 6, duration: 0.65, ease: 'easeInOut', repeat: Infinity, repeatDelay: 12 },
  },
  spinning: { rotate: 0, transition: { duration: 0.15 } },
}

export function BrandLink({ children, iconClassName, scrollDistance, ...props }: Omit<HTMLMotionProps<'a'>, 'children'> & { children: ReactNode; iconClassName?: string; scrollDistance?: MotionValue<number> }) {
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const scrollRotation = useTransform(scrollDistance ?? scrollY, [0, 480], [0, 360], { clamp: false })

  return (
    <motion.a {...props} initial="still" animate="rest" whileHover="spinning" whileFocus="spinning">
      <motion.span style={reduceMotion ? undefined : { rotate: scrollRotation }} aria-hidden="true">
        <motion.span className="block" variants={recordVariants}>
          <motion.span className="block" variants={idleVariants}>
            <Disc3 className={iconClassName} />
          </motion.span>
        </motion.span>
      </motion.span>
      {children}
    </motion.a>
  )
}
