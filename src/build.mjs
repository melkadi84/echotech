// Echo Tech static build: src/content/*.json + src/site.config.json  ->  public/
// Run with: node src/build.mjs   (or: npm run build). No dependencies.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = async (p) => JSON.parse(await readFile(join(root, p), "utf8"));
const out = async (p, s) => { await mkdir(dirname(join(root, p)), { recursive: true }); await writeFile(join(root, p), s); };

const cfg = await read("src/site.config.json");
const langs = { ar: await read("src/content/ar.json"), en: await read("src/content/en.json") };
const site = cfg.domain.replace(/\/$/, "");
const today = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsonLd = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

/* Inline head script: sets theme + js flag before first paint. Its hash goes into the CSP. */
const themeScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('et-theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.dataset.theme=t;d.classList.add('js');if(sessionStorage.getItem('et-boot'))d.classList.add('boot-skip')}catch(e){d.dataset.theme='light';d.classList.add('js')}})();`;
const themeHash = "sha256-" + createHash("sha256").update(themeScript).digest("base64");

const markSvg = (cls = "") => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle class="r r2" cx="37.6" cy="32" r="14" opacity="0.4"/><circle class="r r1" cx="32" cy="32" r="14" opacity="0.8"/><circle class="d" cx="26.4" cy="32" r="14"/></svg>`;
const spinner = (cls = "", label = "") =>
  `<span class="spinner ${cls}" ${label ? `role="status" aria-label="${esc(label)}"` : 'aria-hidden="true"'}><svg viewBox="0 0 24 24" fill="none"><circle class="track" cx="12" cy="12" r="9" stroke-width="2.5"/><circle class="arc" cx="12" cy="12" r="9" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="14 43"/><circle class="core" cx="12" cy="12" r="3"/></svg></span>`;

const sunIcon = `<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
const moonIcon = `<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>`;
const menuIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;

const url = (t) => site + t.path;

function schema(t) {
  const other = t.lang === "ar" ? langs.en : langs.ar;
  const sameAs = Object.values(cfg.social).filter(Boolean);
  const org = {
    "@type": ["Organization", "ProfessionalService"],
    "@id": `${site}/#org`,
    name: "Echo Tech",
    alternateName: "إيكو تك",
    url: site + "/",
    logo: { "@type": "ImageObject", url: `${site}/assets/brand/icon-512.png`, width: 512, height: 512 },
    image: `${site}/assets/brand/og-image.png`,
    description: t.description,
    areaServed: "Worldwide",
    knowsLanguage: ["ar", "en"],
    email: cfg.email || undefined,
    contactPoint: cfg.email ? [{ "@type": "ContactPoint", contactType: "sales", email: cfg.email, availableLanguage: ["Arabic", "English"] }] : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: t.services.title,
      itemListElement: t.services.items.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name, description: s.summary, serviceType: s.name, provider: { "@id": `${site}/#org` }, areaServed: "Worldwide" },
      })),
    },
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      org,
      { "@type": "WebSite", "@id": `${site}/#website`, url: site + "/", name: "Echo Tech", publisher: { "@id": `${site}/#org` }, inLanguage: ["ar", "en"] },
      { "@type": "WebPage", "@id": url(t) + "#webpage", url: url(t), name: t.title, description: t.description, inLanguage: t.lang, isPartOf: { "@id": `${site}/#website` }, about: { "@id": `${site}/#org` }, primaryImageOfPage: `${site}/assets/brand/og-image.png`, translationOfWork: { "@id": url(other) + "#webpage" } },
      { "@type": "FAQPage", "@id": url(t) + "#faq", inLanguage: t.lang, name: t.faqTitleSchema, mainEntity: t.faq.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };
}

