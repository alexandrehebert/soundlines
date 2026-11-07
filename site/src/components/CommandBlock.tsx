import { useEffect, useState } from 'react'

export function CommandBlock({ command, copyLabel, copiedLabel }: { command: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <div className="relative max-w-190">
      <pre className="overflow-x-auto rounded-lg border border-line bg-surface p-6 pr-28 text-sm leading-[1.8]">
        <code>{command}</code>
      </pre>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(command).then(() => setCopied(true), () => {})}
        className="absolute top-3 right-3 rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-fg"
      >
        <span aria-live="polite">{copied ? copiedLabel : copyLabel}</span>
      </button>
    </div>
  )
}
