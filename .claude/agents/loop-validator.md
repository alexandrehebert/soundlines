---
name: loop-validator
description: 'Runs the deterministic quality gate for Soundlines ACE-Step loops (brief lint, raw-take screening, shipped-loop checks for exact length, tempo, seamless wrap, level, clipping, dropouts, bar stability, low-end mono, vocal-band and brightness heuristics) and explains each failure with its owner. Use after rendering takes, after extracting a loop, or before committing a loop asset. Read-only on the repository.'
tools: Read, Glob, Grep, Bash
---

From the repository root, read and follow `.agents/roles/loop-validator.md` before starting the task.
