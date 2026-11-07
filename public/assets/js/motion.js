/* Motion system: staggered reveals and pointer tilt. All transform/opacity only.
   Nothing runs under prefers-reduced-motion, so content is always visible there. */
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement;

  /* Blocks inside every section (except the hero bands) arrive as the visitor scrolls down and
     leave again when they scroll back up past them, so each screen builds up one piece at a time. */
  const picked = [...document.querySelectorAll(
    "[data-rv], main > section:not(.hero):not(.phero) > .wrap > *, .step, .principles > div, .others__list li, .faq details, .check__list li, .project",
  )];
  // Keep the outermost block only, so a block never fades in twice.
  const targets = picked.filter((el) => !picked.some((other) => other !== el && el.contains(other)) || el.matches("[data-rv]"));
  targets.forEach((el) => {
    el.dataset.rv = "";
    const siblings = [...el.parentElement.children].filter((c) => "rv" in c.dataset);
    const gap = el.classList.contains("step") ? 0.28 : 0.1;
    el.style.setProperty("--rv-delay", `${Math.min(siblings.indexOf(el), 5) * gap}s`);
  });
  if ("IntersectionObserver" in window) {
    root.classList.add("rv-ready");
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) en.target.classList.add("is-in");
      // Only hide what sits below the screen; anything already scrolled past stays shown.
      else if (en.boundingClientRect.top > 0) en.target.classList.remove("is-in");
    }), { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
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
