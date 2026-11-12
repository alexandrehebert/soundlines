import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const workflow = readFileSync('.github/workflows/graph-contribution-agent.yml', 'utf8')
const guardStep = 'Skip issues already sent to the agent'
const assignStep = 'Assign the issue to the graph-editor cloud agent'
const markStep = 'Mark the issue as sent to the agent'

function step(name: string) {
  const contents = workflow.split(`      - name: ${name}\n`)[1]?.split('\n      - name:')[0]
  if (!contents) throw new Error(`Missing workflow step: ${name}`)
  return contents
}

function run(name: string, response: object, token = 'test-token', apiStatus = 0, followUp: object = response) {
  const script = step(name).split('        run: |\n')[1]?.replace(/^          /gm, '')
  if (!script) throw new Error(`Missing workflow script: ${name}`)
  const fixture = mkdtempSync(join(tmpdir(), 'soundlines-contribution-workflow-'))
  const output = join(fixture, 'output')
  const payload = join(fixture, 'payload')
  const calls = join(fixture, 'calls')
  writeFileSync(output, '')
  writeFileSync(payload, '')
  writeFileSync(calls, '')
  try {
    // The first gh call answers with the response; later calls (issue re-reads) answer with followUp.
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', `
      gh() {
        echo "$*" >> "$TEST_CALLS"
        if [[ "$(wc -l < "$TEST_CALLS")" -eq 1 ]]; then
          cat > "$TEST_PAYLOAD"
          printf '%s\\n' "$TEST_RESPONSE"
        else
          printf '%s\\n' "$TEST_FOLLOW_UP"
        fi
        return "$TEST_API_STATUS"
      }
      sleep() { :; }
      ${script}
    `], {
      encoding: 'utf8',
      env: {
        ...process.env,
        GH_TOKEN: token,
        GITHUB_REPOSITORY: 'alexandrehebert/soundlines',
        ISSUE_NUMBER: '1',
        GITHUB_OUTPUT: output,
        TEST_PAYLOAD: payload,
        TEST_CALLS: calls,
        TEST_RESPONSE: JSON.stringify(response),
        TEST_FOLLOW_UP: JSON.stringify(followUp),
        TEST_API_STATUS: String(apiStatus),
      },
    })
    return {
      ...result,
      output: readFileSync(output, 'utf8'),
      payload: readFileSync(payload, 'utf8'),
      calls: readFileSync(calls, 'utf8').split('\n').filter(Boolean),
    }
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
}

describe('graph contribution assignment workflow', () => {
  it.each(['Copilot', 'copilot-swe-agent[bot]', 'copilot-swe-agent'])(
    'accepts the %s bot and prevents duplicate assignment without a started label',
    (login) => {
      const response = { labels: [], assignees: [{ login, type: 'Bot' }] }
      const guard = run(guardStep, response)
      expect(guard.status, guard.stderr).toBe(0)
      expect(guard.output).toBe('already_started=true\n')

      const assignment = run(assignStep, response)
      expect(assignment.status, assignment.stderr).toBe(0)
      expect(JSON.parse(assignment.payload)).toMatchObject({
        assignees: ['copilot-swe-agent[bot]'],
        agent_assignment: {
          target_repo: 'alexandrehebert/soundlines',
          base_branch: 'main',
          custom_agent: 'graph-editor',
        },
      })
    },
  )

  it('skips issues already marked as started', () => {
    const result = run(guardStep, { labels: [{ name: 'graph:agent-started' }], assignees: [] })
    expect(result.status, result.stderr).toBe(0)
    expect(result.output).toBe('already_started=true\n')
  })

  it.each([
    { labels: [], assignees: [] },
    { labels: [{ name: 'graph:approved' }], assignees: [{ login: 'contributor', type: 'User' }] },
    { labels: [], assignees: [{ login: 'Copilot', type: 'User' }] },
  ])('does not mistake an unassigned issue or a user for a started agent %#', (response) => {
    const result = run(guardStep, response)
    expect(result.status, result.stderr).toBe(0)
    expect(result.output).toBe('already_started=false\n')
  })

  it.each([
    {},
    { assignees: [] },
    { assignees: [{ login: 'Copilot', type: 'User' }] },
  ])('fails explicitly when Copilot never appears as a bot assignee %#', (response) => {
    const result = run(assignStep, response)
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('::error::GitHub did not assign Copilot')
    expect(result.calls.filter((call) => call === 'api repos/alexandrehebert/soundlines/issues/1')).toHaveLength(6)
  })

  it('waits for the asynchronous Copilot assignment after an empty assignment response', () => {
    const result = run(assignStep, { assignees: [] }, 'test-token', 0, { assignees: [{ login: 'Copilot', type: 'Bot' }] })
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).not.toContain('::error::')
    expect(result.calls).toHaveLength(2)
  })

  it('fails before calling GitHub when the token is missing', () => {
    const result = run(assignStep, {}, '')
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('::error::Set the COPILOT_AGENT_TOKEN')
    expect(result.payload).toBe('')
  })

  it.each([guardStep, assignStep])('propagates GitHub API failures in %s', (name) => {
    const result = run(name, { message: 'API failure' }, 'test-token', 7)
    expect(result.status).toBe(7)
    expect(result.output).toBe('')
  })

  it('marks successful guard recovery as started without an assignment-only condition', () => {
    expect(step(markStep)).not.toContain('if:')
    const result = run(markStep, {})
    expect(result.status, result.stderr).toBe(0)
    expect(step(markStep)).toContain("--field 'labels[]=graph:agent-started'")
  })
})
