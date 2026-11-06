(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* nav ---------------------------------------------------------------- */

  const nav = document.querySelector(".nav");
  const setNav = () => nav && nav.classList.toggle("scrolled", window.scrollY > 12);
  setNav();
  window.addEventListener("scroll", setNav, { passive: true });

  const menu = document.querySelector(".nav-menu");
  if (menu && nav) {
    menu.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll(".nav-links a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        menu.setAttribute("aria-expanded", "false");
      })
    );
  }

  const path = location.pathname.replace(/\/index\.html$/, "/");
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;
    const target = new URL(href, location.origin).pathname.replace(/\/index\.html$/, "/");
    if (target === path || (target !== "/" && path.startsWith(target))) {
      a.setAttribute("aria-current", "page");
    }
  });

  /* reveal ------------------------------------------------------------- */

  const revealables = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealables.forEach((el) => io.observe(el));
  }

  /* pointer glow ------------------------------------------------------- */

  document.querySelectorAll(".svc, .net-card, .signal-card, .proj").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });

  /* copy --------------------------------------------------------------- */

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const sel = btn.getAttribute("data-copy");
      const node = sel ? document.querySelector(sel) : null;
      const text = node ? node.textContent : btn.getAttribute("data-copy-text") || "";
      try {
        await navigator.clipboard.writeText(text.trim());
        const old = btn.textContent;
        btn.textContent = "copied";
        setTimeout(() => (btn.textContent = old), 1400);
      } catch {
        btn.textContent = "failed";
      }
    });
  });

  /* filters ------------------------------------------------------------ */

  const filters = document.querySelectorAll("[data-filter]");
  if (filters.length) {
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-filter");
        filters.forEach((b) => b.classList.toggle("active", b === btn));
        document.querySelectorAll(".proj[data-cat]").forEach((card) => {
          const show = cat === "all" || card.getAttribute("data-cat").split(" ").includes(cat);
          card.classList.toggle("hidden", !show);
        });
      });
    });
  }

  /* status probes ------------------------------------------------------ */

  const probed = new WeakSet();

  async function probe(row) {
    if (probed.has(row)) return;
    probed.add(row);
    const pill = row.querySelector(".status-pill");
    const url = row.getAttribute("data-probe");
    if (!pill || !url) return;

    pill.className = "status-pill";
    pill.textContent = "checking";

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);

    try {
      await fetch(url, {
        mode: "no-cors",
        cache: "no-store",
        signal: ctrl.signal,
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
    const btn = row.querySelector("[data-probe-run]");
    if (btn) btn.addEventListener("click", () => probe(row));
    if (row.hasAttribute("data-auto-probe")) probe(row);
  });

  /* ticker ------------------------------------------------------------- */

  const track = document.querySelector(".ticker-track");
  if (track && track.children.length < 8) {
    const clone = track.cloneNode(true);
    Array.from(clone.children).forEach((child) => track.appendChild(child));
  }

  /* year --------------------------------------------------------------- */

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /* signal grid -------------------------------------------------------- */

  const canvas = document.getElementById("wire-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let pulses = [];
  let raf = 0;
  const GAP = 72;
  const COLORS = ["255,46,77", "255,46,77", "255,255,255"];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    draw(0);
  }

  function seed() {
    const count = reduced ? 0 : Math.min(18, Math.round((width * height) / 90000));
    pulses = Array.from({ length: count }, () => spawn());
  }

  function spawn() {
    const horizontal = Math.random() > 0.45;
    return {
      horizontal,
      x: horizontal ? Math.random() * width : Math.round((Math.random() * width) / GAP) * GAP,
      y: horizontal ? Math.round((Math.random() * height) / GAP) * GAP : Math.random() * height,
      len: 40 + Math.random() * 110,
      speed: 0.35 + Math.random() * 1.1,
      alpha: 0.08 + Math.random() * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function draw(dt) {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.09)";
    for (let x = 0; x < width; x += GAP) {
      for (let y = 0; y < height; y += GAP) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    if (reduced) return;

    for (const p of pulses) {
      if (p.horizontal) {
        p.x += p.speed * dt * 0.06;
        if (p.x - p.len > width) Object.assign(p, spawn());
        const grad = ctx.createLinearGradient(p.x - p.len, 0, p.x, 0);
        grad.addColorStop(0, `rgba(${p.color},0)`);
        grad.addColorStop(1, `rgba(${p.color},${p.alpha})`);
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(p.x - p.len, p.y + 0.5);
        ctx.lineTo(p.x, p.y + 0.5);
        ctx.stroke();
        ctx.fillStyle = `rgba(${p.color},${Math.min(0.8, p.alpha + 0.35)})`;
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      } else {
        p.y += p.speed * dt * 0.06;
        if (p.y - p.len > height) Object.assign(p, spawn());
        const grad = ctx.createLinearGradient(0, p.y - p.len, 0, p.y);
        grad.addColorStop(0, `rgba(${p.color},0)`);
        grad.addColorStop(1, `rgba(${p.color},${p.alpha})`);
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(p.x + 0.5, p.y - p.len);
        ctx.lineTo(p.x + 0.5, p.y);
        ctx.stroke();
        ctx.fillStyle = `rgba(${p.color},${Math.min(0.8, p.alpha + 0.35)})`;
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      }
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(50, now - last);
    last = now;
    draw(dt);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (reduced || raf) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  window.addEventListener("resize", () => {
    clearTimeout(resize.t);
    resize.t = setTimeout(resize, 150);
  });

  resize();
  start();
})();
