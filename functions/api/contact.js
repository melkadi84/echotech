// POST /api/contact  ->  validates, rate-limits, stores in D1, optionally notifies a webhook.
// Cloudflare Pages Function. Bindings: DB (D1). Optional secrets: TURNSTILE_SECRET, NOTIFY_WEBHOOK_URL, IP_SALT.

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const SERVICES = new Set([
  "Network infrastructure", "CCTV systems", "Website", "Mobile application", "Business system", "Something else",
  "البنية التحتية للشبكات", "أنظمة كاميرات المراقبة", "موقع إلكتروني", "تطبيق موبايل", "نظام إدارة أعمال", "شيء آخر",
]);
const RATE_LIMIT = 5;          // messages per IP per window
const RATE_WINDOW_MIN = 15;

const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost({ request, env }) {
  // Same-origin only.
  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return reply(403, { ok: false, error: "forbidden" });

  let data;
  try { data = await request.json(); } catch { return reply(400, { ok: false, error: "bad_json" }); }

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

  // Optional Turnstile verification.
  if (env.TURNSTILE_SECRET) {
    const token = clean(data["cf-turnstile-response"], 2048);
    if (!token) return reply(422, { ok: false, error: "captcha" });
    const form = new FormData();
    form.append("secret", env.TURNSTILE_SECRET);
    form.append("response", token);
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) form.append("remoteip", ip);
    const check = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const result = await check.json().catch(() => ({}));
    if (!result.success) return reply(422, { ok: false, error: "captcha" });
  }

  if (!env.DB) return reply(500, { ok: false, error: "not_configured" });

  // Rate limit by salted IP hash (raw IPs are never stored).
  const ipHash = await sha256(`${env.IP_SALT || "echo-tech"}:${request.headers.get("CF-Connecting-IP") || "unknown"}`);
  const recent = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM messages WHERE ip_hash = ?1 AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?2)`
  ).bind(ipHash, `-${RATE_WINDOW_MIN} minutes`).first();
  if ((recent?.n ?? 0) >= RATE_LIMIT) return reply(429, { ok: false, error: "rate_limited" });

  await env.DB.prepare(
    `INSERT INTO messages (name, email, phone, service, message, lang, ip_hash) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
  ).bind(name, email, phone || null, service, message, lang, ipHash).run();

  // Optional notification. Never fail the request because of it.
  if (env.NOTIFY_WEBHOOK_URL) {
    try {
      await fetch(env.NOTIFY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `New Echo Tech enquiry from ${name} <${email}> about ${service}:\n${message.slice(0, 500)}` }),
      });
    } catch { /* ignore */ }
  }

  return reply(200, { ok: true });
}

export const onRequest = () => reply(405, { ok: false, error: "method_not_allowed" });
