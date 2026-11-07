---
name: loop-validate
description: 'Run the deterministic quality gate on Soundlines ACE-Step loops: brief lint, raw-take screening and shipped-loop checks (exact length, tempo, seamless wrap, peak/RMS, clipping, DC, bar stability, dropouts, low-end mono, vocal-band and brightness heuristics) with spectrogram sheets. Use after rendering takes, after extracting a loop, before committing a loop asset, or when a loop clicks, drifts, clips or sounds uneven.'
argument-hint: 'Brief slug plus the takes folder or loop file to check'
---

# Validate loops

Validation answers one question: **is the audio mechanically correct?** It is deterministic and never
judges musical taste or genre authenticity (`loop-review`), and never edits briefs or audio.

## Run

```sh
PY=$ACESTEP_HOME/.venv/bin/python
V=.github/skills/loop-validate/scripts/check-loop.py
node .github/skills/loop-brief/scripts/check-brief.mjs [scripts/loops/briefs/<slug>.json]     # brief lint
$PY $V scripts/loops/briefs/<slug>.json $STAGE/takes/*.wav --takes --png-dir $STAGE/png     # take screening
$PY $V scripts/loops/briefs/<slug>.json <asset.wav> --png-dir $STAGE/png                   # shipped loop
```

Exit code 1 means at least one FAIL. The PNGs (mel + harmonic 0-5 kHz; loops tiled ×2 with the seam in
the middle) are written for the reviewer; mention their paths.

## Checks

| Metric | Loop | Take | Meaning / usual cause → owner of the fix |
|---|---|---|---|
| `length_error_ms` | FAIL > 1 | – | not exactly bars×meter beats → re-extract (`loop-produce`) |
| `tempo_error_pct` | FAIL > 1 | FAIL > 1.5 | drifting or wrong-tempo take → discard take / retake |
| `wrap_jump_ratio` | FAIL > 1 | – | wrap step larger than the loop's 99.9th-pct sample step = click → re-extract |
| `peak_dbfs` | FAIL outside −1.1…−0.9 | – | not normalised by the extractor |
| `clipped_samples` | FAIL > 0 | WARN > 0 | render clipping → discard take |
| `dc_offset` | FAIL > 0.002 | – | extractor bypassed |
| `bar_rms_cv` | FAIL > 0.15 | – | build/drop inside loop → other candidate/take, or brief loop-form clause |
| `longest_dropout_ms` | FAIL > 250 | FAIL > 400 (3 s…end−5 s) | silence/break → discard take, or brief "no breakdown" |
| `rms_dbfs` | WARN outside −20…−10 | – | thin or crushed mix → reviewer judges |
| `low_end_correlation` | WARN < 0.8 | – | wide/phasey bass below 150 Hz → reviewer judges |
| `vocal_band_ratio` | WARN > 0.08 | WARN > 0.08 | heuristic only (instrumentals measure 0.001-0.04) → reviewer inspects harmonic PNG |
| `high_band_db` | WARN < −38 | WARN < −38 | dull top end; normal for some vintage genres → reviewer judges |

Reference: the shipped hip-hop loop measures length error 0.68 ms, tempo error 0.28 %, wrap ratio
0.012, RMS −14.1 dBFS, bar CV 0.07, vocal band 0.022, high band −33.2 dB.

## Rules

- Never loosen a threshold to pass one asset. Change thresholds only with new calibration evidence
  (several references), in `check-loop.py`, with this table and the reference line updated.
- A FAIL in take mode removes the take from extraction; it is not a brief problem unless most takes fail
  the same way.

## Report

`PASS` / `WARN (n)` / `FAIL (n)` per file, then per finding: metric | value | limit | likely cause |
owner (`loop-produce` re-extract/retake, or `loop-brief` revision). List PNG paths for the reviewer.
