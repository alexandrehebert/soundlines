import type { ReactNode } from 'react'

export function GraphCardHeader({ id, icon, title, description }: {
  id: string
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <header>
      <h3 id={id} className="flex items-center gap-2 font-semibold">
        <span aria-hidden="true" className="shrink-0 text-cyan-300">{icon}</span>
        {title}
      </h3>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{description}</p>
    </header>
  )
}
