// Services picker and client strip. Without JS the page shows every service and a static strip.
function initPicker() {
  const root = document.querySelector("[data-picker]");
  if (!root) return;
  const list = root.querySelector('[role="tablist"]');
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];

  const select = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (focus) tabs[index].focus();
  };

  list.hidden = false;
  root.classList.add("is-ready");
  select(0);

  tabs.forEach((tab, i) => tab.addEventListener("click", () => select(i)));
  list.addEventListener("keydown", (e) => {
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    const last = tabs.length - 1;
    const moves = { ArrowDown: current + 1, ArrowUp: current - 1, Home: 0, End: last };
    if (!(e.key in moves)) return;
    e.preventDefault();
    select(Math.min(last, Math.max(0, moves[e.key])), true);
  });

  // Small screens: the tabs are hidden and the panels form a swipeable carousel with previous/next buttons.
  // Rect maths keeps scrolling correct in RTL and never scrolls the page itself.
  const small = matchMedia("(max-width: 860px)");
  const motionOk = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const track = root.querySelector("[data-track]");
    const count = root.querySelector(".picker__count");
  const [prev, next] = root.querySelectorAll(".picker__arrow");
  let current = 0;

  const nearest = () => {
    const box = track.getBoundingClientRect();
    const mid = box.left + box.width / 2;
    let best = 0;
    let gap = Infinity;
    panels.forEach((p, i) => {
      const r = p.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < gap) { gap = d; best = i; }
    });
    return best;
  };
  const sync = () => {
    count.textContent = `${current + 1} ${count.dataset.of} ${panels.length}`;
    prev.disabled = current === 0;
    next.disabled = current === panels.length - 1;
  };
  const go = (index, smooth = true) => {
    current = Math.min(panels.length - 1, Math.max(0, index));
    select(current);
    sync();
    if (!small.matches) return;
    const t = panels[current].getBoundingClientRect();
    const l = track.getBoundingClientRect();
    track.scrollBy({ left: t.left - l.left, behavior: smooth && motionOk ? "smooth" : "auto" });
  };
  let frame = 0;
  track.addEventListener("scroll", () => {
    if (!small.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const index = nearest();
      if (index !== current) { current = index; select(index); sync(); }
    });
  }, { passive: true });
  root.addEventListener("click", (e) => {
    const step = e.target.closest(".picker__arrow");
    if (step) go(current + Number(step.dataset.step));
  });
  tabs.forEach((tab, i) => tab.addEventListener("click", () => { current = i; sync(); }));
  small.addEventListener("change", () => go(current, false));
  sync();

  let timer = 0;
  let stopped = !motionOk;
  let visible = false;
  const stop = () => { stopped = true; clearInterval(timer); };
  if (motionOk) {
    timer = setInterval(() => {
      if (!stopped && visible && small.matches) go((current + 1) % panels.length);
    }, 5000);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(root);
    ["pointerdown", "keydown", "focusin", "wheel"].forEach((ev) => root.addEventListener(ev, stop, { once: true }));
  }

  // Mouse users can drag the carousel like a touch screen; touch and trackpads already scroll natively.
  let drag = null;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || !small.matches || e.target.closest("a, button")) return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) { drag.moved = true; track.classList.add("is-dragging"); }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  window.addEventListener("pointerup", () => { track.classList.remove("is-dragging"); setTimeout(() => { drag = null; }, 0); });

  // Hero links like #svc-cctv open that service.
  const openFromHash = (hash) => {
    const index = panels.findIndex((p) => `#${p.id}` === hash);
    if (index >= 0) go(index, false);
  };
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#svc-"]');
    if (link) openFromHash(link.getAttribute("href"));
  });
  openFromHash(location.hash);

  // "Request a quote for this service" preselects the contact form.
  root.addEventListener("click", (e) => {
    const cta = e.target.closest("[data-pick]");
    const field = document.getElementById("c-service");
    if (cta && field) field.selectedIndex = Number(cta.dataset.pick) + 1;
  });
}

function initClients() {
  const root = document.querySelector("[data-clients]");
  if (!root) return;
  const toggle = root.querySelector(".clients__toggle");
  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    const paused = root.classList.toggle("is-paused");
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.textContent = paused ? toggle.dataset.play : toggle.dataset.pause;
  });
  // Save work while the strip is off screen.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => root.classList.toggle("is-offscreen", !entry.isIntersecting)).observe(root);
  }
  initClientsDrag(root);
  initClientsSlides(root);
}

