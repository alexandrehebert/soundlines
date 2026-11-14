import { useTranslations } from 'next-intl'
import { z } from 'zod/v4'
import type { Locale } from '../../i18n/routing.ts'
import { frenchTouchQuery } from '../../mcp/example.ts'
import { toolDefinitions } from '../../mcp/tools.ts'
import { MCP_URL } from '../../projectLinks.ts'
import { OpenDataCodeBlock } from './OpenDataCodeBlock.tsx'
import { OpenDataSectionHeading } from './OpenDataSectionHeading.tsx'

const tools = Object.entries(toolDefinitions).map(([name, definition]) => ({
  name,
  description: definition.description,
  schema: z.toJSONSchema(definition.inputSchema, { io: 'input' }),
}))
const config = { mcpServers: { soundlines: { type: 'http', url: MCP_URL } } }

export function OpenDataQuery({ locale }: { locale: Locale }) {
  const t = useTranslations('openData.query')
  return (
    <section aria-labelledby="query-title" className="pb-8">
      <OpenDataSectionHeading id="query-title" title={t('title')} description={t('description')} />
      <p className="mt-3 text-sm font-semibold text-emerald-300">{t('access')}</p>
      <h3 className="mt-7 font-semibold">{t('endpoint')}</h3>
      <OpenDataCodeBlock>{MCP_URL}</OpenDataCodeBlock>
      <h3 className="mt-7 font-semibold">{t('configuration')}</h3>
      <OpenDataCodeBlock>{JSON.stringify(config, null, 2)}</OpenDataCodeBlock>
      <h3 className="mt-7 font-semibold">{t('example')} · <code>query_graph</code></h3>
      <OpenDataCodeBlock>{JSON.stringify({ ...frenchTouchQuery, locale }, null, 2)}</OpenDataCodeBlock>
      <a className="mt-4 inline-block text-sm text-cyan-300 underline underline-offset-4"
        href="https://modelcontextprotocol.io/docs/tools/inspector" target="_blank" rel="noopener noreferrer">
        {t('inspector')} ↗
      </a>
      <h3 className="mt-10 font-semibold">{t('tools')}</h3>
      <ul className="mt-3 space-y-3">
        {tools.map(({ name, description, schema }) => (
          <li key={name} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h4 className="font-mono font-semibold text-cyan-200">{name}</h4>
            <p lang="en" className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-300">{t('schema')}</summary>
              <OpenDataCodeBlock nested>{JSON.stringify(schema, null, 2)}</OpenDataCodeBlock>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}
