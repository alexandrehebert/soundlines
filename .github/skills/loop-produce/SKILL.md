---
name: loop-produce
description: 'Render a pro-quality seamless genre loop with the local ACE-Step 1.5 install from an approved brief (docs/loops/briefs/<slug>.json): server lifecycle, two-phase 4B-LM planning + XL SFT DiT rendering at 80 steps, take screening, grid-snapped loop extraction and export to public/loops/<slug>.wav. Use when generating, re-rendering, retaking or drafting an audio loop for a genre, or when ACE-Step renders fail, run out of memory or use the wrong model.'
argument-hint: 'Brief slug to render, e.g. "turntable-hip-hop", optionally "draft" or extra seeds'
---

# Produce a loop with ACE-Step

You turn an approved brief into a shipped WAV loop plus its selection report. You do not write or edit
briefs (`loop-brief`), set quality thresholds (`loop-validate`) or decide whether it ships (`loop-review`).
Read [references/ace-step.md](./references/ace-step.md) once: it holds the verified configuration and
every failure mode met so far.

## Environment

```sh
export ACESTEP_HOME=${ACESTEP_HOME:-$HOME/Tools/ACE-Step-1.5}  # default install; contains checkpoints/ and .venv/
export LOOP_STAGE_ROOT=$HOME/.cache/soundlines-loops # takes live here, never in the repo or /tmp
PY=$ACESTEP_HOME/.venv/bin/python                   # has acestep, mlx, librosa, soundfile, matplotlib
S=.github/skills/loop-produce/scripts
STAGE=$LOOP_STAGE_ROOT/<slug>
```

Check `ls $ACESTEP_HOME/checkpoints` lists `acestep-v15-xl-sft`, `acestep-5Hz-lm-4B`, `vae`. If
ACESTEP_HOME is under `/tmp` or `/private/tmp`, warn the user: macOS purges it on reboot (≈45 GB).

## Procedure (final quality)

1. **Lint the brief** — `node .github/skills/loop-brief/scripts/check-brief.mjs docs/loops/briefs/<slug>.json`.
   On FAIL stop and hand back to `loop-brief`; never patch the prompt yourself.
2. **Plan codes (LM phase, no server running)** — `$S/ace-server.sh stop`, then
   `cd $ACESTEP_HOME && $PY <repo>/$S/plan-codes.py <repo>/docs/loops/briefs/<slug>.json $STAGE`
   (~1 min load + ~20 s/seed). Codes are keyed to a hash of prompt/bpm/meter/key/duration; a changed
   brief invalidates them automatically.
3. **Render takes (DiT phase)** — `$S/ace-server.sh start final` (≈2 min, verifies the XL model is
   loaded), then `node $S/render-takes.mjs docs/loops/briefs/<slug>.json $STAGE final`. ≈7 min per
   seed (80 steps × ~5 s on 25 GB M-series); five seeds ≈ 40 min. Run it as an async/background
   command and wait for completion; it resumes and skips finished seeds if interrupted.
4. **Screen takes** — have `loop-validate` run take mode on `$STAGE/takes/*.wav` with `--png-dir $STAGE/png`.
   Move FAIL takes to `$STAGE/rejected/` (with the reason) so the extractor ignores them. If fewer
   than two takes survive, render extra seeds (`render-takes.mjs … final <seed> …` after planning them).
5. **Extract** — `$PY $S/extract-loop.py docs/loops/briefs/<slug>.json $STAGE/takes <asset> docs/loops/briefs/<slug>.selection.json`
   where `<asset>` is the brief's `asset` or `public/loops/<slug>.wav`.
6. **Stop the server** — `$S/ace-server.sh stop` (it holds ~22 GB).
7. **Hand off** to `loop-validate` (loop mode on the asset) and then `loop-review`, passing `$STAGE`.

## Draft profile (optional, brief iteration only)

`$S/ace-server.sh start draft` then `render-takes.mjs … draft` renders turbo 8-step takes with the
in-server 1.7B planner in ~30 s each into `$STAGE/drafts/`. Use drafts only to hear whether a new brief
is in the right territory; never extract a shipped asset from drafts. No `plan-codes.py` needed.

## Source-conditioned arrangement profile

For another arrangement of an original Soundlines loop, the brief includes
`arrangement: { source: "public/loops/<slug>.wav", strength: 0.75 }`.
Use `arrange-loop.py prepare <brief> <stage>` to repeat the original loop for source conditioning,
then `render-takes.mjs <brief> <stage> arrangement <seed ...>` with the final XL server.
Cover mode uses source-audio conditioning and automatically bypasses LM planning; never claim
4B-planned-code provenance for this profile. Keep XL SFT, 80 steps, guidance 7, ADG and shift 1.
After take screening, use `arrange-loop.py extract <brief> <stage> <asset> <report>`.
Extraction compares only source-aligned full cycles and preserves the exact source sample count.
The report records source checksum, source frame count and time-aligned chroma comparison.
Run the unchanged loop gate and compare both versions by ear before approval: matching tempo/key
or a high chroma score alone does not prove the melody is preserved.

## Rules

- Never ship from `acestep-v15-turbo` or `acestep-v15-base`; both shipped profiles use XL SFT,
  80 steps, guidance 7, ADG, shift 1. Text-to-music requires 4B LM codes; source-conditioned
  arrangements require recorded original-source provenance. Do not lower steps to save time.
- Do not run the LM and XL DiT in the same process or with the server up during planning (MPS OOM).
- Keep the loop WAV (PCM16). Never transcode loops to AAC/MP3: encoder padding breaks the seamless wrap.
- Only the asset and `<slug>.selection.json` enter the repo; takes, codes, PNGs and logs stay in `$STAGE`.
- One server, one job at a time (`workers=1`, in-memory queue); never start a second instance.
- Stop processes by the PID file (`ace-server.sh stop`), never by name.
