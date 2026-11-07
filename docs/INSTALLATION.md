# Installation guide

[Back to README](../README.md) · [Development commands](./DEVELOPMENT.md)

Install only the tools needed for your workflow. Running Soundlines does **not**
require an AI assistant, an audio model server, a database, or cloud credentials.
The agents and skills are contributor workflows, not application services.

This guide uses the current repository documentation and scripts, plus the
upstream installation references linked below. Earlier setup conversations were
not retrievable during preparation; historical audio settings come from the
repository's recorded provenance, not an assumed machine configuration.

Commands are run from the repository root unless a section explicitly changes
directory. The primary setup below is macOS; Apple Silicon is the recorded
reference platform for audio production.

## 1. Choose your installation

| Workflow | Required tools | Optional tools |
| --- | --- | --- |
| App development, tests, graph validation | Git, Node.js 26 and npm, browser | VS Code, Docker Desktop with Compose |
| Container-only app and Storybook | Git, Docker with Compose, browser | Host Node.js for running validation outside containers |
| AI-assisted graph work | Core development tools, compatible coding assistant with terminal and web tools | GitHub CLI or GitHub MCP for issue/PR work |
| Instrument artwork | Node.js/npm, Python 3, Sharp, browser/Storybook | SVG editor; no drawing application is required for the Python generator |
| Seamless loop production | Core tools, ACE-Step 1.5 environment, compatible hardware, required checkpoints | FFmpeg for independent inspection |
| Catalogue preview production | Audio environment, Turbo and 1.7B checkpoints, macOS `afconvert` and `afinfo` | Audiobox Aesthetics and FFmpeg for review |
| Deployment administration | Vercel account and Vercel CLI or MCP | GitHub CLI |

Next.js, React, TypeScript, Vitest, oxlint, Tailwind and Storybook are installed
by `npm ci`. Do not install separate global copies.

## 2. Install the core tools

### macOS

