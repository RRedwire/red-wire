<p align="center">
  <kbd>
    <img width="150" src="https://red-wire.org/assets/img/redwire-mark.png" alt="RedWire" />
  </kbd>
</p>

<h1 align="center">RedWire</h1>

<p align="center">
  <a href="https://discord.gg/JjdQaNJ3Rj"><img height="30" src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" /></a>
  <a href="https://github.com/RRedwire"><img height="30" src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
  <a href="https://red-wire.org"><img height="30" src="https://img.shields.io/badge/Website-E5485B?style=for-the-badge&logo=firefox&logoColor=white" alt="Website" /></a>
  <a href="https://red-wire.org/docs"><img height="30" src="https://img.shields.io/badge/Docs-E5485B?style=for-the-badge&logo=readthedocs&logoColor=white" alt="Documentation" /></a>
  <a href="./LICENSE"><img height="30" src="https://img.shields.io/badge/License-AGPL--3.0-E5485B?style=for-the-badge" alt="AGPL-3.0" /></a>
</p>

**Website:** https://red-wire.org  
**Documentation:** https://red-wire.org/docs

### About

RedWire is an independent organization building open, self-hostable browsing infrastructure. We work on
web proxy services, the transport stack behind them and the browser tooling around them.

Our focus is practical deployment: every service ships with source, a reference deployment and a path to
run it yourself. No ads, no account system and no upstream dependency you cannot replace.

The stack is built on the open UBG ecosystem — [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet),
[BareMux](https://github.com/MercuryWorkshop/bare-mux), [Epoxy](https://github.com/MercuryWorkshop/epoxy-tls)
and [WISP](https://github.com/MercuryWorkshop/wisp-protocol) — with the deployment and service layer
maintained here.

### Services

#### Flagship

- [Infrared](https://infrared.earth) — the hosted proxy. Games, apps, tab cloaking and ad-free deployment.

#### Self-hosted

- [Redline](https://red-wire.org/browse/) — reference Ultraviolet + BareMux + Epoxy/WISP deployment. One command, your edge.

#### Games

- [RedArcade](https://red-wire.org/play/) — four original browser games. No accounts, ads or installs.

#### WebOS

- [RedOS](https://github.com/Red60sapphire/redos) — a desktop in a tab, with a terminal and Linux emulation.

#### Infrastructure

- [Signal](https://red-wire.org/services/signal/) — one manifest of mirrors, rendered as a link hub.
- [RedKit](https://red-wire.org/docs/#redkit) — client bootstrap for adding a proxy to any site.
- [RedRelay](https://red-wire.org/company/#roadmap) — hardened WISP relay (planned).
- [Mirror](https://red-wire.org/company/#roadmap) — fleet manager for Redline instances (planned).
- [Beacon](https://red-wire.org/status/) — browser-side reachability checks.

### Projects

<details>
<summary>Overview</summary>

#### Active

##### Proxies

- [Redline](./services/redline) — Ultraviolet, BareMux and Epoxy over a WISP relay
- [Infrared](https://github.com/OGsWorkshop/Infrared) — hosted flagship proxy

##### Services

- [RedArcade](./play) — static games portal and four original games
- [RedOS](https://github.com/Red60sapphire/redos) — browser desktop
- [Signal](./services/signal) — manifest-driven link hub
- [Beacon](./status) — client-side status checks

##### Tooling

- [RedKit](./packages/redkit) — proxy client bootstrap
- [Organization site](./index.html) — the organization site and documentation

#### Planned

- [RedRelay](https://red-wire.org/company/#roadmap) — hardened WISP relay
- [Mirror](https://red-wire.org/company/#roadmap) — multi-instance fleet manager

#### Upstream

- [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet) — service-worker proxy core
- [BareMux](https://github.com/MercuryWorkshop/bare-mux) — transport abstraction
- [Epoxy](https://github.com/MercuryWorkshop/epoxy-tls) — encrypted transport
- [WISP](https://github.com/MercuryWorkshop/wisp-protocol) — WebSocket stream protocol

</details>

### Deploy

**Redline (proxy + relay)**

```bash
git clone https://github.com/RRedwire/red-wire
cd red-wire/services/redline
npm install
npm start
# http://localhost:8080
```

Node 20+. Service workers require HTTPS or localhost. See [the docs](https://red-wire.org/docs/#quickstart)
for Docker, Fly, Railway, VPS and reverse-proxy setup.

**Static site**

```bash
npm install
npm run build
npx wrangler pages deploy dist --project-name redwire
```

Cloudflare Pages can host the site and the static shell, but not the WISP relay. Run Redline on a
container host with WebSocket support.

### Repository layout

| Path | What it is |
| --- | --- |
| `index.html` | Organization landing page |
| `browse/` | Browsing services: hosted Infrared and self-hosted Redline |
| `play/` | RedArcade — playable browser games |
| `projects/` | Filterable project catalog |
| `company/` | Mission, roadmap, security model and changelog |
| `docs/` | Quickstart, architecture, deployment and troubleshooting |
| `status/` | Beacon — browser-side reachability checks |
| `services/redline/` | Working Ultraviolet + BareMux + Epoxy/WISP proxy |
| `services/signal/` | Manifest-driven link hub |
| `packages/redkit/` | Client bootstrap extracted from Redline |
| `assets/` | Design system, emblem and generated icons |

### Contributing

Issues and pull requests are welcome. For deployment help, links or security reports, join the
[Discord](https://discord.gg/JjdQaNJ3Rj). If you are making large changes, test the proxy and the
static build before opening a pull request.

### License

AGPL-3.0 unless a file says otherwise. Upstream projects retain their own licenses.
