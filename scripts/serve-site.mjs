#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 4173);
const dirFlag = process.argv.indexOf("--dir");
const baseDir = dirFlag !== -1 && process.argv[dirFlag + 1] ? path.resolve(root, process.argv[dirFlag + 1]) : root;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const rootFiles = new Set(["/index.html", "/404.html", "/robots.txt", "/sitemap.xml"]);
const prefixes = ["/assets/", "/projects/", "/company/", "/docs/", "/status/", "/services/signal/"];

function resolve(urlPath) {
  if (urlPath === "/") return path.join(baseDir, "index.html");
  if (rootFiles.has(urlPath)) return path.join(baseDir, urlPath.slice(1));
  if (!prefixes.some((prefix) => urlPath.startsWith(prefix))) return null;

  const file = path.resolve(baseDir, `.${urlPath}`);
  if (file !== baseDir && !file.startsWith(baseDir + path.sep)) return null;

  try {
    if (fs.statSync(file).isDirectory()) return path.join(file, "index.html");
  } catch {
    if (urlPath.endsWith("/")) return path.join(file, "index.html");
  }
  return file;
}

http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    } catch {
      res.writeHead(400);
      return res.end("Bad request");
    }

    const file = resolve(pathname);
    if (!file) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }

    fs.readFile(file, (error, body) => {
      if (error) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("Not found");
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(body);
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`red-wire site: http://localhost:${port}`);
  });
