/* Services mesh: shows which services connect to each other. Pulses travel along the links (transform only). */
(() => {
  const boxes = document.querySelectorAll("[data-mesh]");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";

  boxes.forEach((box) => {
    const cfg = JSON.parse(box.dataset.config);
    const edges = [...box.querySelectorAll(".mesh__edge")];
    const nodes = [...box.querySelectorAll(".mesh__node")];
    const chips = [...box.querySelectorAll(".mesh__chip")];
    const info = box.querySelector(".mesh__info");
    const dotLayer = box.querySelector(".mesh__dots");
    let onSelect = () => {};

    // Speech bubble above a diagram node; it is shown from the node itself or from its button.
    const tip = document.createElement("div");
    tip.className = "mesh__tip";
    tip.setAttribute("aria-hidden", "true");
    box.append(tip);
    const showTip = (id) => {
      const node = nodes.find((n) => n.dataset.id === id);
      if (!node) return;
      tip.textContent = cfg.services[id].summary;
      tip.classList.add("is-on");
      const b = box.getBoundingClientRect();
      const r = node.querySelector(".mesh__disc").getBoundingClientRect();
      const center = r.left - b.left + r.width / 2;
      const half = tip.offsetWidth / 2;
      const left = Math.min(Math.max(center, half + 4), b.width - half - 4);
      tip.style.left = `${left}px`;
      tip.style.top = `${r.top - b.top}px`;
      tip.style.setProperty("--tip-arrow", `${center - left + half}px`);
    };
    const hideTip = () => tip.classList.remove("is-on");
    nodes.forEach((n) => {
      n.addEventListener("pointerenter", () => showTip(n.dataset.id));
      n.addEventListener("pointerleave", hideTip);
    });
    chips.forEach((c) => {
      c.addEventListener("pointerenter", () => showTip(c.dataset.id));
      c.addEventListener("pointerleave", hideTip);
      c.addEventListener("focus", () => showTip(c.dataset.id));
      c.addEventListener("blur", hideTip);
    });

    const link = (id, label) => {
      const a = document.createElement("a");
      a.href = cfg.services[id].href;
      a.textContent = label || cfg.services[id].name;
      return a;
    };

    const select = (id) => {
      const related = cfg.edges.filter(([a, b]) => a === id || b === id);
      const peers = new Set(related.map(([a, b]) => (a === id ? b : a)));
      edges.forEach((e) => {
        const on = e.dataset.a === id || e.dataset.b === id;
        e.classList.toggle("is-on", on);
        e.classList.toggle("is-dim", !on);
      });
      nodes.forEach((n) => {
        n.classList.toggle("is-sel", n.dataset.id === id);
        n.classList.toggle("is-link", peers.has(n.dataset.id));
      });
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.id === id)));
      box.querySelectorAll(".mesh__dot").forEach((d) => d.classList.toggle("is-on", d.dataset.a === id || d.dataset.b === id));

      // The details panel was removed from the page; the diagram and buttons carry the message.
      if (!info) { onSelect(id); return; }
      info.textContent = "";
      const icon = (key) => {
        const span = document.createElement("span");
        span.className = "mesh__ico";
        span.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${cfg.services[key].icon}</svg>`;
        return span;
      };
      const head = document.createElement("div");
      head.className = "mesh__head";
      const title = document.createElement("div");
      title.className = "mesh__title";
      const h = document.createElement("h3");
      h.textContent = cfg.services[id].name;
      title.append(icon(id), h);
      const open = link(id, cfg.open);
      open.className = "btn btn--ghost";
      head.append(title, open);
      const label = document.createElement("p");
      label.className = "mesh__with";
      label.textContent = cfg.with;
      const ul = document.createElement("ul");
      related.forEach(([a, b, text]) => {
        const peer = a === id ? b : a;
        const li = document.createElement("li");
        const card = document.createElement("a");
        card.href = cfg.services[peer].href;
        card.className = "mesh__card";
        const name = document.createElement("strong");
        name.textContent = cfg.services[peer].name;
        const p = document.createElement("span");
        p.textContent = text;
        const body = document.createElement("span");
        body.className = "mesh__body";
        body.append(name, p);
        card.append(icon(peer), body);
        li.append(card);
        ul.append(li);
      });
      info.append(head, label, ul);
      onSelect(id);
    };

    chips.forEach((c) => c.addEventListener("click", () => select(c.dataset.id)));
    nodes.forEach((n) => {
      n.addEventListener("click", () => select(n.dataset.id));
      n.addEventListener("pointerenter", () => select(n.dataset.id));
    });

    /* Pulses: a dot leaves the selected service, the peer flashes when it arrives and answers with a dot back,
       so every link visibly talks in both directions. Same look as the hero map: transform and opacity only. */
    let generation = 0;
    let running = false;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const pos = (id) => {
      const d = box.querySelector(`.mesh__node[data-id="${id}"] .mesh__disc`);
      return { x: Number(d.getAttribute("cx")), y: Number(d.getAttribute("cy")), r: Number(d.getAttribute("r")) };
    };
    const flash = (id) => {
      const f = box.querySelector(`.mesh__node[data-id="${id}"] .mesh__flash`);
      f.animate([{ transform: "scale(1)", opacity: 0.9 }, { transform: "scale(1.8)", opacity: 0 }], { duration: 900, easing: "ease-out" });
    };
    const travel = (from, to, cls) => {
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r", "4.5");
      dot.setAttribute("class", `mesh__dot ${cls}`);
      dotLayer.append(dot);
      const a = pos(from), b = pos(to);
      const done = dot.animate(
        [{ transform: `translate(${a.x}px, ${a.y}px)`, opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.88 }, { transform: `translate(${b.x}px, ${b.y}px)`, opacity: 0 }],
        { duration: 1100, easing: "ease-in-out", fill: "forwards" },
      ).finished;
      return done.then(() => dot.remove());
    };
    const loop = async (from, to, delay, gen) => {
      await wait(delay);
      while (gen === generation) {
        if (!running) { await wait(400); continue; }
        await travel(from, to, "is-out");
        flash(to);
        await wait(250);
        await travel(to, from, "is-back");
        flash(from);
        await wait(1400);
      }
    };
    const startPulses = (id) => {
      generation += 1;
      const mine = cfg.edges.filter(([a, b]) => a === id || b === id);
      const list = mine.length ? mine : cfg.edges;
      list.forEach(([a, b], i) => {
        const from = a === id || !mine.length ? a : b;
        loop(from, from === a ? b : a, i * 420, generation);
      });
    };

    if (!reduce && "animate" in Element.prototype) {
      nodes.forEach((n) => {
        const d = n.querySelector(".mesh__disc");
        const ring = document.createElementNS(NS, "circle");
        ring.setAttribute("class", "mesh__flash");
        ["cx", "cy", "r"].forEach((k) => ring.setAttribute(k, d.getAttribute(k)));
        n.insertBefore(ring, d);
      });
      new IntersectionObserver(([en]) => { running = en.isIntersecting; }).observe(box);
      onSelect = startPulses;
      startPulses(cfg.current || "systems");
    }

    if (cfg.current) select(cfg.current);
  });
})();