// Small screens: the clients form a one-per-slide carousel. Rect maths keeps it correct in RTL.
function initClientsSlides(root) {
  const small = matchMedia("(max-width: 860px)");
  const motionOk = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scroller = root.querySelector(".marquee");
  const slides = [...root.querySelectorAll(".marquee__set:not(.marquee__set--copy) .client:not(.client--rep)")];
  const count = root.querySelector(".slide-count");
  const [prev, next] = root.querySelectorAll(".slide-arrow");
  let current = 0;
  const sync = () => {
    count.textContent = `${current + 1} ${count.dataset.of} ${slides.length}`;
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
  };
  const go = (index) => {
    current = Math.min(slides.length - 1, Math.max(0, index));
    sync();
    const t = slides[current].getBoundingClientRect();
    const l = scroller.getBoundingClientRect();
    scroller.scrollBy({ left: t.left - l.left, behavior: motionOk ? "smooth" : "auto" });
  };
  let frame = 0;
  scroller.addEventListener("scroll", () => {
    if (!small.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const box = scroller.getBoundingClientRect();
      const mid = box.left + box.width / 2;
      let best = 0;
      let gap = Infinity;
      slides.forEach((p, i) => {
        const r = p.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < gap) { gap = d; best = i; }
      });
      if (best !== current) { current = best; sync(); }
    });
  }, { passive: true });
  root.addEventListener("click", (e) => {
    const step = e.target.closest(".slide-arrow");
    if (step) go(current + Number(step.dataset.step));
  });
  sync();
}

// Drag the strip left or right to pick a client. The marquee is a CSS animation, so dragging moves its clock:
// one full loop equals half the track width. The strip stays paused while dragging, and resumes afterwards
// unless the visitor pressed the pause button.
function initClientsDrag(root) {
  const marquee = root.querySelector(".marquee");
  const track = root.querySelector(".marquee__track");
  const animation = track.getAnimations()[0];
  if (!animation) return; // reduced motion: the strip scrolls natively
  const loopMs = animation.effect.getComputedTiming().duration;
  let startX = 0;
  let startTime = 0;
  let moved = false;
  let active = false;
  marquee.addEventListener("dragstart", (e) => e.preventDefault());
  marquee.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    active = true;
    moved = false;
    startX = e.clientX;
    startTime = Number(animation.currentTime);
  });
  marquee.addEventListener("pointermove", (e) => {
    if (!active) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) < 6) return;
    if (!moved) marquee.setPointerCapture(e.pointerId);
    moved = true;
    root.classList.add("is-dragging");
    // Dragging right pulls earlier content into view, so it rewinds the clock.
    const shift = (dx / (track.scrollWidth / 2)) * loopMs;
    animation.currentTime = (((startTime - shift) % loopMs) + loopMs) % loopMs;
  });
  const end = () => {
    active = false;
    root.classList.remove("is-dragging");
  };
  marquee.addEventListener("pointerup", end);
  marquee.addEventListener("pointercancel", end);
  // A drag must not open the client's link.
  marquee.addEventListener("click", (e) => {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
  }, true);
}

// Client briefs: replace the written line with the client's own meta description when it is in the page language.
async function initBriefs() {
  const nodes = [...document.querySelectorAll("[data-brief-site]")];
  if (!nodes.length) return;
  const arabic = document.documentElement.lang === "ar";
  const sites = [...new Set(nodes.map((n) => n.dataset.briefSite))];
  await Promise.all(sites.map(async (site) => {
    try {
      const res = await fetch(`/api/brief?site=${encodeURIComponent(site)}`);
      if (!res.ok) return;
      const { description } = await res.json();
      if (!description || /[\u0600-\u06FF]/.test(description) !== arabic) return;
      nodes.filter((n) => n.dataset.briefSite === site).forEach((n) => { n.textContent = description; });
    } catch { /* offline or blocked: keep the written line */ }
  }));
}

// Home page: the nav link for the section in view (How we work, Questions) takes the active colour.
function initNavSpy() {
  const links = [...document.querySelectorAll('.nav a.nav__link[href*="#"]')];
  const pairs = links.map((a) => [a, document.getElementById(a.getAttribute("href").split("#")[1])]).filter(([, el]) => el);
  if (!pairs.length || !("IntersectionObserver" in window)) return;
  const seen = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => seen.set(e.target, e.isIntersecting));
    pairs.forEach(([a, el]) => (seen.get(el) ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
  }, { rootMargin: "-45% 0px -45% 0px" });
  pairs.forEach(([, el]) => io.observe(el));
}

initPicker();
initNavSpy();
// Work page: picking a client shows that project's details below instead of leaving the page.
function initProjects() {
  const links = [...document.querySelectorAll("[data-project]")].filter((a) => a.matches("a"));
  const panels = [...document.querySelectorAll("article[data-project]")];
  if (!links.length || !panels.length) return;
  const show = (slug) => {
    panels.forEach((p) => { p.hidden = p.dataset.project !== slug; });
    document.querySelectorAll(".client:not(.client--rep) a[data-project], .client--rep a[data-project]").forEach((a) => {
      if (a.dataset.project === slug) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-project]");
    if (!a) return;
    e.preventDefault();
    show(a.dataset.project);
    const target = document.getElementById("project-details");
    const motionOk = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: motionOk ? "smooth" : "auto", block: "start" });
  });
  const slug = location.hash.slice(1);
  show(panels.some((p) => p.dataset.project === slug) ? slug : panels[0].dataset.project);
}

initClients();
initProjects();
initBriefs();
