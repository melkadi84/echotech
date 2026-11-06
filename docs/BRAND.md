# Echo Tech brand guide

## Idea

A solid disc with rings that fade behind it. The disc is the signal, the rings are the echo: work that keeps reaching the client after delivery. It also reads as a lens (CCTV), a node (network) and a pulse (apps, web).

## Logo

| File | Use |
|---|---|
| `public/assets/brand/logo-mark.svg` | Primary mark, full colour. Works on light and dark. |
| `logo-mark-mono-ink.svg` | One colour, on light backgrounds (print, stamps, fax). |
| `logo-mark-mono-white.svg` | One colour, on dark or photo backgrounds. |
| `logo-lockup-onlight.svg`, `logo-lockup-ondark.svg` | Mark + "ECHO TECH". Text uses Readex Pro, falls back to system sans. Convert text to outlines before sending to print. |
| `public/favicon.svg`, `favicon.ico`, `apple-touch-icon.png` | Browser and device icons. The SVG favicon lightens the disc in dark mode. |
| `assets/brand/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | PWA icons. |
| `assets/brand/og-image.png` | Social share image, 1200×630. Source: `brand/og-image.svg`. |

Rules: clear space around the mark equals the disc radius. Minimum size 16px (favicon) or 10mm in print. Do not recolour, stretch, rotate, outline, add shadows or place on busy photos. Under 24px drop the outer ring (favicon already does this visually).

## Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `--cobalt` | `#1D4ED8` | `#1D4ED8` (disc `#2F5FE6` on dark UI) | Brand disc, primary buttons |
| `--sky` / `--ring` | `#60A5FA` | `#60A5FA` | Echo rings, accents, links in dark |
| `--bg` | `#F6F8FE` | `#060A18` | Page background |
| `--bg-2` | `#EAF0FD` | `#0C1330` | Alternate sections |
| `--ink` | `#0A1230` | `#EAF0FF` | Text |
| `--muted` | `#55608A` | `#93A0C8` | Secondary text |
| `--line` | `#D5DEF5` | `#1B2650` | Dividers and borders |
| `--link` | `#1D4ED8` | `#7DB4FB` | Links |

Contrast: ink on bg is above 15:1 in both modes; white on cobalt buttons is about 6.7:1; muted on bg passes AA for body text.

## Typography

**Readex Pro** (Google Fonts), variable weight 300–700, one family for Arabic and Latin so both scripts feel like the same brand. Headings 600, body 400, buttons 500. Latin headings use tight tracking (`-0.02em`); Arabic headings use none and a taller line height (1.3, body 1.95). Hero size `clamp(2.3rem, 4.4vw + .7rem, 4.9rem)`. Body 17px, line length under 62ch.

## Layout and shape

Left-aligned (start-aligned in RTL) text, wide margins, hairline dividers that carry meaning (they separate list items). Pills for buttons and header controls, 10px radius for form fields. No card grids and no decorative gradients. The progress bar at the top of the page is the only gradient and it is functional.

## Voice

Plain, specific, calm. Say what we do and what the client gets. Never claim numbers, awards or clients we do not have.

## Tone in Arabic

Modern standard Arabic that reads naturally to Egyptian and Gulf clients. Keep technical terms (VPN, DNS, Cloudflare, CRM) in Latin letters.
