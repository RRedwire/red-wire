#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");

const entries = [
  "index.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "_headers",
  "LICENSE",
  "assets",
  "projects",
  "company",
  "browse",
  "play",
  "docs",
  "status",
  "services/signal",
];

fs.rmSync(out, { recursive: true, force: true });

let files = 0;
for (const entry of entries) {
  const source = path.join(root, entry);
  if (!fs.existsSync(source)) {
    console.warn(`build: missing ${entry}`);
    continue;
  }

  const target = path.join(out, entry);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });

  if (fs.statSync(source).isFile()) files += 1;
  else files += fs.readdirSync(source, { recursive: true }).filter((name) => fs.statSync(path.join(source, name)).isFile()).length;
}

console.log(`build: dist/ ready (${files} files)`);
