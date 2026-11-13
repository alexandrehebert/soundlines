import { ArrowDown, ArrowRight, Boxes } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '../i18n/routing.ts'
import { REPOSITORY_URL } from '../projectLinks.ts'
import { DatasetGraph } from './DatasetGraph.tsx'
import { GraphCardHeader } from './GraphCardHeader.tsx'

export async function OpenDataGraph({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'openData.graph' })
  return (
    <section aria-labelledby="graph-title" className="space-y-8 pb-8">
      <header>
        <h2 id="graph-title" className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-400">{t('description')}</p>
      </header>
      <section aria-labelledby="graph-model-title" className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 sm:p-6">
        <GraphCardHeader id="graph-model-title" icon={<Boxes size={18} />}
          title={t('modelTitle')} description={t('modelDescription')} />
        <div className="mt-5 grid items-stretch gap-2 text-center sm:grid-cols-[1fr_auto_1.4fr_auto_1fr]">
          <div className="rounded-xl border border-violet-400/40 bg-violet-400/5 p-3">
            <p className="text-sm font-semibold text-violet-200">{t('sourceNode')}</p>
            <code className="text-xs text-slate-300">id · type · name</code>
          </div>
          <ModelArrow />
          <div className="rounded-xl border border-cyan-400/40 bg-cyan-400/5 p-3">
            <p className="text-sm font-semibold text-cyan-200">{t('relationship')}</p>
            <code className="text-xs text-slate-300">id · type · from · to</code>
          </div>
          <ModelArrow />
          <div className="rounded-xl border border-violet-400/40 bg-violet-400/5 p-3">
            <p className="text-sm font-semibold text-violet-200">{t('targetNode')}</p>
            <code className="text-xs text-slate-300">id · type · name</code>
          </div>
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-400">{t('properties')}</p>
        <a className="mt-3 inline-block text-sm text-cyan-300 underline underline-offset-4"
          href={`${REPOSITORY_URL}/blob/main/docs/GRAPH.md`} target="_blank" rel="noopener noreferrer">
          {t('guide')} ↗
        </a>
      </section>
      <DatasetGraph />
    </section>
  )
}

function ModelArrow() {
  return (
    <span aria-hidden="true" className="grid place-items-center text-slate-400">
      <ArrowRight size={18} className="hidden sm:block" />
      <ArrowDown size={18} className="sm:hidden" />
    </span>
  )
}
