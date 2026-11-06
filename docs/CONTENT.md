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
