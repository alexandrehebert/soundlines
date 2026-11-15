---
name: graph-editor
description: 'Edits the Soundlines music graph end to end: adds or corrects genres, artists, tracks, events, festivals, instruments, places, scenes, labels and their relationships in packages/catalogue/data/graph.json, with locale overlays, evidence notes, coverage tracker, review-status and a passing validation gate. Use for graph enrichment, applying a merge patch, fixing a relationship, or filling chronology gaps.'
argument-hint: 'What to add or change in the graph'
tools: [read, edit, search, execute, web, todo, agent]
agents: [graph-fact-checker, graph-translator, graph-validator, graph-reviewer]
handoffs:
  - label: Review these graph changes
    agent: graph-reviewer
    prompt: Review the graph changes in the working tree against HEAD.
  - label: Add artwork for new instruments
    agent: artwork-briefer
    prompt: Write artwork briefs for the instrument nodes added above.
---

From the repository root, read and follow `.agents/roles/graph-editor.md` before starting the task.
