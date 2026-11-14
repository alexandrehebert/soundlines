import { motion } from 'motion/react'
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'

import { toggleButtonClass, toggleContainerClass } from './segmentedControlStyles.ts'

export function ToggleIndicator({ layoutId }: { layoutId: string }) {
  return (
    <motion.span
      layoutId={layoutId}
      className="absolute inset-0 rounded-full border border-cyan-500/50 bg-cyan-500/15 shadow-sm shadow-cyan-500/20"
      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
    />
  )
}

function useToggleNavigation<T extends string>(
  selected: T,
  options: readonly T[],
  onChange: (value: T) => void,
) {
  const buttonRefs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({})

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const current = options.indexOf(selected)
    const next =
      event.key === 'Home' ? 0
      : event.key === 'End' ? options.length - 1
      : (current + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length
    onChange(options[next])
    buttonRefs.current[options[next]]?.focus()
  }

  return { buttonRefs, handleKeyDown }
}

type SegmentedOption<T extends string> = { value: T; content: ReactNode }

export function SegmentedControl<T extends string>({
  label, value, options, onChange, className = '', buttonClassName, leading,
}: {
  label: string
  value: T
  options: readonly SegmentedOption<T>[]
  onChange: (value: T) => void
  className?: string
  buttonClassName?: string
  leading?: ReactNode
}) {
  const indicatorId = useId()
  const { buttonRefs, handleKeyDown } = useToggleNavigation(value, options.map((option) => option.value), onChange)

  return (
    <div className={`${toggleContainerClass} ${className}`} role="radiogroup" aria-label={label} onKeyDown={handleKeyDown}>
      {leading}
      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            ref={(element) => { buttonRefs.current[option.value] = element }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={buttonClassName
              ? toggleButtonClass(selected, buttonClassName)
              : `${toggleButtonClass(selected)} min-w-0 flex-1 justify-center whitespace-nowrap`}
          >
            {selected && <ToggleIndicator layoutId={`segmented-control-${indicatorId}`} />}
            <span className="relative flex items-center gap-1.5">{option.content}</span>
          </button>
        )
      })}
    </div>
  )
}
