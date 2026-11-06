(() => {
  "use strict";

  const nav = document.querySelector(".nav");
  const menu = document.querySelector(".nav-menu");

  if (menu && nav) {
    menu.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll(".nav-links a").forEach((link) =>
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menu.setAttribute("aria-expanded", "false");
      })
    );
  }

  const path = location.pathname.replace(/\/index\.html$/, "/");
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http")) return;
    const target = new URL(href, location.origin).pathname.replace(/\/index\.html$/, "/");
    if (target === path || (target !== "/" && path.startsWith(target))) {
      link.setAttribute("aria-current", "page");
    }
  });

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const selector = button.getAttribute("data-copy");
      const node = selector ? document.querySelector(selector) : null;
      const text = node ? node.textContent : button.getAttribute("data-copy-text") || "";
      try {
        await navigator.clipboard.writeText(text.trim());
        const previous = button.textContent;
        button.textContent = "copied";
        setTimeout(() => (button.textContent = previous), 1200);
      } catch {
        button.textContent = "failed";
      }
    });
  });

  const filters = document.querySelectorAll("[data-filter]");
  if (filters.length) {
    filters.forEach((button) => {
      button.addEventListener("click", () => {
        const category = button.getAttribute("data-filter");
        filters.forEach((item) => item.classList.toggle("active", item === button));
        document.querySelectorAll(".proj[data-cat]").forEach((card) => {
          const show = category === "all" || card.getAttribute("data-cat").split(" ").includes(category);
          card.classList.toggle("hidden", !show);
        });
      });
    });
  }

  const probed = new WeakSet();

  async function probe(row) {
    if (probed.has(row)) return;
    probed.add(row);

    const pill = row.querySelector(".status-pill");
    const url = row.getAttribute("data-probe");
    if (!pill || !url) return;

    pill.className = "status-pill";
    pill.textContent = "checking";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    try {
      await fetch(url, {
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal,
        credentials: "omit",
      });
      pill.classList.add("ok");
      pill.textContent = "reachable";
    } catch {
      pill.classList.add("bad");
      pill.textContent = "no response";
    } finally {
      clearTimeout(timer);
    }
  }

  document.querySelectorAll("[data-probe]").forEach((row) => {
    const button = row.querySelector("[data-probe-run]");
    if (button) button.addEventListener("click", () => probe(row));
    if (row.hasAttribute("data-auto-probe")) probe(row);
  });

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
