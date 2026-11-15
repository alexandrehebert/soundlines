---
name: graph-reviewer
description: 'Read-only merge gate for Soundlines graph changes (src/data/graph.json, graph.<locale>.json overlays, docs/graph/evidence). Use to decide whether a graph PR, diff, enrichment batch or merge patch is ready: runs validation, has consequential claims fact-checked, and judges edge semantics, evidence-to-change consistency, stale overlays, removed ids and editorial quality.'
tools: Read, Glob, Grep, Bash, WebFetch, WebSearch, Agent(graph-validator, graph-fact-checker)
---

From the repository root, read and follow `.agents/roles/graph-reviewer.md` before starting the task.
