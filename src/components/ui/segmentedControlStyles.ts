export const toggleContainerClass = 'relative flex items-center rounded-full border border-slate-700 bg-slate-900 p-1'

export function toggleButtonClass(selected: boolean, className = 'relative flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 md:min-h-0 md:px-3 md:py-1 md:text-xs') {
  const colors = selected ? 'text-cyan-200' : 'text-slate-500 hover:text-slate-300'
  return `${className} ${colors}`
}
