# Deploying to Cloudflare

## 1. Worker and Git integration

The site is a Cloudflare **Worker with static assets** named `echotech` (config in `wrangler.jsonc`, entry `src/worker.js`).

1. Dashboard, Workers & Pages, `echotech`, Settings, Builds: repo `melkadi84/echotech`, branch `main`.
2. Build command `npm run build`. Deploy command `npx wrangler deploy`. Root directory `/`.
3. Custom domain: Settings, Domains, add `echo-tech.website`.

Every push to `main` builds and deploys automatically.

## 2. Contact form (D1)

```bash
npx wrangler d1 create echotech-db          # prints database_id
npm run db:init:remote                      # creates the messages table
```

Add the printed id to `wrangler.jsonc` under `d1_databases` (binding `DB`), commit and push. Until then the form answers "not configured" and nothing is stored.

Read messages:

```bash
npx wrangler d1 execute echotech-db --remote --command "SELECT created_at,name,email,service,message FROM messages ORDER BY id DESC LIMIT 20"
```

## 3. Bot protection (Turnstile, recommended)

1. Dashboard, Turnstile, add widget for `echo-tech.website`.
2. Put the **site key** in `src/site.config.json` as `turnstileSiteKey`, run `npm run build`, commit.
3. Add the **secret** to the Worker as `TURNSTILE_SECRET` (Settings, Variables and Secrets).

Without the secret the form still works, protected by a honeypot field and a rate limit (5 messages per 15 minutes per visitor).

## 4. Notifications (optional)

Set `NOTIFY_WEBHOOK_URL` to a Slack, Discord or n8n webhook. Each message posts a short summary. Set `IP_SALT` to any random string.

## 5. Email

Cloudflare Email Routing: create `info@echo-tech.website` forwarding to your inbox, then keep `email` in `src/site.config.json` in sync.

## 6. After launch

- Google Search Console: add the domain property, submit `https://echo-tech.website/sitemap.xml`.
- Google Business Profile for Echo Tech.
- Cloudflare Web Analytics: copy the token to `analyticsToken` in `src/site.config.json` and rebuild.
- Check headers at securityheaders.com and the structured data with Google's Rich Results Test.
- Test the `/` and `/en/` pages on a real phone in light and dark.

## Local development

```bash
npm run dev          # builds, then runs the Worker with static assets locally
npm run db:init      # once, to create the local table
```

Put local secrets in `.dev.vars` (git-ignored).
