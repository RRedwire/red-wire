# RedWire

**red-wire.org** — open infrastructure for a less restricted web.

A competitor to the TitaniumNetwork model: instead of a directory of unrelated forks, RedWire is one
transport layer, one brand, and a deployment path for every service. The site is static, the proxy is
real, and every piece is self-hostable.

## What's in here

| Path | What it is |
| --- | --- |
| `index.html` | Landing page |
| `projects/` | Filterable project catalog |
| `company/` | Mission, principles, roadmap, security model and changelog |
| `docs/` | Quickstart, architecture, deploy targets, troubleshooting |
| `status/` | Beacon — browser-side reachability checks |
| `assets/` | Design system, emblem, generated icons and OG card |
| `services/redline/` | **Working UBG proxy**: Ultraviolet + BareMux + Epoxy over WISP |
| `services/signal/` | Manifest-driven link hub |
| `packages/wirekit/` | Client bootstrap extracted from Redline |
| `scripts/discord-notify.mjs` | Portable Discord update logger |
| `scripts/install-discord-workflow.mjs` | Adds the notifier to every repo in the org |
| `.github/workflows/` | Repo notifier + reusable notifier for other repos |

## Run the site

```bash
npm run serve
# http://localhost:4173
```

It serves only the public site files — `.env`, scripts and `node_modules` are never exposed.

## Run the proxy

```bash
cd services/redline
npm install
npm start
# http://localhost:8080
```

Node 20+. The process serves the shell, the UV runtime, BareMux, Epoxy and the WISP relay. Service
workers require HTTPS or localhost, so test on `localhost` first.

## Deploy

**Static site → Cloudflare Pages**

```bash
npm run build
npx wrangler pages deploy dist --project-name redwire
```

The build step copies only the public site into `dist/` — no `node_modules`, scripts or env files.
Add `red-wire.org` under the Pages project's Custom domains. The zone already lives in Cloudflare, so
the DNS record is created for you.

**Redline → any Node host with WebSocket support**

```bash
docker compose up --build -d
```

Fly, Railway, Render and plain VPS all work. Cloudflare Pages cannot host the relay: the WISP endpoint
needs a long-lived WebSocket backend. Keep the static site on Pages and the proxy on a container.

Full instructions, including the Nginx upgrade headers and Docker/Fly commands, live in `docs/`.

## Discord update log

The org webhook is stored in `DISCORD_WEBHOOK_URL`. It is **not** committed: `.env` is gitignored and
CI reads it from an Actions secret.

### 1. Create the org secret

GitHub → **RRedwire** → Settings → Secrets and variables → Actions → **New organization secret**

- Name: `DISCORD_WEBHOOK_URL`
- Value: the webhook URL
- Repository access: **All repositories**

### 2. Add the notifier to a repo

Either drop this into `.github/workflows/notify.yml`:

```yaml
name: Discord update log

on:
  push:
  pull_request:
    types: [opened, reopened, closed]
  release:
    types: [published]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  notify:
    uses: RRedwire/red-wire/.github/workflows/reusable-notify.yml@main
    secrets: inherit
```

Or run the installer against the whole org:

```bash
GITHUB_TOKEN=ghp_... node scripts/install-discord-workflow.mjs          # dry run
GITHUB_TOKEN=ghp_... node scripts/install-discord-workflow.mjs --apply  # write
```

The token needs `repo` scope. The installer skips archived repos and any repo that already has the
workflow.

### 3. Test locally

```bash
npm run notify:test
```

`scripts/discord-notify.mjs` reports pushes, pull requests and releases. It degrades quietly in CI if
the secret is missing, so a repo without the secret will not break its build.

> If the webhook URL has been pasted into a public place, rotate it in Discord: Channel settings →
> Integrations → Webhooks. Treat it as a password; anyone with it can post to the channel.

## Stack

- [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet) — service-worker proxy core
- [BareMux](https://github.com/MercuryWorkshop/bare-mux) — transport abstraction
- [Epoxy](https://github.com/MercuryWorkshop/epoxy-tls) — encrypted transport
- [WISP](https://github.com/MercuryWorkshop/wisp-protocol) — WebSocket stream protocol

All upstream projects are AGPL-3.0. RedWire's own code is AGPL-3.0 unless a file says otherwise.

## Links

- Site: https://red-wire.org
- GitHub: https://github.com/RRedwire
- Workshop: https://github.com/OGsWorkshop
- Discord: https://discord.gg/JjdQaNJ3Rj
- Flagship proxy: https://infrared.earth

Built by Red60 / RRedwire and OGsWorkshop.