1. Install [VS Code](https://code.visualstudio.com/download) if you want an editor
   with integrated agent support.
2. Install Apple's command-line tools if Git is not already available:

   ```bash
   xcode-select --install
   ```

3. Install [Homebrew](https://brew.sh/) using its official instructions. Follow
   the installer's shell/PATH setup, then install Node:

   ```bash
   brew install node@26
   export PATH="$(brew --prefix node@26)/bin:$PATH"
   ```

   Add the PATH line once to your shell profile (normally `~/.zshrc`) to preserve
   it in new terminals. If you already use [nvm](https://github.com/nvm-sh/nvm),
   use it instead; do not introduce a second Node installation unnecessarily:

   ```bash
   nvm install 26
   nvm use 26
   ```

4. Verify the active tools:

   ```bash
   git --version
   node --version
   npm --version
   ```

   Node must report `v26.x`, matching [package.json](../package.json) and
   [.nvmrc](../.nvmrc).

### Linux and Windows

Install Git, VS Code if desired, and Node.js 26 from the
[official Node distributions](https://nodejs.org/en/download) or a supported
version manager. On Windows, Git for Windows provides Git Bash for the
repository's Bash scripts; WSL2 is another option for development.

Keep dependencies in the environment that executes them. Do not reuse Windows,
Linux, and macOS `node_modules` across environments. The macOS/MLX audio recipes
below are not validated Windows or Linux recipes, and the catalogue renderer
currently requires macOS audio utilities.

### Clone and install

Skip cloning if the repository is already checked out.

```bash
git clone https://github.com/alexandrehebert/soundlines.git
cd soundlines
npm ci
```

`npm ci` uses the committed lockfile. It does not install the Python audio
environment or global agent integrations.

## 3. Run the local app and Storybook

### Native development

```bash
npm run dev
```

Open the URL printed by Next.js (normally `http://localhost:3000`). The French
app is available at `/fr`. In another terminal:

```bash
npm run storybook
```

Native Storybook defaults to `http://localhost:6006`. For port overrides,
production builds and server reuse, see [Development](./DEVELOPMENT.md).

### Docker Compose

Install [Docker Desktop](https://docs.docker.com/desktop/) for your OS and start
it. On Linux, Docker Engine plus the Compose plugin is an alternative. Verify
both the CLI and running daemon:

```bash
docker version
docker compose version
```

Before starting anything, check for an existing service:

```bash
docker compose ps
curl -fsS -o /dev/null http://localhost:5173/fr
```

Reuse a healthy existing service. Otherwise:

```bash
docker compose up -d
docker compose logs --tail=50 soundlines storybook
```

| Service | Compose URL | Native default |
| --- | --- | --- |
| App | `http://localhost:5173` | `http://localhost:3000` |
| Storybook | `http://localhost:6008` | `http://localhost:6006` |
| ACE-Step, only for audio production | Not included in Compose | `http://127.0.0.1:8020` |

Compose installs dependencies itself, bind-mounts the working tree, and keeps
container dependencies in separate named volumes. Source changes hot reload;
host `npm ci` is still needed for host-side tests and skill scripts.

**Current compatibility caveat:** [compose.yaml](../compose.yaml) specifies
`node:22-alpine`, while the package engine and CI use Node 26. A working existing
container is not evidence of Node 26 parity, and `npm ci` can report an engine
warning. Use the native Node 26 route when you need the declared runtime;
updating the Compose runtime is a separate repository change.

The container image also lacks Git and Python. Run graph diff tooling and the
full artwork gate on the host unless you explicitly provision a container for
them. Stop only services you own; do not remove dependency volumes to resolve
an unrelated tool or browser error.

### Core installation checks

```bash
npm run lint
npm test
npm run build
```

For graph-specific work, also run:

```bash
npm run review-status
npm run validate:graph
```

The first command intentionally regenerates
[review-status.json](../src/data/review-status.json); inspect the resulting diff.
Graph procedures are documented in [Data](./DATA.md).

## 4. Enable repository agents and skills

### VS Code and Copilot

1. Follow [Copilot setup](https://code.visualstudio.com/docs/setup/copilot):
   enable/install the GitHub Copilot integration offered by your VS Code
   version and sign in with an account that has agent access. Organization
   policies, model availability, quotas and billing can limit features.
2. Open the **repository root folder**, not an individual file. Review the
   checkout before granting Workspace Trust or terminal execution permission.
3. Select a compatible agent harness/session target in Chat. Open the Command
   Palette and run **Chat: Open Customizations**.
4. Verify that the repository's agents and skills appear. Select an agent in
   Chat or request a specific skill. Labels and available controls can vary
   with VS Code and harness versions.
5. Enable only the tools needed for the task, and approve reviewed commands.
   Graph research needs web access; validators need terminal execution;
   visual reviews need image viewing and browser access.

The repository already contains:

| Customization | Location | Purpose |
| --- | --- | --- |
| Custom agents | [.github/agents](../.github/agents) | Stage owners, tool restrictions and handoffs |
| Skills | [.github/skills](../.github/skills) | On-demand procedures, scripts and references |
| File instructions | [.github/instructions](../.github/instructions) | Guidance for matching file types and paths |

Nothing in these folders is an npm package. Do not install or copy every skill
into a global folder. Agent discovery and script execution are separate:
seeing `artwork-validator` in Chat does not install Python or make its gate pass.
Agents guide work when invoked; they do not automatically run the whole pipeline.

Try a read-only smoke test:

> Use graph-validator to run the existing graph validation gate and report the
> result. Do not edit files.

Then try artwork validation after completing section 5. Confirm the assistant
actually runs the documented command and reports its exit status, rather than
just describing what it would do.

### Optional terminal Copilot

If you also want a standalone terminal assistant, choose one installation:

```bash
npm install -g @github/copilot
```

Or on macOS:

```bash
brew install --cask copilot-cli
```

From the repository root, run `copilot`, then `/login` and `/help`. Review the
directory trust prompt. The CLI's supported agent fields and tool configuration
can differ from VS Code; verify discovery in that harness.
See [Copilot CLI setup](https://docs.github.com/en/copilot/get-started/cli-quickstart).
Installing the Copilot SDK in this application's dependencies is **not**
required to use these repository customizations.

### Browser tools and Python editor support

Use your assistant host's available browser tools for UI verification and
image-viewing tools for rendered artwork. Shared browser pages are session
state, not a dependency carried by the repository. Verify browser connectivity
to the running app separately from service health.

The deterministic tests use Vitest; they do not require a global Playwright
installation. If you choose a separate browser automation integration, follow
that integration's own browser/runtime installation instructions.

For editing Python, Microsoft's Python and Pylance VS Code extensions are
useful but optional. Select the intended interpreter with **Python: Select
Interpreter**. Terminal validators run with the executable you invoke, not
necessarily the interpreter selected in the editor. Pylance MCP tools require
a host integration that exposes them; installing a Python package alone does
not add those tools to an agent.

### Creating or modifying a customization

Reuse a nearby agent or skill as the template. Keep shared project files in the
locations above; personal plugins and cross-project configuration belong in
the host's supported user scope.

- A skill has a `SKILL.md` with YAML `name` and `description`, plus any bundled
  scripts or references. Match the name to its folder and describe when to use it.
- An agent is a `.agent.md` file with role description and supported tool fields.
- File instructions use `.instructions.md` and appropriate `applyTo` globs.
- Check YAML syntax, discovery, tool permissions and one representative
  execution after editing. A model change does not fix an incompatible harness.

See the official [skills](https://code.visualstudio.com/docs/agent-customization/agent-skills),
[agents](https://code.visualstudio.com/docs/agent-customization/custom-agents) and
[customization overview](https://code.visualstudio.com/docs/agent-customization/overview).

## 5. Install artwork tooling

The SVG generator uses Python's standard library. It does **not** require
CairoSVG, Pillow, an image-generation API or the ACE-Step environment.
Python 3.12 matches the artwork CI setup:

```bash
brew install python@3.12
export PATH="$(brew --prefix python@3.12)/libexec/bin:$PATH"
python3 --version
```

Preserve that PATH in your shell profile if needed. On other platforms install
Python 3.12 and ensure the `python3` command is available to the gate.

Sharp renders SVGs and PNG review sheets. It is normally installed transitively
with Next.js by `npm ci`. Verify the actual installation:

```bash
node -e "import('sharp').then(({default: sharp}) => console.log(sharp.versions))"
node .github/skills/artwork-brief/scripts/check-brief.mjs
node .github/skills/artwork-validate/scripts/check-artwork.mjs --require-render
```

The gate invokes `python3` for generator drift checks. `--require-render`
prevents missing Sharp from reducing validation to non-rendered checks.
If the import fails, first check the Node version and restore the lockfile
installation with `npm ci`. The gate documents `npm install --no-save sharp`
as a local missing-dependency workaround; do not use it to replace a broken
baseline install or silently change the shared dependency policy.

Create sheets outside the repository and run the relevant tests:

```bash
export ARTWORK_STAGE_ROOT="$HOME/.cache/soundlines-artwork"
node .github/skills/artwork-validate/scripts/check-artwork.mjs viola \
  --require-render --png-dir "$ARTWORK_STAGE_ROOT/viola"
npx vitest run scripts/artwork/validation.test.ts src/components/InstrumentIcon.test.tsx
```

Expected output includes findings and PNG sheets. A gate failure can indicate
an actual artwork defect, not a missing installation. Human Storybook sign-off
still follows validation; see [artwork procedures](../.github/skills/artwork-review/SKILL.md).

## 6. Install the optional audio environment

Skip this entire section if you only develop the app or play existing audio.
The app serves committed WAV and M4A files without contacting ACE-Step.

### Hardware and storage

The recorded final-loop workflow uses macOS Apple Silicon with MLX and about
25 GB of usable unified memory. It separates the 4B planner and XL SFT DiT
because loading both together exhausted that memory. This is a reference
configuration, not a guarantee for every machine.

Budget roughly 45 GB for the recorded installation/checkpoints, plus ample room
for Python dependencies, raw takes and caches. A 19 GB XL checkpoint is only
part of the footprint. Do not apply upstream's smaller core-model disk estimate
to the complete Soundlines final-quality model set.

Windows/Linux acceleration requires platform-specific upstream setup; the
Soundlines planner explicitly uses MLX and needs adaptation and verification
there. Do not silently substitute Turbo for the final-loop profile.

### Install ACE-Step outside temporary storage

On macOS:

```bash
brew install uv
uv python install 3.11
mkdir -p "$HOME/Tools"
git clone https://github.com/ACE-Step/ACE-Step-1.5.git "$HOME/Tools/ACE-Step-1.5"
cd "$HOME/Tools/ACE-Step-1.5"
uv sync --python 3.11
uv add librosa
```

ACE-Step currently declares Python `>=3.11,<3.13`; the recorded Soundlines
environment uses 3.11. Its macOS ARM dependencies include PyTorch/MPS, MLX and
MLX-LM; use its own dependency resolver instead of manually installing CUDA or
vLLM on a Mac. `uv python install` keeps the interpreter under
`~/.local/share/uv/python`, so the `.venv` survives reboots.

`~/Tools/ACE-Step-1.5` is the default `ACESTEP_HOME` of the loop and preview
scripts, so agents running non-interactive shells find it without exports.
Still persist these variables in `~/.zshrc` for your own shells, and set them
explicitly if you install elsewhere:

```bash
export ACESTEP_HOME="$HOME/Tools/ACE-Step-1.5"
export ACESTEP_PYTHON="$ACESTEP_HOME/.venv/bin/python"
export LOOP_STAGE_ROOT="$HOME/.cache/soundlines-loops"
export ARTWORK_STAGE_ROOT="$HOME/.cache/soundlines-artwork"
export ACESTEP_API_PORT=8020
mkdir -p "$LOOP_STAGE_ROOT" "$ARTWORK_STAGE_ROOT"
```

Never use `/tmp` or `/private/tmp` for the installation, checkpoints or durable
render progress. They can be purged. Keep models, takes, codes, logs and review
sheets outside the repository (a 45 GB checkout inside the project would also be
bind-mounted into Compose and watched by Vite). The scripts expect `.venv` and
`checkpoints` under `ACESTEP_HOME`; avoid an alternate shared-checkpoint layout
unless you also verify those expectations.

To rescue an existing install from temporary storage, move the checkout (with
its checkpoints) on the same volume, then rebuild the virtual environment,
which links to its original interpreter path:

```bash
mv /private/tmp/<old-dir>/<checkout> "$HOME/Tools/ACE-Step-1.5"
cd "$HOME/Tools/ACE-Step-1.5"
rm -rf .venv
uv python install 3.11
uv sync --python 3.11
uv add librosa
```

### Verify Python analysis dependencies

The loop scripts require NumPy, librosa, SoundFile and Matplotlib:

```bash
"$ACESTEP_PYTHON" -c "import acestep, mlx, numpy, librosa, soundfile, matplotlib; print('Audio imports OK')"
```

Upstream does not declare librosa, so a plain `uv sync` removes a
`pip`-installed copy; that is why the install above runs `uv add librosa`. If
analysis imports are missing after `uv sync`, add them to the **external
ACE-Step checkout**, not the Soundlines npm manifest:

```bash
cd "$ACESTEP_HOME"
uv add librosa numpy soundfile matplotlib
```

This deliberately changes the external environment's manifest and lockfile.
If SoundFile reports a missing native libsndfile library on macOS, install
`brew install libsndfile` and retry. Record the environment before production:

```bash
git rev-parse HEAD
uv pip freeze > "$LOOP_STAGE_ROOT/ace-python-packages.txt"
```

The Soundlines repository does not pin an ACE-Step commit. A fresh upstream
checkout may differ from the recorded API/backend behavior; verify it before
claiming equivalent provenance.

### Download the required checkpoints

From the ACE-Step checkout:

```bash
uv run acestep-download
uv run acestep-download --model acestep-5Hz-lm-4B
uv run acestep-download --model acestep-v15-xl-sft
ls "$ACESTEP_HOME/checkpoints"
```

The main download supplies shared assets, including `vae`,
`Qwen3-Embedding-0.6B`, `acestep-v15-turbo` and `acestep-5Hz-lm-1.7B`.
The two additional downloads supply the final-quality models. You do not need
`--all`, which downloads unrelated models.

| Use | DiT | Planner |
| --- | --- | --- |
| Shipped text-to-music loops | `acestep-v15-xl-sft`, 80 steps | Standalone `acestep-5Hz-lm-4B`, MLX |
| Source-conditioned loop arrangements | Same XL SFT settings | Original-source conditioning; no LM planning |
| Draft loops and catalogue previews | `acestep-v15-turbo`, eight steps | In-server `acestep-5Hz-lm-1.7B`, MLX |

See [upstream installation](https://github.com/ACE-Step/ACE-Step-1.5/blob/main/docs/en/INSTALL.md)
and the [recorded Soundlines configuration](../.github/skills/loop-produce/references/ace-step.md).

### Server and audio validation smoke tests

Return to the Soundlines root. Check for an existing server before starting one:

```bash
bash .github/skills/loop-produce/scripts/ace-server.sh status
```

No server is expected on a fresh installation. If one is running, inspect its
profile and ownership; do not interrupt somebody else's job. When the port is
free, test the draft server:

```bash
bash .github/skills/loop-produce/scripts/ace-server.sh start draft
curl -fsS http://127.0.0.1:8020/health
```

Require initialized models and `loaded_model: acestep-v15-turbo`; for previews,
also verify the in-server planner configuration. Logs and the PID file are
under `LOOP_STAGE_ROOT`. Stop the server you started after testing:

```bash
bash .github/skills/loop-produce/scripts/ace-server.sh stop
node .github/skills/loop-brief/scripts/check-brief.mjs scripts/loops/briefs/turntable-hip-hop.json
"$ACESTEP_PYTHON" .github/skills/loop-validate/scripts/check-loop.py \
  scripts/loops/briefs/turntable-hip-hop.json public/loops/turntable-hip-hop.wav \
  --png-dir "$LOOP_STAGE_ROOT/turntable-hip-hop-install-check/png"
```

Validating the existing WAV does not render or overwrite audio. Final-quality
production follows [loop-produce](../.github/skills/loop-produce/SKILL.md):
plan codes with **no server running**, then start the final XL server, render,
screen takes, extract, validate and review. Keep only one server/job active;
human listening remains required. Do not render five takes just to test installation.

## 7. Catalogue previews and scoring

### macOS encoding tools

The [preview renderer](../.github/skills/preview-produce/scripts/render-ace-previews.mjs)
executes Apple's built-in `afconvert` and `afinfo`:

```bash
command -v afconvert
command -v afinfo
```

Installing FFmpeg does **not** make this renderer portable to Linux or Windows.
FFmpeg is optional for independent decoding, inspection and scoring preparation:

```bash
brew install ffmpeg
ffmpeg -version
ffprobe -version
```

With the compatible draft/Turbo server available, set a persistent progress path:

```bash
export ACESTEP_PREVIEW_STATE="$HOME/.cache/soundlines-previews/progress.txt"
mkdir -p "$(dirname "$ACESTEP_PREVIEW_STATE")"
```

The preview renderer currently hardcodes port **8020**, unlike the loop
renderer, which reads `ACESTEP_API_PORT`. Changing that variable alone does
not move catalogue preview requests.

To produce an authorized, isolated test clip without replacing shipped assets:

```bash
export ACESTEP_PREVIEW_OUTPUT="$HOME/.cache/soundlines-previews/install-check"
node .github/skills/preview-produce/scripts/render-ace-previews.mjs rock
```

This performs a real render and consumes time/memory. Existing files and progress
can cause a clip to be skipped; use a fresh output/progress location for a new
test. Normal production and staged retakes follow
[preview-produce](../.github/skills/preview-produce/SKILL.md), not loop extraction.
The output should be a ten-second stereo AAC `.m4a` file.

### Optional Audiobox Aesthetics scorer

The preview review skill requires PQ, CE, CU and PC scores, but the historical
batch-review scripts are **not bundled**. Installing the model library supplies
a scorer, not the complete defect checks, comparison manifest or replacement
automation. Report review as incomplete until those steps are implemented or
recovered and verified.

Use a separate environment to avoid changing ACE-Step's Torch dependencies:

```bash
uv venv --python 3.12 "$HOME/Tools/audiobox-aesthetics-env"
uv pip install --python "$HOME/Tools/audiobox-aesthetics-env/bin/python" audiobox_aesthetics
"$HOME/Tools/audiobox-aesthetics-env/bin/audio-aes" --help
```

Following the [upstream scorer usage](https://github.com/facebookresearch/audiobox-aesthetics),
create an input JSONL file outside the repository with one absolute decoded-audio
path per line:

```json
{"path":"/absolute/path/to/preview.wav"}
```

For example, decode the staged clip with FFmpeg, then score the input list:

```bash
ffmpeg -i "$ACESTEP_PREVIEW_OUTPUT/rock.m4a" \
  "$ACESTEP_PREVIEW_OUTPUT/rock.wav"
"$HOME/Tools/audiobox-aesthetics-env/bin/audio-aes" \
  /absolute/path/to/input.jsonl --batch-size 1 \
  > /absolute/path/to/scores.jsonl
```

The model checkpoint downloads on first use. Verify device/backend support
with the installed version; no macOS acceleration guarantee is implied.
Record package/checkpoint versions and configuration, calibrate against the
approved Rock and Funk files, and follow
[preview-review](../.github/skills/preview-review/SKILL.md). Scores are heuristics,
not proof of genre authenticity or a substitute for listening.

## 8. Optional external integrations

None of these services is needed for local playback, graph validation or
artwork generation.

| Integration | When to configure it | Installation/configuration |
| --- | --- | --- |
| GitHub CLI | Terminal issues, PRs and repository administration | `brew install gh`, then `gh auth login` and `gh auth status` |
| GitHub MCP or connector | Agent tools for GitHub resources | Add the publisher's integration in the selected harness and authenticate |
| Vercel CLI | Deployment and project administration | `npm install -g vercel`, then `vercel login`; link only the intended project |
| Vercel plugin/MCP | Vercel-specific agent skills and platform tools | Install the official plugin/integration in the host and authenticate |
| Neon MCP | Work on a Neon-backed service | Configure only if that task actually requires Neon |
| Inngest MCP | Work on Inngest workflows | Configure only if that task actually requires Inngest |

Neon and Inngest tools appearing in a chat do not mean Soundlines uses those
services. Likewise, Vercel/Pylance/plugin skills provided by an editor profile
are not installed by this repository's `npm ci`.

Use the host's customization/MCP interface and the publisher's official setup,
then verify one read-only tool call. Configuration destinations and formats
depend on the harness: current Copilot portable configurations use `mcpServers`,
while VS Code-format configurations use `servers`. Do not blindly copy one
format into another. See [MCP setup](https://code.visualstudio.com/docs/agent-customization/mcp-servers).

Keep tokens and credentials in the supported credential store or private user
configuration. Do not commit them, copy another user's profile, or grant broad
database/deployment write access just to make a validator work. Use the smallest
required permissions and request approval for destructive operations.

## 9. Troubleshooting checklist

| Symptom | Check / action |
| --- | --- |
| Wrong Node or engine warning | Check `node --version` in the actual terminal/container; host needs Node 26, current Compose image is Node 22 |
| `docker compose` cannot connect | Start Docker and verify `docker version`; installing the CLI alone does not start the daemon |
| Port already in use | Inspect existing Compose/server health and reuse it; do not start duplicate services or kill processes by name |
| Browser tool fails but `curl` succeeds | Check the browser host's connectivity; this is not proof the app is down |
| Agents/skills do not appear | Open repository root, check trust, selected harness, customization discovery and YAML; reload the window or start a new chat |
| Agent sees skill but cannot execute it | Check terminal/tool permissions and PATH on the machine where the agent runs |
| `python3` missing in artwork gate | Install/select host Python; ACE-Step's `.venv` alone does not expose `python3` to that gate |
| Sharp import fails / render checks skipped | Restore npm dependencies and rerun with `--require-render`; do not accept skipped checks as a full pass |
| Audio Python import fails | Use `ACESTEP_PYTHON`, check `uv sync` and `uv add librosa` in the external environment |
| `.venv/bin/python` is a broken link | The venv was moved from its original location; `rm -rf .venv && uv sync --python 3.11 && uv add librosa` |
| API unavailable or wrong model | Check port 8020, logs and `/health`; wait for initialization and verify the workflow's model/profile |
| MPS out of memory | Stop only your own job; separate final planner and XL rendering phases, and free sufficient memory |
| Preview encoding command missing | Current renderer needs macOS `afconvert`/`afinfo`; FFmpeg is not a drop-in installation fix |
| Preview was skipped | Inspect existing asset/output and progress paths before assuming a render happened |
| Scorer installed but review incomplete | The historical batch scorer/selection automation is absent; validate decoded audio and score/comparison manifests explicitly |
| Setup disappears after restart | Move durable installs/models/staging out of temporary directories and persist non-secret shell exports |

An installation is ready when its relevant command actually runs, its service
responds when needed, required checks are not skipped, and its configuration
survives a new terminal. Validation failures should remain visible: distinguish
missing tooling from genuine graph, artwork or audio defects.
