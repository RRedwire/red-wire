#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  if (process.env.DISCORD_WEBHOOK_URL) return;
  for (const file of [".env", ".env.local"]) {
    try {
      const text = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!match || process.env[match[1]]) continue;
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    } catch {
      /* no env file */
    }
  }
}

loadEnv();

const isTest = process.argv.includes("--test");
const webhook = process.env.DISCORD_WEBHOOK_URL;

if (!webhook) {
  console.error("DISCORD_WEBHOOK_URL is not set. Add it as an org/repo secret, or copy .env.example to .env.");
  if (isTest) process.exit(1);
  process.exit(0);
}

let payload = {};
try {
  if (process.env.GITHUB_EVENT_PATH && fs.existsSync(process.env.GITHUB_EVENT_PATH)) {
    payload = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  }
} catch {
  /* local run */
}

const repo = process.env.GITHUB_REPOSITORY || "RRedwire/red-wire";
const ref = process.env.GITHUB_REF_NAME || "local";
const actor = process.env.GITHUB_ACTOR || process.env.USERNAME || "local";
const event = process.env.GITHUB_EVENT_NAME || (isTest ? "test" : "manual");
const sha = process.env.GITHUB_SHA || "";
const server = process.env.GITHUB_SERVER_URL || "https://github.com";
const runId = process.env.GITHUB_RUN_ID;
const repoUrl = `${server}/${repo}`;

const lines = [];
let url = repoUrl;
let title = `${event} / ${ref}`;

if (isTest) {
  title = "Discord notifier online";
  lines.push("The webhook is wired up. Updates from this repository will land here.");
} else if (event === "push") {
  const commits = Array.isArray(payload.commits) ? payload.commits : [];
  if (commits.length) {
    for (const commit of commits.slice(0, 5)) {
      const first = String(commit.message || "").split("\n")[0];
      lines.push(`\`${String(commit.id || "").slice(0, 7)}\` ${first}`);
    }
    if (commits.length > 5) lines.push(`...and ${commits.length - 5} more commits`);
  } else {
    lines.push(`\`${sha.slice(0, 7)}\` pushed to \`${ref}\``);
  }
  if (sha) url = `${repoUrl}/commit/${sha}`;
} else if (event === "pull_request") {
  const pr = payload.pull_request || {};
  const action = payload.action || "updated";
  title = `PR #${pr.number ?? "?"} / ${action}`;
  lines.push(`**${pr.title || "pull request"}**`);
  lines.push(`opened by \`${pr.user?.login || actor}\` -> \`${pr.base?.ref || "main"}\``);
  if (pr.html_url) url = pr.html_url;
} else if (event === "release") {
  const release = payload.release || {};
  title = `release / ${release.tag_name || release.name || "published"}`;
  lines.push(`**${release.name || release.tag_name || "release"}**`);
  const body = String(release.body || "").trim();
  if (body) lines.push(body.slice(0, 500));
  if (release.html_url) url = release.html_url;
} else {
  lines.push(`\`${event}\` in \`${repo}\``);
}

const embed = {
  title,
  url,
  description: lines.join("\n").slice(0, 3800) || `\`${event}\``,
  color: 0xff2e4d,
  fields: [
    { name: "repository", value: `[${repo}](${repoUrl})`, inline: true },
    { name: "actor", value: `\`${actor}\``, inline: true },
    { name: "branch", value: `\`${ref}\``, inline: true },
  ],
  footer: { text: "RedWire / update log" },
  timestamp: new Date().toISOString(),
};

if (runId) {
  embed.fields.push({
    name: "workflow run",
    value: `[${runId}](${repoUrl}/actions/runs/${runId})`,
    inline: false,
  });
}

const response = await fetch(webhook, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "RedWire", embeds: [embed] }),
});

if (!response.ok) {
  console.error(`discord: ${response.status} ${await response.text()}`);
  process.exit(1);
}

console.log(`discord: sent ${isTest ? "test" : event} for ${repo}`);
