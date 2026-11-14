export const reveal = {
  initial: { opacity: 0.55 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.55, ease: 'easeOut' },
} as const

export type ScrollReveal = typeof reveal | undefined
