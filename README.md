# Echo Tech website

Bilingual (Arabic / English), light and dark, static site for **Echo Tech**: network infrastructure, CCTV systems, websites, mobile apps and business systems. Hosted on Cloudflare Pages at https://echo-tech.website.

```bash
npm run build        # regenerate public/ from src/
npm run dev          # local Cloudflare Pages with D1 (needs wrangler)
npm run deploy       # build and deploy with wrangler
```

- Copy lives in `src/content/ar.json` and `src/content/en.json`.
- Site settings (email, WhatsApp, social links, Turnstile key) live in `src/site.config.json`.
- Brand rules: `docs/BRAND.md`. Motion: `docs/ANIMATIONS.md`. Content plan: `docs/CONTENT.md`. Deployment: `docs/DEPLOY.md`.
- AI assistants: read `AGENTS.md` first.
