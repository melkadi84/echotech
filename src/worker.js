// Echo Tech Worker: serves the static site (ASSETS binding) and handles POST /api/contact.
// Bindings: ASSETS (static files), DB (D1, optional until created).
// Optional secrets: TURNSTILE_SECRET, NOTIFY_WEBHOOK_URL, IP_SALT.

import cfg from "./site.config.json" with { type: "json" };

// Client sites whose public meta description may be read (from site.config.json only: no open proxy).
const BRIEF_SITES = new Set(Object.values(cfg.caseStudies || {}).filter(Boolean));

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const SERVICES = new Set([
  "Network infrastructure", "CCTV systems", "Website", "Mobile application", "Business system", "Something else",
  "البنية التحتية للشبكات", "أنظمة كاميرات المراقبة", "موقع إلكتروني", "تطبيق موبايل", "نظام إدارة أعمال", "شيء آخر",
]);
const RATE_LIMIT = 5; // messages per IP per window
const RATE_WINDOW_MIN = 15;
const MAX_BODY_BYTES = 16 * 1024;

const reply = (status, body, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });
const clean = (v, max) => String(typeof v === "string" ? v : "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
// Webhook text is rendered by chat tools, so strip mention and link syntax.
const plain = (v) => v.replace(/[<>@`*_~|]/g, " ");

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isSameOrigin(request) {
  // Browsers always send Sec-Fetch-Site on fetch(); fall back to Origin for other clients.
  const site = request.headers.get("Sec-Fetch-Site");
  if (site) return site === "same-origin";
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

async function verifyTurnstile(request, env, token) {
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.append("remoteip", ip);
  try {
    const check = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const result = await check.json();
    return result.success === true;
  } catch {
    return false;
  }
}

async function handleContact(request, env) {
  if (request.method !== "POST") return reply(405, { ok: false, error: "method_not_allowed" }, { Allow: "POST" });
  if (!isSameOrigin(request)) return reply(403, { ok: false, error: "forbidden" });
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return reply(415, { ok: false, error: "bad_type" });

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return reply(413, { ok: false, error: "too_large" });
  let data;
  try { data = JSON.parse(raw); } catch { return reply(400, { ok: false, error: "bad_json" }); }
  if (!data || typeof data !== "object" || Array.isArray(data)) return reply(400, { ok: false, error: "bad_json" });

  // Honeypot: bots fill the hidden field. Pretend success.
  if (clean(data.website, 200)) return reply(200, { ok: true });

  const name = clean(data.name, 120);
  const email = clean(data.email, 160);
  const phone = clean(data.phone, 40);
  const service = clean(data.service, 80);
  const message = clean(data.message, 4000);
  const lang = clean(data.lang, 5) === "ar" ? "ar" : "en";

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !SERVICES.has(service)) {
    return reply(422, { ok: false, error: "invalid" });
  }

  if (env.TURNSTILE_SECRET) {
    const token = clean(data["cf-turnstile-response"], 2048);
    if (!token || !(await verifyTurnstile(request, env, token))) return reply(422, { ok: false, error: "captcha" });
  }

  if (!env.DB) return reply(503, { ok: false, error: "not_configured" });

  try {
    // Rate limit by salted IP hash (raw IPs are never stored).
    const ipHash = await sha256(`${env.IP_SALT || "echo-tech"}:${request.headers.get("CF-Connecting-IP") || "unknown"}`);
    const recent = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM messages WHERE ip_hash = ?1 AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?2)`
    ).bind(ipHash, `-${RATE_WINDOW_MIN} minutes`).first();
    if ((recent?.n ?? 0) >= RATE_LIMIT) return reply(429, { ok: false, error: "rate_limited" });

    await env.DB.prepare(
      `INSERT INTO messages (name, email, phone, service, message, lang, ip_hash) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    ).bind(name, email, phone || null, service, message, lang, ipHash).run();
  } catch (err) {
    console.error("contact: database error", err);
    return reply(500, { ok: false, error: "server" });
  }

  // Optional notification. Never fail the request because of it.
  if (env.NOTIFY_WEBHOOK_URL) {
    try {
      await fetch(env.NOTIFY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plain(`New Echo Tech enquiry from ${name} (${email}) about ${service}:\n${message.slice(0, 500)}`) }),
      });
    } catch (err) {
      console.error("contact: webhook failed", err);
    }
  }

  return reply(200, { ok: true });
}

const decodeEntities = (text) =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

// GET /api/brief?site=<client url>: the client's own title and description, cached for a day.
async function handleBrief(request) {
  const site = new URL(request.url).searchParams.get("site") || "";
  if (!BRIEF_SITES.has(site)) return reply(404, { ok: false, error: "not_found" });
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;
  const info = { title: "", description: "" };
  try {
    const res = await fetch(site, { headers: { "User-Agent": "EchoTechBot/1.0 (+https://echo-tech.website)" }, redirect: "follow" });
    const rewriter = new HTMLRewriter()
      .on("title", { text(chunk) { if (!info.title) info.title += chunk.text; } })
      .on("meta", {
        element(el) {
          const key = el.getAttribute("name") || el.getAttribute("property");
          const content = (el.getAttribute("content") || "").trim();
          if (content && (key === "description" || (key === "og:description" && !info.description))) info.description = content;
        },
      });
    await rewriter.transform(res).text();
  } catch {
    return reply(502, { ok: false, error: "unreachable" });
  }
  info.description = decodeEntities(info.description);
  info.title = decodeEntities(info.title);
  const brief = info.description.length > 150 ? info.description.slice(0, 150).replace(/\s+\S*$/, "") + "…" : info.description;
  const out = new Response(JSON.stringify({ ok: true, title: info.title.trim(), description: brief }), {
    headers: { ...JSON_HEADERS, "Cache-Control": "public, max-age=86400" },
  });
  await cache.put(request, out.clone());
  return out;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/contact") return handleContact(request, env);
    if (pathname === "/api/brief" && request.method === "GET") return handleBrief(request);
    if (pathname.startsWith("/api/")) return reply(404, { ok: false, error: "not_found" });
    return env.ASSETS.fetch(request);
  },
};
