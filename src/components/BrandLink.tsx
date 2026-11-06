import { Disc3 } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

const recordVariants = {
  rest: { rotate: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  spinning: { rotate: 360, transition: { duration: 1.6, ease: 'linear', repeat: Infinity } },
} as const

export function BrandLink({ children, iconClassName, ...props }: Omit<HTMLMotionProps<'a'>, 'children'> & { children: ReactNode; iconClassName?: string }) {
  return (
    <motion.a {...props} initial={false} animate="rest" whileHover="spinning" whileFocus="spinning">
      <motion.span variants={recordVariants} aria-hidden="true">
        <Disc3 className={iconClassName} />
      </motion.span>
      {children}
    </motion.a>
  )
}
