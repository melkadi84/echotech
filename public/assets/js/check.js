/* Tech health check on the About page: counts ticked statements and links to services for the rest. */
(() => {
  const root = document.querySelector("[data-check]");
  if (!root) return;
  const boxes = [...root.querySelectorAll("input[type=checkbox]")];
  const total = Number(root.dataset.total);
  const help = JSON.parse(root.dataset.help);
  const tiers = JSON.parse(root.dataset.tiers);
  const el = (s) => root.querySelector(s);
  const helpBox = el("[data-help-box]");
  const helpList = el("[data-help-list]");

  const tierFor = (n) => {
    if (n >= total - 1) return tiers.high;
    if (n >= Math.ceil(total / 2)) return tiers.mid;
    return tiers.low;
  };

  const update = () => {
    const n = boxes.filter((b) => b.checked).length;
    const tier = tierFor(n);
    el("[data-score]").textContent = String(n);
    el("[data-meter]").style.transform = `scaleX(${n / total})`;
    const started = n > 0;
    el("[data-result-title]").hidden = !started;
    el("[data-result-text]").hidden = !started;
    el("[data-result-title]").textContent = tier.title;
    el("[data-result-text]").textContent = tier.text;
    const ids = [...new Set(boxes.filter((b) => !b.checked).map((b) => b.dataset.svc))].filter((id) => help[id]);
    helpList.innerHTML = ids.map((id) => `<li>${help[id]}</li>`).join("");
    helpBox.hidden = ids.length === 0 || !started;
  };

  boxes.forEach((b) => b.addEventListener("change", update));
  el("[data-reset]").addEventListener("click", () => { boxes.forEach((b) => { b.checked = false; }); update(); });
  update();
})();
