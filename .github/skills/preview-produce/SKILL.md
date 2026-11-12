---
name: preview-produce
description: "Render and stage ten-second catalogue previews using the historical Turbo and 1.7B planner workflow."
---

# Produce catalogue previews

Read `.github/skills/preview-produce/scripts/render-ace-previews.mjs` and `extract-ace-preview.py` before running. Use this pipeline, never the loop renderer or extractor.

Use the local ACE-Step 1.5 Turbo model with eight inference steps, the in-server `acestep-5Hz-lm-1.7B` planner, MLX backend and `thinking: true`. Verify server health and loaded model first. Reuse a compatible server; do not interrupt another job or load a second model server. The installation lives at `~/Tools/ACE-Step-1.5` (the script defaults `ACESTEP_PYTHON` to its `.venv/bin/python`); override `ACESTEP_HOME` or `ACESTEP_PYTHON` only for another location, never temporary storage. Keep persistent models, logs and progress outside the repository and outside temporary storage.

Render 32-second performances, extracting seconds 10–20 as stereo with 25 ms edge fades; encode AAC at 160 kbps. These previews are not seamless loops. The existing script validates finite, non-silent complete excerpts and encoded ten-second duration. Run `node .github/skills/preview-produce/scripts/render-ace-previews.mjs [genre ...]` with a writable `ACESTEP_PREVIEW_STATE`. It keeps up to two requests in flight while ACE-Step renders serially. Preserve resume logs and avoid per-clip agent calls.

For retakes set `ACESTEP_PREVIEW_RETAKE=1`, explicit genre arguments, a fresh `ACESTEP_PREVIEW_STATE`, and `ACESTEP_PREVIEW_OUTPUT` pointing to a separate staging directory. Never overwrite originals before comparison. Rock and Funk are protected reference clips; the runner skips existing copies, so explicitly requested reference retakes require a fresh staging directory.

Hand staged files, briefs, configuration and progress paths to preview-review. Stop only servers you started, including on failure. Do not claim to have listened or to have matched quality merely because settings match.

Genres added by graph contributions are listed in `PENDING_GENRE_PREVIEWS` (`src/data/genrePreviews.ts`). When one of their previews ships to `public/genre-previews/`, remove its id from that set in the same change; `src/data/genreSamples.test.ts` fails if the list and the shipped files disagree.