function page(t) {
  const other = t.lang === "ar" ? langs.en : langs.ar;
  const u = t.ui;
  const f = t.contact.form;
  const wa = cfg.whatsapp ? `https://wa.me/${cfg.whatsapp.replace(/\D/g, "")}` : "";
  const ogImg = `${site}/assets/brand/og-image.png`;
  const social = Object.entries(cfg.social).filter(([, v]) => v);

  const services = t.services.items.map((s) => `
        <article class="svc" id="svc-${s.id}">
          <div><h3>${esc(s.name)}</h3><p class="svc__summary">${esc(s.summary)}</p></div>
          <ul class="svc__points">${s.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        </article>`).join("");

  const jz = t.work.joyZone;
  const testimonials = t.work.testimonials.length
    ? `<div class="quotes" aria-labelledby="quotes-h"><h3 class="sr-only" id="quotes-h">${esc(t.work.testimonialsTitle)}</h3>${t.work.testimonials.map((q) => `<figure class="quote"><blockquote><p>${esc(q.text)}</p></blockquote><footer>${esc(q.name)}${q.role ? `، ${esc(q.role)}` : ""}</footer></figure>`).join("")}</div>`
    : "";

  const steps = t.process.steps.map((s) => `<li class="step"><h3>${esc(s.name)}</h3><p>${esc(s.text)}</p></li>`).join("");
  const principles = t.principles.items.map((p) => `<div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div>`).join("");
  const faq = t.faq.items.map((q) => `<details><summary>${esc(q.q)}</summary><p>${esc(q.a)}</p></details>`).join("");
  const options = f.serviceOptions.map((o) => `<option>${esc(o)}</option>`).join("");

  const field = (id, label, input) => `<div class="field"><label for="${id}">${esc(label)}</label>${input}<span class="err" aria-live="polite"></span></div>`;

  return `<!doctype html>
<html lang="${t.lang}" dir="${t.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.description)}">
<link rel="canonical" href="${url(t)}">
<link rel="alternate" hreflang="${t.lang}" href="${url(t)}">
<link rel="alternate" hreflang="${other.lang}" href="${url(other)}">
<link rel="alternate" hreflang="x-default" href="${site}/">
<meta name="theme-color" content="${cfg.themeColor.light}" data-light="${cfg.themeColor.light}" data-dark="${cfg.themeColor.dark}">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Echo Tech">
<meta property="og:title" content="${esc(t.title)}">
<meta property="og:description" content="${esc(t.description)}">
<meta property="og:url" content="${url(t)}">
<meta property="og:image" content="${ogImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${t.locale}">
<meta property="og:locale:alternate" content="${other.locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(t.title)}">
<meta name="twitter:description" content="${esc(t.description)}">
<meta name="twitter:image" content="${ogImg}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300..700&display=swap">
<script>${themeScript}</script>
<link rel="stylesheet" href="/assets/css/site.css">
<noscript><style>.boot{display:none}</style></noscript>
<script type="application/ld+json">${jsonLd(schema(t))}</script>
</head>
<body>
<a class="skip" href="#main">${esc(u.skip)}</a>
<div class="boot" role="status" aria-live="polite"><div class="boot__stack"><div class="boot__mark" aria-hidden="true"><i class="r"></i><i class="r r2"></i><i class="r r3"></i><i class="d"></i></div><span class="boot__label">${spinner("", "")}${esc(u.loading)}</span></div></div>
<div class="progress" role="presentation"></div>

<header class="header">
  <div class="wrap header__row">
    <a class="brand" href="${t.path}" aria-label="${esc(u.home)}">${markSvg()}<span class="brand__name">${t.lang === "ar" ? "إيكو تك" : "ECHO TECH"}</span></a>
    <nav class="nav" id="nav" aria-label="${esc(u.menu)}">
      ${t.nav.map((n) => `<a class="nav__link" href="#${n.id}">${esc(n.label)}</a>`).join("\n      ")}
      <a class="btn" href="#contact">${esc(t.cta)}</a>
    </nav>
    <div class="tools">
      <a class="lang" href="${other.path}" hreflang="${other.lang}" lang="${other.lang}" title="${esc(u.langName)}">${esc(u.langLabel)}</a>
      <button class="icon-btn theme-btn" type="button" aria-label="${esc(u.theme)}">${moonIcon}${sunIcon}</button>
      <button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="nav" aria-label="${esc(u.menu)}" data-open="${esc(u.menu)}" data-close="${esc(u.closeMenu)}">${menuIcon}</button>
    </div>
  </div>
</header>

<main id="main">
  <section class="hero" aria-labelledby="hero-h">
    <div class="echo" aria-hidden="true"><span class="wave"></span><span class="wave"></span><span class="wave"></span><span class="wave"></span><span class="wave"></span><span class="wave"></span><span class="core"></span></div>
    <div class="wrap hero__content">
      <h1 id="hero-h">${esc(t.hero.title)}</h1>
      <p class="hero__sub">${esc(t.hero.sub)}</p>
      <div class="hero__actions">
        <a class="btn" href="#contact">${esc(t.hero.primary)}</a>
        <a class="btn btn--ghost" href="#work">${esc(t.hero.secondary)}</a>
      </div>
      <p class="hero__jump" aria-label="${esc(t.hero.jump)}">${t.services.items.map((s) => `<a href="#svc-${s.id}">${esc(s.name)}</a>`).join("")}</p>
    </div>
  </section>

  <section id="services" aria-labelledby="services-h">
    <div class="wrap">
      <div class="head"><h2 id="services-h">${esc(t.services.title)}</h2><p>${esc(t.services.intro)}</p></div>
      <div>${services}</div>
    </div>
  </section>

  <section id="work" class="work" aria-labelledby="work-h">
    <div class="wrap">
      <div class="head"><h2 id="work-h">${esc(t.work.title)}</h2><p>${esc(t.work.intro)}</p></div>
      <div class="case">
        <div>
          <p class="case__kind">${esc(jz.kind)}</p>
          <h3>${esc(jz.client)}</h3>
          <p>${esc(jz.summary)}</p>
          <ul class="case__list">${jz.delivered.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
          <a class="btn btn--ghost" href="${cfg.caseStudies.joyZoneUrl}" rel="noopener" target="_blank">${esc(jz.visit)}</a>
        </div>
        <div class="proof" aria-hidden="true"><span class="wave"></span><span class="wave"></span><span class="wave"></span><span class="wave"></span><a tabindex="-1" href="${cfg.caseStudies.joyZoneUrl}">joy-zone.net</a></div>
      </div>
      ${testimonials}
    </div>
  </section>

  <section id="process" aria-labelledby="process-h">
    <div class="wrap">
      <div class="head"><h2 id="process-h">${esc(t.process.title)}</h2><p>${esc(t.process.intro)}</p></div>
      <ol class="steps">${steps}</ol>
    </div>
  </section>

  <section aria-labelledby="principles-h" class="principles-sec">
    <div class="wrap">
      <div class="head"><h2 id="principles-h">${esc(t.principles.title)}</h2></div>
      <div class="principles">${principles}</div>
    </div>
  </section>

  <section id="faq" aria-labelledby="faq-h">
    <div class="wrap">
      <div class="head"><h2 id="faq-h">${esc(t.faq.title)}</h2></div>
      <div class="faq-list">${faq}</div>
    </div>
  </section>

  <section id="contact" class="contact" aria-labelledby="contact-h">
    <div class="wrap contact__grid">
      <div>
        <div class="head"><h2 id="contact-h">${esc(t.contact.title)}</h2><p>${esc(t.contact.intro)}</p></div>
        <div class="direct">
          ${cfg.email ? `<div><small>${esc(t.contact.directEmail)}</small><a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a></div>` : ""}
          ${wa ? `<div><small>${esc(t.contact.directWhatsapp)}</small><a href="${wa}" rel="noopener" target="_blank" dir="ltr">+${esc(cfg.whatsapp.replace(/\D/g, ""))}</a></div>` : ""}
        </div>
      </div>
      <form class="form" id="contact-form" action="/api/contact" method="post" novalidate data-required="${esc(f.required)}" data-invalid="${esc(f.invalid)}" data-sending="${esc(f.sending)}" data-ok="${esc(f.ok)}" data-err="${esc(f.err)}">
        <div class="row">
          ${field("c-name", f.name, `<input id="c-name" name="name" autocomplete="name" required data-req maxlength="120">`)}
          ${field("c-email", f.email, `<input id="c-email" name="email" type="email" autocomplete="email" inputmode="email" required data-req maxlength="160" dir="ltr">`)}
        </div>
        <div class="row">
          ${field("c-phone", f.phone, `<input id="c-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="40" dir="ltr">`)}
          ${field("c-service", f.service, `<select id="c-service" name="service" required data-req><option value="">${esc(f.serviceDefault)}</option>${options}</select>`)}
        </div>
        ${field("c-message", f.message, `<textarea id="c-message" name="message" required data-req maxlength="4000"></textarea>`)}
        <div class="hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
        ${cfg.turnstileSiteKey ? `<div class="cf-turnstile" data-sitekey="${esc(cfg.turnstileSiteKey)}" data-theme="auto"></div>` : ""}
        <div><button class="btn" type="submit">${spinner()}<span class="btn__label">${esc(f.send)}</span></button></div>
        <p class="form__status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="wrap">
    <div class="footer__row">
      <div><a class="brand" href="${t.path}" aria-label="${esc(u.home)}">${markSvg()}<span class="brand__name">${t.lang === "ar" ? "إيكو تك" : "ECHO TECH"}</span></a><p>${esc(t.footer.tagline)}</p></div>
      <nav aria-label="${esc(u.menu)}">${t.nav.map((n) => `<a href="#${n.id}">${esc(n.label)}</a>`).join("")}<a href="#contact">${esc(t.cta)}</a></nav>
      ${social.length ? `<nav aria-label="Social">${social.map(([k, v]) => `<a href="${esc(v)}" rel="noopener me" target="_blank">${esc(k)}</a>`).join("")}</nav>` : ""}
    </div>
    <p class="footer__copy">© ${new Date().getFullYear()} Echo Tech. ${esc(t.footer.rights)}</p>
  </div>
</footer>
${cfg.turnstileSiteKey ? `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` : ""}
${cfg.analyticsToken ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${esc(cfg.analyticsToken)}"}'></script>` : ""}
<script src="/assets/js/site.js" defer></script>
</body>
</html>
`;
}

await out("public/index.html", page(langs.ar));
await out("public/en/index.html", page(langs.en));

/* 404 */
await out("public/404.html", `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>404 — Echo Tech</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><script>${themeScript}</script><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300..700&display=swap"><link rel="stylesheet" href="/assets/css/site.css"></head><body><main class="hero hero--full"><div class="wrap hero__content"><h1>404</h1><p class="hero__sub">This page doesn't exist. الصفحة غير موجودة.</p><div class="hero__actions"><a class="btn" href="/">الرئيسية</a><a class="btn btn--ghost" href="/en/">Home</a></div></div></main></body></html>
`);

/* sitemap with hreflang alternates */
const alt = (l, h) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${h}"/>`;
const entry = (t) => `  <url>
    <loc>${url(t)}</loc>
    <lastmod>${today}</lastmod>
${alt("ar", site + "/")}
${alt("en", site + "/en/")}
${alt("x-default", site + "/")}
  </url>`;
await out("public/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entry(langs.ar)}
${entry(langs.en)}
</urlset>
`);
await out("public/robots.txt", `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${site}/sitemap.xml\n`);

await out("public/site.webmanifest", JSON.stringify({
  name: "Echo Tech", short_name: "Echo Tech", description: langs.en.description,
  start_url: "/", scope: "/", display: "standalone", lang: "ar", dir: "rtl",
  background_color: cfg.themeColor.dark, theme_color: "#1D4ED8",
  icons: [
    { src: "/assets/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/assets/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/assets/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
  ],
}, null, 2) + "\n");

/* Cloudflare Pages headers (CSP includes the hash of the inline theme script) */
const csp = [
  "default-src 'self'",
  `script-src 'self' '${themeHash}' https://challenges.cloudflare.com${cfg.analyticsToken ? " https://static.cloudflareinsights.com" : ""}`,
  "style-src 'self' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data:",
  `connect-src 'self'${cfg.analyticsToken ? " https://cloudflareinsights.com" : ""}`,
  "frame-src https://challenges.cloudflare.com",
  "base-uri 'self'", "form-action 'self'", "object-src 'none'", "frame-ancestors 'none'",
].join("; ");
await out("public/_headers", `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/assets/*
  Cache-Control: public, max-age=86400, must-revalidate

/assets/brand/*
  Cache-Control: public, max-age=604800

/favicon.svg
  Cache-Control: public, max-age=86400
`);

console.log(`Built: public/index.html, public/en/index.html (+404, sitemap, robots, manifest, _headers). CSP script hash: ${themeHash}`);
