# Content plan

## What the site contains now

Hero, Services (5), Selected work (Joy Zone case), How we work (5 steps), How we think (3 principles), Questions (6), Contact form, footer. Arabic and English, same structure.

## Case study template (use for each new client)

Fill `work` in both content files. One block per client:

- **Client and kind** (one line, what they do and where)
- **What we delivered** (2–4 short items)
- **Summary** (two sentences: what we built and what it does for them)
- **Link** (only if the client agrees)
- **Result** (only a real, checkable number: load time, enquiries per month, cameras installed, uptime)
- **Quote** (see below)

To support several case studies, turn `work.joyZone` into an array in both JSONs and map it in `src/build.mjs`. Do this when the second project is ready.

## Testimonials

`work.testimonials` is empty on purpose. The section renders only when it has items:

```json
{ "text": "Quote in the client's own words.", "name": "Full name", "role": "Role, Business" }
```

Ask for: permission to publish the name, a short quote about the outcome ("the cameras were live in one day"), and a Google Business review. Do not edit quotes beyond typos. Add to both languages.

## Content still needed from the owner

| Item | Where it goes |
|---|---|
| Contact mailbox (Cloudflare Email Routing) | `src/site.config.json` `email` |
| WhatsApp number (digits with country code) | `whatsapp` |
| LinkedIn, Facebook, Instagram, GitHub, X | `social` (also feeds schema.org `sameAs`) |
| Joy Zone permission and quote | `work` |
| Real numbers: years of experience, projects delivered | Add a trust line to the hero only when true |
| Pricing approach: from-price per service or quote only | Services rows |
| Support terms: hours, response time, SLA | FAQ answer and a new section if wanted |
| Photos of real installs (before/after) | Work section |
| Team: names and short bios | New "About" section |
| Business policies in FAQ (account ownership, support) | Confirm wording |

## Later additions (in priority order)

1. More case studies with photos and results.
2. About section with the founder and team.
3. Blog or short guides ("How many cameras does a shop need", "Wi-Fi for small offices") for search traffic.
4. Online booking for site visits.
5. Pricing guide or package table.
6. Dedicated pages per service for search (`/services/cctv/`).

## Search and schema

`build.mjs` writes JSON-LD for Organization/ProfessionalService with the offer catalog, WebSite, WebPage and FAQPage (from the FAQ), plus hreflang links and a sitemap. Add `Review` markup only when real reviews are shown on the page.

## Client strip

The strip in `#work` shows each real client as logo + name. Only Joy Zone exists today, so it alternates with a "Your business" slot linking to the contact form. To add a client: put the logo in `public/assets/clients/<name>.svg`, add the client to `src/content/*.json` and `src/build.mjs` with the client's permission. Never add a client that is not real.

## Sub pages

The build creates one page per service (`/services/<id>/`, `/en/services/<id>/`) and a work page (`/work/`, `/en/work/`). Service page copy lives in `services.items[].page` (title, description, lead, included, needs) in both language files. Keep it descriptive of how we work; no prices, metrics or promises the owner has not approved. Every page gets canonical, hreflang, JSON-LD (Service and BreadcrumbList) and a sitemap entry automatically.

## Adding a service

1. Append an object to `services.items` in both `ar.json` and `en.json` (same `id`, `name`, `summary`, `points`, and a `page` block).
2. Add the service name to `contact.form.serviceOptions` in both files, before "Something else". The Worker reads the allowed values from there.
3. Add an icon with the same `id` in the `icons` map in `src/build.mjs` (a generic ring is used if missing).
4. Run `npm run build`. The signal map, dock, picker, service page, sitemap and schema all follow the list.
