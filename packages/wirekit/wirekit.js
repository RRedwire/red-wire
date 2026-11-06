function activation(registration, timeout = 20000) {
  if (registration.active) return Promise.resolve(registration.active);

  const worker = registration.installing || registration.waiting;
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

export function normalizeUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return `https://duckduckgo.com/?q=${encodeURIComponent(value)}`;
  if (value.startsWith("//")) return `${location.protocol}${value}`;
  if (/^localhost(:\d+)?(\/|$)/i.test(value) || /^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(value)) return `http://${value}`;
  if (!value.includes(" ") && value.includes(".")) return `https://${value}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(value)}`;
}

export async function createWire(options = {}) {
  const {
    sw = "/sw.js",
    scope = "/service/",
    transport = "/epoxy/index.mjs",
    baremux = "/baremux/index.mjs",
    worker = "/baremux/worker.js",
    wisp,
  } = options;

  if (!("serviceWorker" in navigator)) throw new Error("Service workers are unavailable in this browser.");
  if (!window.isSecureContext) throw new Error("WireKit requires HTTPS, except on localhost.");

  const config = self.__uv$config;
  if (!config) throw new Error("Load uv.bundle.js and uv.config.js before calling createWire().");

  const registration = await navigator.serviceWorker.register(sw, { scope });
  await activation(registration);

  const { BareMuxConnection } = await import(baremux);
  const connection = new BareMuxConnection(worker);
  const relay = wisp || `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/wisp/`;

  await connection.setTransport(transport, [{ wisp: relay }]);

  return {
    registration,
    connection,
    encode(url) {
      const target = normalizeUrl(url);
      if (!target) throw new Error("A URL or search query is required.");
      return config.prefix + config.encodeUrl(target);
    },
    go(url) {
      location.assign(this.encode(url));
    },
    open(url) {
      return window.open(this.encode(url), "_blank", "noopener");
    },
  };
}
