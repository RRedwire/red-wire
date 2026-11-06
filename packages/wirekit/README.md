# WireKit

The client bootstrap from Redline, extracted so it can drop into any static shell.

## Use

1. Copy `wirekit.js` into your static root (for example `/wirekit/wirekit.js`).
2. Mount the Ultraviolet, BareMux and Epoxy assets.
3. Load `uv.bundle.js` and `uv.config.js` on the page.
4. Call `createWire()`.

```html
<script src="/uv/uv.bundle.js"></script>
<script src="/uv.config.js"></script>
<script type="module">
  import { createWire } from "/wirekit/wirekit.js";

  const wire = await createWire({
    sw: "/sw.js",
    scope: "/service/",
    transport: "/epoxy/index.mjs",
    wisp: "wss://proxy.example.com/wisp/",
  });

  wire.go("https://example.com");
</script>
```

`createWire` resolves once the worker is active and the transport is set. `wire.go()` navigates in place;
`wire.open()` opens a new tab. Both accept a URL or a search query, normalized the same way Redline does.

## Options

| Option | Default | Purpose |
| --- | --- | --- |
| `sw` | `/sw.js` | Service worker entry that imports UV |
| `scope` | `/service/` | Must match `__uv$config.prefix` |
| `transport` | `/epoxy/index.mjs` | BareMux transport module |
| `baremux` | `/baremux/index.mjs` | BareMux client module |
| `worker` | `/baremux/worker.js` | BareMux worker |
| `wisp` | same-origin `/wisp/` | WISP relay URL |

AGPL-3.0.
