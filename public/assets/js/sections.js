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

  // Hero links like #svc-cctv open that service.
  const openFromHash = (hash) => {
    const index = panels.findIndex((p) => `#${p.id}` === hash);
    if (index >= 0) select(index);
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
}

initPicker();
initClients();
