#!/usr/bin/env node
import process from "node:process";

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const apply = process.argv.includes("--apply");
const org = process.env.GITHUB_ORG || "RRedwire";
const notifier = process.env.NOTIFIER_REPO || "RRedwire/red-wire";

if (!token) {
  console.error("Set GITHUB_TOKEN (repo scope) to list and update organisation repositories.");
  process.exit(1);
}

const api = "https://api.github.com";
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "redwire-discord-installer",
  "Content-Type": "application/json",
};

async function gh(pathname, options = {}) {
  const response = await fetch(api + pathname, { ...options, headers: { ...headers, ...options.headers } });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-json */
  }
  return { response, data, text };
}

const workflow = `name: Discord update log

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
    uses: ${notifier}/.github/workflows/reusable-notify.yml@main
    secrets: inherit
`;

const secret = await gh(`/orgs/${org}/actions/secrets/DISCORD_WEBHOOK_URL`);
if (secret.response.status === 404) {
  console.warn(`warning: org secret DISCORD_WEBHOOK_URL is not visible on ${org}. Notifications will be skipped.`);
} else if (secret.response.status === 403) {
  console.warn("note: token cannot read org secrets; skipping the secret check.");
}

const repos = [];
for (let page = 1; ; page += 1) {
  const { response, data } = await gh(`/orgs/${org}/repos?per_page=100&page=${page}&type=all`);
  if (!response.ok) {
    console.error(`failed to list repositories: ${response.status} ${JSON.stringify(data)}`);
    process.exit(1);
  }
  if (!Array.isArray(data) || data.length === 0) break;
  repos.push(...data);
  if (data.length < 100) break;
}

const targets = repos.filter((repo) => !repo.archived && !repo.disabled);
console.log(`${apply ? "applying to" : "dry run for"} ${targets.length} repositories in ${org}\n`);

let added = 0;
let skipped = 0;
let failed = 0;

for (const repo of targets) {
  const owner = repo.owner.login;
  const name = repo.name;
  const branch = repo.default_branch || "main";
  const label = `${owner}/${name}`;

  const check = await gh(`/repos/${owner}/${name}/contents/.github/workflows/notify.yml?ref=${encodeURIComponent(branch)}`);
  if (check.response.status === 200) {
    console.log(`skip   ${label} (workflow exists)`);
    skipped += 1;
    continue;
  }

  if (!apply) {
    console.log(`add    ${label} (${branch})`);
    added += 1;
    continue;
  }

  const put = await gh(`/repos/${owner}/${name}/contents/.github/workflows/notify.yml`, {
    method: "PUT",
    body: JSON.stringify({
      message: "ci: add Discord update log",
      content: Buffer.from(workflow, "utf8").toString("base64"),
      branch,
    }),
  });

  if (put.response.ok) {
    console.log(`added  ${label}`);
    added += 1;
  } else {
    console.log(`fail   ${label}: ${put.response.status} ${put.text.slice(0, 160)}`);
    failed += 1;
  }

  await new Promise((resolve) => setTimeout(resolve, 300));
}

console.log(`\n${apply ? "done" : "dry run"}: ${added} ${apply ? "added" : "to add"}, ${skipped} skipped, ${failed} failed`);
if (!apply) console.log("re-run with --apply to write the workflow files");
