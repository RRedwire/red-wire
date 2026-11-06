import { BareMuxConnection } from "/baremux/index.mjs";

const cfg = self.__uv$config;

const form = document.getElementById("form");
const input = document.getElementById("url");
const stateEl = document.getElementById("state");
const stateText = document.getElementById("state-text");
const errorBox = document.getElementById("error");
const errorText = document.getElementById("error-text");

function setState(state, text) {
  stateEl.dataset.state = state;
  stateText.textContent = text;
}

function setMeta(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function fail(error) {
  setState("offline", "offline");
  setMeta("sw-state", "failed");
  setMeta("transport", "offline");
  errorBox.hidden = false;
  errorText.textContent = error?.message || String(error);
}

function waitForActivation(reg, timeout = 20000) {
  if (reg.active) return Promise.resolve(reg.active);

  const worker = reg.installing || reg.waiting;
  if (!worker) return Promise.reject(new Error("No service worker is installing."));

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Service worker activation timed out.")), timeout);

    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") {
        clearTimeout(timer);
        resolve(worker);
      } else if (worker.state === "redundant") {
        clearTimeout(timer);
        reject(new Error("Service worker installation failed."));
      }
    });
  });
}

async function boot() {
  setMeta("sw-state", "registering");

  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }

  if (!window.isSecureContext) {
    throw new Error("Service workers require HTTPS, except on localhost.");
  }

  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/service/" });
  await waitForActivation(reg);
  setMeta("sw-state", "active");
  setMeta("transport", "linking");

  const connection = new BareMuxConnection("/baremux/worker.js");
  const wisp = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/wisp/`;

  await connection.setTransport("/epoxy/index.mjs", [{ wisp }]);

  setMeta("transport", "epoxy · wisp");
  setState("online", "online");
}

const bootPromise = boot().catch((error) => {
  fail(error);
  throw error;
});

function normalize(raw) {
  const value = raw.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) return value;

  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return `https://duckduckgo.com/?q=${encodeURIComponent(value)}`;
  }

  if (value.startsWith("//")) return `${location.protocol}${value}`;

  if (/^localhost(:\d+)?(\/|$)/i.test(value) || /^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(value)) {
    return `http://${value}`;
  }

  if (!value.includes(" ") && value.includes(".")) return `https://${value}`;

  return `https://duckduckgo.com/?q=${encodeURIComponent(value)}`;
}

async function go(raw) {
  const target = normalize(raw);
  if (!target) {
    input.focus();
    return;
  }

  try {
    await bootPromise;
  } catch {
    return;
  }

  location.assign(cfg.prefix + cfg.encodeUrl(target));
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  go(input.value);
});

document.querySelectorAll("[data-url]").forEach((button) => {
  button.addEventListener("click", () => go(button.dataset.url));
});

document.getElementById("retry").addEventListener("click", () => location.reload());

document.getElementById("fullscreen").addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen?.();
  } else {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }
});

document.getElementById("cloak").addEventListener("click", () => {
  const win = window.open("about:blank", "_blank");
  if (!win) {
    errorBox.hidden = false;
    errorText.textContent = "Popup blocked — allow pop-ups to use about:blank cloaking.";
    return;
  }

  const doc = win.document;
  doc.title = "New Tab";
  doc.body.style.margin = "0";
  doc.body.style.background = "#050608";

  const frame = doc.createElement("iframe");
  frame.src = `${location.origin}/`;
  frame.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;border:0;background:#050608";
  doc.body.appendChild(frame);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== input) {
    event.preventDefault();
    input.focus();
    input.select();
  }
});
