/* Concept demos: dashboard, automation, mobile app and booking list. All data is sample data. */
(() => {
  const root = document.querySelector("[data-showcase]");
  if (!root) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  /* Tabs */
  const tabs = $$(".sc-tab", root);
  const panels = $$(".sc-panel", root);
  const select = (i, focus) => {
    tabs.forEach((t, n) => {
      t.setAttribute("aria-selected", String(n === i));
      t.tabIndex = n === i ? 0 : -1;
      panels[n].hidden = n !== i;
    });
    if (focus) tabs[i].focus();
    if (panels[i].querySelector(".chart")) drawBars(panels[i]);
  };
  tabs.forEach((t, i) => t.addEventListener("click", () => select(i)));
  root.querySelector(".sc-tabs").addEventListener("keydown", (e) => {
    const rtl = document.dir === "rtl";
    const keys = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 };
    const cur = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
    let next = cur;
    if (e.key in keys) next = (cur + keys[e.key] + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    select(next, true);
  });

  /* Dashboard */
  const countTo = (el, text) => {
    const m = /^([\d.]+)(.*)$/.exec(text);
    if (!m || reduce) { el.textContent = text; return; }
    const end = parseFloat(m[1]);
    const dec = (m[1].split(".")[1] || "").length;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 600);
      el.textContent = (end * (1 - Math.pow(1 - k, 3))).toFixed(dec) + m[2];
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  function drawBars(panel, range = panel.dataset.range || "7") {
    const chart = panel.querySelector(".chart");
    const vals = chart.dataset["set" + range].split(",").map(Number);
    const bars = $$(".bar", chart);
    bars.forEach((b, i) => {
      const hidden = i >= vals.length;
      b.style.display = hidden ? "none" : "";
      if (!hidden) requestAnimationFrame(() => { b.style.transform = `scaleY(${vals[i]})`; });
    });
  }
  $$(".dash", root).forEach((dash) => {
    const panel = dash.closest(".sc-panel");
    $$(".seg__btn", dash).forEach((btn) => btn.addEventListener("click", () => {
      const r = btn.dataset.range;
      panel.dataset.range = r;
      $$(".seg__btn", dash).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      $$(".kpi b", dash).forEach((b) => countTo(b, b.dataset["v" + r]));
      $$(".kpi em", dash).forEach((e) => { e.textContent = e.dataset["d" + r]; });
      drawBars(panel, r);
    }));
    drawBars(panel, "7");
  });

  /* Automation: steps run one after another; the log line is announced politely. */
  const flow = root.querySelector("[data-flow]");
  if (flow) {
    flow.dataset.js = "";
    const steps = $$(".flow__step", flow);
    const btn = flow.querySelector("[data-run]");
    const label = btn.querySelector("span");
    const log = flow.querySelector(".flow__log");
    const idle = label.textContent;
    let busy = false;
    const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
    btn.addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      btn.disabled = true;
      label.textContent = flow.dataset.running;
      steps.forEach((s) => s.classList.remove("is-active", "is-done"));
      for (const s of steps) {
        s.classList.add("is-active");
        log.textContent = s.dataset.log;
        await wait(900);
        s.classList.replace("is-active", "is-done");
      }
      log.textContent = flow.dataset.done;
      label.textContent = flow.dataset.again;
      btn.disabled = false;
      busy = false;
    });
    label.dataset.idle = idle;
  }

  /* Mobile app */
  const app = root.querySelector("[data-app]");
  if (app) {
    const navBtns = $$(".phone__nav button", app);
    const screens = $$(".phone__screen", app);
    navBtns.forEach((b, i) => b.addEventListener("click", () => {
      navBtns.forEach((x, n) => x.setAttribute("aria-selected", String(n === i)));
      screens.forEach((s, n) => { s.hidden = n !== i; });
    }));
    const slots = $$(".slot", app);
    slots.forEach((s) => s.addEventListener("click", () => slots.forEach((x) => x.setAttribute("aria-pressed", String(x === s)))));
    const book = app.querySelector("[data-book]");
    book.addEventListener("click", () => {
      book.classList.add("is-booked");
      book.querySelector("span").textContent = book.dataset.booked;
    });
    $$(".sw", app).forEach((sw) => sw.addEventListener("click", () => sw.setAttribute("aria-checked", String(sw.getAttribute("aria-checked") !== "true"))));
  }

  /* Booking list */
  const crm = root.querySelector("[data-crm]");
  if (crm) {
    const counter = crm.querySelector("[data-count-pending]");
    crm.addEventListener("click", (e) => {
      const btn = e.target.closest("button.crm__btn");
      if (!btn) return;
      const row = btn.closest(".crm__row");
      row.dataset.status = "confirmed";
      row.querySelector(".chip").textContent = crm.dataset.confirmed;
      const spacer = document.createElement("span");
      spacer.className = "crm__btn";
      btn.replaceWith(spacer);
      row.classList.add("is-flash");
      setTimeout(() => row.classList.remove("is-flash"), 900);
      counter.textContent = String($$('.crm__row[data-status="pending"]', crm).length);
    });
  }
})();
