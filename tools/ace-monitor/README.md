# ACE Monitor

A small, read-only dashboard for the ACE-Step **REST API** already used by
Soundlines render scripts. Independent Next.js / React / TypeScript app, one
Compose service, plain CSS, no account system, i18n or theme switching.

## Run

Start ACE using your usual workflow first, then:

```bash
cd tools/ace-monitor
docker compose up -d
```

Open <http://localhost:5180>. The dashboard refreshes three seconds after each
request completes; refresh can be paused. This does not pause rendering.
Stop only the monitor with `docker compose down`.

ACE continues running on the host (including its native MLX backend). This
container does not load models, submit jobs, cancel jobs or modify the ACE install.
It mounts the cache and log directory **read-only** and proxies API requests
server-side. The dashboard is bound to localhost; do not expose it publicly.
The API key, if needed, stays server-side.

The first default port matches `.github/skills/loop-produce/scripts/ace-server.sh`.
The monitor scans that port and the next nine on every refresh:

| Environment variable | Default |
| --- | --- |
| `ACE_MONITOR_PORT` | `5180` |
| `ACE_API_URL` | `http://host.docker.internal:8020` (host and first port) |
| `ACE_API_PORT_COUNT` | `10` (scan 8020–8029; allowed range 1–100) |
| `ACE_API_KEY` | empty (same key for each server) |
| `ACESTEP_HOME` | `$HOME/Tools/ACE-Step-1.5` |
| `LOOP_STAGE_ROOT` | `$HOME/.cache/soundlines-loops` |

Set overrides in the shell or a local `.env` (ignored by Git). The ACE cache
directory must exist at `$ACESTEP_HOME/.cache/acestep/local_redis`; the log is
`$LOOP_STAGE_ROOT/ace-server.log`. Compose refuses to create missing source
directories. Mount the whole cache directory so SQLite can see its WAL/SHM files.
On Docker Desktop, `host.docker.internal` reaches the host server. On Linux,
ACE must listen on an interface reachable from Docker, rather than only loopback.
For example, to scan ports 8030–8034, set `ACE_API_URL` to
`http://host.docker.internal:8030` and `ACE_API_PORT_COUNT` to `5`, then run
`docker compose up -d` to apply the environment. Set the count to `1` to monitor
only the configured URL. Discovery checks the public health endpoint without
sending the API key and only queries services identifying themselves as ACE-Step.

## What it shows

- A card for each discovered server, with health, model readiness, loaded DiT and
  language models, queued/running/succeeded/failed counts, queue capacity and
  average render time. Counts come from that server's in-memory job store.
- Latest 100 unexpired task IDs from the mounted cache, queried across discovered
  servers and deduplicated. Includes tasks submitted by existing scripts; active
  tasks sort first.
- Reported stage/progress, prompt, seed, result metadata, failures, audio playback
  and downloads through `/v1/audio`.
- Last 150 lines from a bounded 64 KiB tail of the configured log file, omitting
  HTTP polling noise. The file may not cover every server.
- Explicit partial errors when the API, cache, log or audio is unavailable.

**Limits:** ACE has no task-list endpoint, so task discovery reads only keys and
expiry timestamps from its diskcache SQLite database. Result data comes from the
API, not Python pickles. This depends on upstream's `Cache` schema and
`ace_step_v1.5_` key prefix. Cache expiry limits history; audio files may be removed
independently. This is not a permanent render archive. Each server's counts
reflect its in-memory job store and can reset on restart, unlike cached history.
The mounted cache can be shared by multiple servers, and ACE does not expose a
task's originating port. The shared history therefore cannot be attributed to an
individual server, and queued tasks might not be in the cache yet. Only the
configured cache is searched; servers using another install/cache can contribute
status and queue counts but not discover their own task IDs. ACE's progress text
is server-wide, not a per-task log. Some failures in upstream's cache omit the
detailed error. Audio requests try discovered servers until one can serve the
file, because their allowed audio directories may differ.

## Checks

Inside the running container:

```bash
docker compose exec ace-monitor npm test
docker compose exec ace-monitor npm run typecheck
docker compose exec ace-monitor npm run lint
docker compose exec ace-monitor npm run build
```

Or use `npm ci` and the same npm commands locally with a recent Node.js (22.18+
or 26). SQLite uses Node's built-in `node:sqlite`. Dependencies and build cache
are isolated from Soundlines.

## Existing alternatives

ACE-Step's built-in [Gradio UI](https://github.com/ace-step/ACE-Step-1.5)
is a full generation interface. [ACE-Step UI](https://github.com/fspecii/ace-step-ui)
adds a music library and generation workflow using Gradio. Neither is needed
to monitor the existing REST render server.
