import { frenchTouchQuery } from '../../../src/mcp/example.ts'
import type { Locale } from '../content.ts'
import { mcpCopy } from '../copy/mcp.ts'
import { mcpUrl } from '../links.ts'

const clientConfig = { mcpServers: { soundlines: { type: 'http', url: mcpUrl } } }
const inspectorCommand = `npx @modelcontextprotocol/inspector --server-url ${mcpUrl} --transport http`

function CodeBlock({ children }: { children: string }) {
  return (
    <pre tabIndex={0} className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface p-4 text-sm">
      <code>{children}</code>
    </pre>
  )
}

export function McpReference({ locale }: { locale: Locale }) {
  const c = mcpCopy[locale]
  const query = { ...frenchTouchQuery, locale }

  return (
    <div className="max-w-190 space-y-12">
      <section aria-labelledby="mcp-connect">
        <h2 id="mcp-connect" className="heading-2">{c.connect}</h2>
        <p className="mt-3 leading-relaxed text-muted">{c.setup}</p>
        <CodeBlock>{JSON.stringify(clientConfig, null, 2)}</CodeBlock>
        <p className="mt-4 leading-relaxed text-muted">{c.inspector}</p>
        <CodeBlock>{inspectorCommand}</CodeBlock>
      </section>
      <section aria-labelledby="mcp-example">
        <h2 id="mcp-example" className="heading-2">{c.example}</h2>
        <p className="mt-3 font-semibold">{c.question}</p>
        <p className="mt-3"><code>query_graph</code></p>
        <CodeBlock>{JSON.stringify(query, null, 2)}</CodeBlock>
        <p className="mt-4 leading-relaxed text-muted">{c.explain}</p>
        <p className="mt-3 leading-relaxed text-muted">{c.limits}</p>
        <p className="mt-3 leading-relaxed text-muted">{c.data}</p>
      </section>
      <section aria-labelledby="mcp-tools">
        <h2 id="mcp-tools" className="heading-2">{c.reference}</h2>
        <ul className="mt-4 space-y-3">
          {__MCP_TOOLS__.map(({ name, description, inputSchema }) => (
            <li key={name} className="rounded-xl border border-line p-4 sm:p-5">
              <h3 className="font-semibold text-accent"><code>{name}</code></h3>
              <p lang="en" className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold">{c.schema}</summary>
                <CodeBlock>{JSON.stringify(inputSchema, null, 2)}</CodeBlock>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
