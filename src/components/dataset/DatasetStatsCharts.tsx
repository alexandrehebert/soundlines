import type { ReactNode } from 'react'
import { chartColor } from '../../theme.ts'

const percent = (part: number, total: number) => total ? `${Math.round((part / total) * 100)}%` : '–'

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
        {subtitle && <span className="font-medium normal-case tracking-normal text-slate-600">{subtitle}</span>}
      </h3>
      {children}
    </section>
  )
}

export function Metric({ label, value, hint, children }: { label: string; value: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5">
      <div className="text-lg font-bold leading-tight text-white tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] font-medium text-slate-500">
        {label}
        {hint && <span className="text-slate-600"> · {hint}</span>}
      </div>
      {children}
    </div>
  )
}

interface BarItem {
  key: string
  label: string
  count: number
  color: string
}

export function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.count))
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.key} className="grid grid-cols-[minmax(0,10rem)_1fr_2.5rem] items-center gap-3 text-xs">
          <span className="truncate text-slate-300" title={item.label}>{item.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-slate-800/70">
            <span className="block h-full rounded-full"
              style={{ width: `${(item.count / max) * 100}%`, backgroundColor: chartColor(item.color) }} />
          </span>
          <span className="text-right font-medium tabular-nums text-slate-400">{item.count}</span>
        </li>
      ))}
    </ul>
  )
}

export function StackedBar({ items }: { items: BarItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-800/70" role="img" aria-label={items.map((item) => `${item.label}: ${item.count}`).join(', ')}>
        {items.filter((item) => item.count > 0).map((item) => (
          <span key={item.key} style={{ width: `${(item.count / total) * 100}%`, backgroundColor: chartColor(item.color) }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColor(item.color) }} />
            {item.label}
            <span className="font-medium tabular-nums text-slate-300">{item.count}</span>
            <span className="text-slate-600">{percent(item.count, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
