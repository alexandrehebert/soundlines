export function OpenDataCodeBlock({ children, nested = false }: { children: string; nested?: boolean }) {
  return (
    <pre tabIndex={0} className={nested
      ? 'mt-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs'
      : 'mt-2 overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm'
    }><code>{children}</code></pre>
  )
}
