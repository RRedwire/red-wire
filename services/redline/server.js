import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";
const started = Date.now();

function packageVersion(name) {
  try {
    const file = path.join(root, "node_modules", name, "package.json");
    return JSON.parse(fs.readFileSync(file, "utf8")).version;
  } catch {
    return "unknown";
  }
}

const uvVersion = packageVersion("@titaniumnetwork-dev/ultraviolet");

const mounts = [
  { prefix: "/uv/", dir: path.join(root, "node_modules/@titaniumnetwork-dev/ultraviolet/dist") },
  { prefix: "/baremux/", dir: path.join(root, "node_modules/@mercuryworkshop/bare-mux/dist") },
  { prefix: "/epoxy/", dir: path.join(root, "node_modules/@mercuryworkshop/epoxy-transport/dist") },
  { prefix: "/", dir: path.join(root, "public") },
];

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
};

function resolveFile(pathname) {
  for (const mount of mounts) {
    if (mount.prefix !== "/" && !pathname.startsWith(mount.prefix)) continue;

    const rel = mount.prefix === "/" ? pathname.slice(1) : pathname.slice(mount.prefix.length);
    if (!rel || rel.includes("\0")) continue;

    const file = path.resolve(mount.dir, rel);
    const base = path.resolve(mount.dir);
    if (file !== base && !file.startsWith(base + path.sep)) return null;
    if (file === base) continue;
    return file;
  }
  return null;
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function serve(req, res, pathname) {
  if (pathname === "/health") {
    return sendJson(res, 200, {
      ok: true,
      service: "redline",
      ultraviolet: uvVersion,
      transport: "epoxy/wisp",
      relay: "/wisp/",
      uptime: Math.round((Date.now() - started) / 1000),
    });
  }

  if (pathname === "/" || pathname === "") pathname = "/index.html";

  const file = resolveFile(pathname);
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Not found");
  }

  fs.stat(file, (error, stats) => {
    if (error || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }

    const ext = path.extname(file).toLowerCase();
    const noStore = pathname === "/sw.js" || pathname === "/uv.config.js";
    const headers = {
      "Content-Type": types[ext] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": noStore ? "no-store, no-cache, must-revalidate" : ext === ".html" ? "no-cache" : "public, max-age=3600",
    };

    if (pathname === "/sw.js") headers["Service-Worker-Allowed"] = "/";

    res.writeHead(200, headers);
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).pathname);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Bad request");
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }

  serve(req, res, pathname);
});

server.on("upgrade", (req, socket, head) => {
  let pathname = "";
  try {
    pathname = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).pathname;
  } catch {
    socket.destroy();
    return;
  }

  if (pathname === "/wisp/" || pathname === "/wisp") {
    Promise.resolve(wisp.routeRequest(req, socket, head)).catch(() => socket.destroy());
    return;
  }

  socket.destroy();
});

server.listen(port, host, () => {
  console.log(`redline listening on http://${host}:${port}`);
  console.log(`wisp relay at /wisp/ · ultraviolet ${uvVersion}`);
});
