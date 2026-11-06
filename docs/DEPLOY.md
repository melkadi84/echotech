# Deploying to Cloudflare

## 1. Connect the repo (Cloudflare Pages)

1. Cloudflare dashboard, Workers & Pages, Create, Pages, Connect to Git, pick `melkadi84/echotech`.
2. Production branch `main`. Framework preset none. Build command: `npm run build` (or leave empty; `public/` is committed). Build output directory: `public`.
3. Custom domain: add `echo-tech.website`. Cloudflare creates DNS and SSL.

Every push to `main` deploys automatically.

## 2. Contact form (D1)

```bash
npx wrangler d1 create echotech-db          # copy database_id into wrangler.toml
npm run db:init:remote                      # creates the messages table
```

Pages project, Settings, Bindings: add D1 binding `DB` pointing at `echotech-db`. The binding also needs to exist for Preview if you test branches.

Read messages:

```bash
npx wrangler d1 execute echotech-db --remote --command "SELECT created_at,name,email,service,message FROM messages ORDER BY id DESC LIMIT 20"
```

## 3. Bot protection (Turnstile, recommended)

1. Dashboard, Turnstile, add widget for `echo-tech.website`.
2. Put the **site key** in `src/site.config.json` as `turnstileSiteKey`, run `npm run build`, commit.
3. Add the **secret** to the Pages project as `TURNSTILE_SECRET` (Settings, Variables and Secrets).

Without the secret the form still works, protected by a honeypot field and a rate limit (5 messages per 15 minutes per visitor).

## 4. Notifications (optional)

Set `NOTIFY_WEBHOOK_URL` to a Slack, Discord or n8n webhook. Each message posts a short summary. Set `IP_SALT` to any random string.

## 5. Email

Cloudflare Email Routing: create `hello@echo-tech.website` forwarding to your inbox, then keep `email` in `src/site.config.json` in sync.

## 6. After launch

- Google Search Console: add the domain property, submit `https://echo-tech.website/sitemap.xml`.
- Google Business Profile for Echo Tech.
- Cloudflare Web Analytics: copy the token to `analyticsToken` in `src/site.config.json` and rebuild.
- Check headers at securityheaders.com and the structured data with Google's Rich Results Test.
- Test the `/` and `/en/` pages on a real phone in light and dark.

## Local development

```bash
npm run dev          # builds, then serves public/ with Functions and a local D1
npm run db:init      # once, to create the local table
```

Put local secrets in `.dev.vars` (git-ignored).
