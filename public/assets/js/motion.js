/* Motion system: staggered reveals and pointer tilt. All transform/opacity only.
   Nothing runs under prefers-reduced-motion, so content is always visible there. */
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement;

  const targets = [...document.querySelectorAll("[data-rv], .project, .principles > div, .step")];
  targets.forEach((el, i) => {
    el.dataset.rv = "";
    const siblings = [...el.parentElement.children].filter((c) => "rv" in c.dataset);
    // Process steps arrive one after another, even when the whole list is already on screen.
    const gap = el.classList.contains("step") ? 0.28 : 0.08;
    el.style.setProperty("--rv-delay", `${Math.min(siblings.indexOf(el), 5) * gap}s`);
  });
  if ("IntersectionObserver" in window) {
    root.classList.add("rv-ready");
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    targets.forEach((el) => io.observe(el));
  }

  /* Device frames lean toward the pointer on fine-pointer screens. */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".dev").forEach((dev) => {
      dev.dataset.tilt = "";
      dev.addEventListener("pointermove", (e) => {
        const r = dev.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        dev.style.setProperty("--tilt-y", `${(x * 5).toFixed(2)}deg`);
        dev.style.setProperty("--tilt-x", `${(-y * 4).toFixed(2)}deg`);
      });
      dev.addEventListener("pointerleave", () => { dev.style.setProperty("--tilt-x", "0deg"); dev.style.setProperty("--tilt-y", "0deg"); });
    });
  }
})();
