# Redline

The reference RedWire proxy: **Ultraviolet + BareMux + Epoxy over WISP**, served by one Node process.

## Run

```bash
npm install
npm start
# http://localhost:8080
```

Node 20+. Service workers require HTTPS or `localhost`.

## What it serves

| Path | Source |
| --- | --- |
| `/` | `public/` |
| `/uv/*` | `@titaniumnetwork-dev/ultraviolet/dist` |
| `/baremux/*` | `@mercuryworkshop/bare-mux/dist` |
| `/epoxy/*` | `@mercuryworkshop/epoxy-transport/dist` |
| `/service/*` | intercepted by the Ultraviolet service worker |
| `/wisp/` | WISP WebSocket relay |
| `/health` | JSON health check |

## Environment

- `PORT` — default `8080`
- `HOST` — default `0.0.0.0`

## How it boots

1. `public/sw.js` imports the UV bundle, config and service worker.
2. `public/app.js` registers `/sw.js` at scope `/service/`.
3. It sets the BareMux transport to Epoxy with `wss://<host>/wisp/`.
4. A search navigates to `/service/<xor-encoded-url>`, which the worker intercepts.

## Deploy

A `Dockerfile` and the root `docker-compose.yml` are enough. Terminate TLS in front of the process —
Caddy handles WebSocket upgrades automatically:

```
redline.example.com {
  reverse_proxy 127.0.0.1:8080
}
```

Cloudflare Pages cannot host the relay; run it on a container host with WebSocket support and keep the
static site on Pages.

## Notes

- `/sw.js` and `/uv.config.js` are served `no-store` so a stale worker cannot pin an old prefix.
- Epoxy's wasm is inlined in the transport bundle; there is no separate wasm file to mount.
- The upstream packages are AGPL-3.0. This service is AGPL-3.0 as well.
