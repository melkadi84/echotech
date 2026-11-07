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
    const anims = [];

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

      info.textContent = "";
      const head = document.createElement("div");
      head.className = "mesh__head";
      const h = document.createElement("h3");
      h.textContent = cfg.services[id].name;
      head.append(h, link(id, cfg.open));
      const label = document.createElement("p");
      label.className = "mesh__with";
      label.textContent = cfg.with;
      const ul = document.createElement("ul");
      related.forEach(([a, b, text]) => {
        const peer = a === id ? b : a;
        const li = document.createElement("li");
        const strong = document.createElement("strong");
        strong.append(link(peer));
        const p = document.createElement("span");
        p.textContent = text;
        li.append(strong, p);
        ul.append(li);
      });
      info.append(head, label, ul);
    };

    chips.forEach((c) => c.addEventListener("click", () => select(c.dataset.id)));
    nodes.forEach((n) => {
      n.addEventListener("click", () => select(n.dataset.id));
      n.addEventListener("pointerenter", () => select(n.dataset.id));
    });

    if (!reduce && "animate" in Element.prototype) {
      edges.forEach((e, i) => {
        const dot = document.createElementNS(NS, "circle");
        dot.setAttribute("r", "4.5");
        dot.setAttribute("class", "mesh__dot");
        dot.dataset.a = e.dataset.a;
        dot.dataset.b = e.dataset.b;
        dotLayer.append(dot);
        const p = (k) => `translate(${e.getAttribute("x" + k)}px, ${e.getAttribute("y" + k)}px)`;
        anims.push(dot.animate(
          [{ transform: p(1), opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { transform: p(2), opacity: 0 }],
          { duration: 3200 + (i % 4) * 600, delay: i * 350, iterations: Infinity, direction: i % 2 ? "alternate" : "normal", easing: "ease-in-out" },
        ));
      });
      /* Pause while off-screen so the page stays light. */
      new IntersectionObserver(([en]) => anims.forEach((a) => (en.isIntersecting ? a.play() : a.pause()))).observe(box);
    }

    if (cfg.current) select(cfg.current);
  });
})();
