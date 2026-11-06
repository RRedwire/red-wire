const grid = document.getElementById("grid");
const filters = document.getElementById("filters");
const updated = document.getElementById("updated");

const stateClass = {
  live: "live",
  kit: "kit",
  wip: "dev",
  planned: "plan",
};

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function card(link) {
  const node = document.createElement("a");
  node.className = "signal-card";
  node.href = link.url;
  node.target = "_blank";
  node.rel = "noopener";
  node.dataset.tag = link.tag || "";

  const top = document.createElement("div");
  top.className = "sc-top";

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = link.tag || "link";

  const state = document.createElement("span");
  state.className = `state ${stateClass[link.status] || "plan"}`;
  state.innerHTML = "<i></i>";
  state.append(document.createTextNode(` ${link.status || "planned"}`));

  top.append(tag, state);
  node.append(top);

  const name = document.createElement("h3");
  name.textContent = link.name;
  node.append(name);

  const note = document.createElement("p");
  note.textContent = link.note || "";
  node.append(note);

  const foot = document.createElement("div");
  foot.className = "sc-foot";

  const host = document.createElement("span");
  host.className = "host";
  host.textContent = hostOf(link.url);

  const open = document.createElement("span");
  open.className = "open";
  open.textContent = "open ↗";

  foot.append(host, open);
  node.append(foot);

  return node;
}

function buildFilters(links) {
  const tags = ["all", ...new Set(links.map((link) => link.tag).filter(Boolean))];

  for (const tag of tags) {
    const button = document.createElement("button");
    button.className = tag === "all" ? "filter active" : "filter";
    button.dataset.tag = tag;
    button.textContent = tag === "all" ? "All" : tag;
    button.addEventListener("click", () => {
      filters.querySelectorAll(".filter").forEach((el) => el.classList.toggle("active", el === button));
      grid.querySelectorAll(".signal-card").forEach((el) => {
        el.hidden = tag !== "all" && el.dataset.tag !== tag;
      });
    });
    filters.append(button);
  }
}

fetch("links.json", { cache: "no-store" })
  .then((response) => {
    if (!response.ok) throw new Error(`manifest: ${response.status}`);
    return response.json();
  })
  .then((manifest) => {
    const links = Array.isArray(manifest.links) ? manifest.links : [];
    if (updated && manifest.updated) updated.textContent = `updated ${manifest.updated}`;
    buildFilters(links);

    if (!links.length) {
      grid.innerHTML = '<p class="note">The manifest is empty.</p>';
      return;
    }

    for (const link of links) grid.append(card(link));
  })
  .catch((error) => {
    grid.innerHTML = `<p class="note">Could not load the manifest — ${String(error.message || error)}</p>`;
  });
