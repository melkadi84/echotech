/* Echo Tech — site behaviour. No dependencies. See docs/ANIMATIONS.md. */
(() => {
  "use strict";
  const doc = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
    sget(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  /* 1. Boot loader: shown on every page load (refresh included), never blocks longer than 4s */
  const boot = $(".boot");
  if (boot) {
    const started = performance.now();
    const hide = () => {
      const wait = Math.max(0, 700 - (performance.now() - started));
      setTimeout(() => {
        boot.classList.add("is-done");
        setTimeout(() => boot.remove(), 700);
      }, wait);
    };
    if (document.readyState === "complete") hide(); else window.addEventListener("load", hide, { once: true });
    setTimeout(hide, 4000);
  }

  /* 2. Theme toggle — expands from the button using View Transitions where supported */
  const themeBtn = $(".theme-btn");
  const meta = $('meta[name="theme-color"]:not([media])');
  const applyTheme = (t) => {
    doc.dataset.theme = t;
    store.set("et-theme", t);
    if (meta) meta.content = t === "dark" ? meta.dataset.dark : meta.dataset.light;
  };
  if (meta) meta.content = doc.dataset.theme === "dark" ? meta.dataset.dark : meta.dataset.light;
  themeBtn?.addEventListener("click", () => {
    const next = doc.dataset.theme === "dark" ? "light" : "dark";
    if (!document.startViewTransition || reduce) return applyTheme(next);
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => applyTheme(next)).ready.then(() => {
      doc.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(() => {});
  });

  /* 3. Header state + reading progress */
  const header = $(".header");
  const bar = $(".progress");
  const toTop = $(".to-top");
  toTop?.addEventListener("click", () => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
  });
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header?.classList.toggle("is-scrolled", y > 8);
      toTop?.classList.toggle("is-visible", y > 700);
      const max = doc.scrollHeight - innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* 4. Mobile menu */
  const menuBtn = $(".menu-btn");
  const nav = $("#nav");
  const setMenu = (open) => {
    nav?.classList.toggle("is-open", open);
    menuBtn?.setAttribute("aria-expanded", String(open));
    menuBtn?.setAttribute("aria-label", open ? menuBtn.dataset.close : menuBtn.dataset.open);
  };
  menuBtn?.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  nav?.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* 5. Hero: tap or click spawns an echo ring at the pointer */
  const hero = $(".hero");
  if (hero && !reduce) {
    hero.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a, button")) return;
      const b = hero.getBoundingClientRect();
      const ring = document.createElement("span");
      ring.className = "tap-ring";
      ring.style.left = `${e.clientX - b.left}px`;
      ring.style.top = `${e.clientY - b.top}px`;
      hero.append(ring);
      ring.addEventListener("animationend", () => ring.remove(), { once: true });
    });
  }

  /* 6. Button ripple */
  document.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn || reduce || btn.disabled) return;
    const b = btn.getBoundingClientRect();
    const dot = document.createElement("span");
    dot.className = "ripple";
    dot.style.left = `${e.clientX - b.left}px`;
    dot.style.top = `${e.clientY - b.top}px`;
    btn.append(dot);
    dot.addEventListener("animationend", () => dot.remove(), { once: true });
  });

  /* 8. Contact form */
  const form = $("#contact-form");
  if (form) {
    const status = $(".form__status", form);
    const submit = $("button[type=submit]", form);
    const label = $(".btn__label", submit);
    const msg = form.dataset;
    const fields = $$("[data-req]", form);
    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

    const validate = () => {
      let ok = true;
      fields.forEach((f) => {
        const wrap = f.closest(".field");
        const err = $(".err", wrap);
        let bad = !f.value.trim();
        if (!bad && f.type === "email") bad = !emailOk(f.value.trim());
        wrap.classList.toggle("is-bad", bad);
        f.setAttribute("aria-invalid", String(bad));
        err.textContent = bad ? msg.required : "";
        if (bad) ok = false;
      });
      return ok;
    };
    fields.forEach((f) => f.addEventListener("input", () => {
      if (f.closest(".field").classList.contains("is-bad")) validate();
    }));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "form__status";
      status.textContent = "";
      if (!validate()) { status.classList.add("bad"); status.textContent = msg.invalid; $("[aria-invalid=true]", form)?.focus(); return; }
      const data = Object.fromEntries(new FormData(form));
      data.lang = doc.lang;
      const idle = label.textContent;
      submit.disabled = true;
      submit.setAttribute("aria-busy", "true");
      label.textContent = msg.sending;
      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        status.classList.add("ok");
        status.textContent = msg.ok;
        if (window.turnstile) try { window.turnstile.reset(); } catch { /* widget not rendered */ }
      } catch {
        status.classList.add("bad");
        status.textContent = msg.err;
      } finally {
        submit.disabled = false;
        submit.removeAttribute("aria-busy");
        label.textContent = idle;
      }
    });
  }
})();
