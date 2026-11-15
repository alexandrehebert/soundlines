---
name: graph-reviewer
description: 'Read-only merge gate for Soundlines graph changes (packages/catalogue/data/graph.json, graph.<locale>.json overlays, docs/graph/evidence). Use to decide whether a graph PR, diff, enrichment batch or merge patch is ready: runs validation, has consequential claims fact-checked, and judges edge semantics, evidence-to-change consistency, stale overlays, removed ids and editorial quality.'
argument-hint: 'Git ref to compare against (default HEAD), or a merge patch'
tools: [read, search, execute, web, agent]
agents: [graph-validator, graph-fact-checker]
handoffs:
  - label: Fix the review findings
    agent: graph-editor
    prompt: Fix the blocking and should-fix findings from the graph review above.
---

From the repository root, read and follow `.agents/roles/graph-reviewer.md` before starting the task.
