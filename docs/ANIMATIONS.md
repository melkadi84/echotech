# Motion system

Principle: motion is the echo. Things emit, ripple and fade. Nothing bounces for decoration.

| Name | Where | Trigger | Implementation |
|---|---|---|---|
| Boot loader | Full-screen on every page load, refresh included | Page load | `.boot` in HTML, hidden by `site.js` after `load` (min 0.7s, max 4s). Hidden without JS. |
| Spinner | Boot loader label, form submit button, any future loading state | State change | `.spinner` (SVG: track + rotating arc + pulsing core). Reuse by adding `<span class="spinner">` from `build.mjs` `spinner()`. Add `aria-busy="true"` on the button. |
| Hero echo | Hero background | Continuous | Six `.wave` rings scale 0.1 to 1 while fading, 9s loop, staggered. `.core` pops in then breathes. |
| Hero sequence | Hero text | Page load | Heading, text, buttons rise in with 120ms stagger. The single orchestrated entrance on the page. |
| Tap ring | Hero | Click or tap on empty hero area | `site.js` appends `.tap-ring` at the pointer; removed on `animationend`. |
| Button ripple | Every `.btn` | Pointer down | `.ripple` span at the pointer, removed on `animationend`. |
| Theme reveal | Whole page | Theme button | View Transitions API. New theme expands as a circle from the button. Falls back to an instant switch. |
| Logo nudge | Header and footer brand | Hover | Rings shift 3px (`nudge`). |
| Service line | Each service row | Hover or focus-within | A `--ring` line draws across the top edge. |
| Process dots | "How we work" | First time in view | Inner dots fill one after another (IntersectionObserver adds `.is-in`). |
| Scroll progress | Top of page | Scroll | `.progress` scaleX driven by `site.js`; origin flips in RTL. |
| Menu | Mobile nav | Menu button | Slide and fade, 250ms. |

## Rules for new motion

1. Only `transform` and `opacity`.
2. Must answer a user action, show loading, or belong to the hero sequence. No scroll-triggered fade-ups on every section.
3. Durations: feedback 150–250ms, reveals 500–700ms, ambient loops 6–9s.
4. `prefers-reduced-motion: reduce` collapses everything (see end of `site.css`); ambient rings show as a static set, the spinner keeps a slow rotation so loading stays visible.
5. Check RTL: any horizontal movement must flip (use logical properties or `[dir="rtl"]` overrides).

## Logo animation (reuse in video, app splash, email)

Intro: disc scales from 0 with an ease-out (0.7s), name fades in at 0.5s. Loop: a ring leaves the disc towards the inline-end, travels about 1 disc diameter and fades over 3.2s; three rings staggered by about 1.07s.

| Client strip | Continuous slow scroll in `#work` (owner-approved exception) | Page view | `.marquee__track` translateX only. Pauses on hover/focus, via the pause button, and when off-screen (`sections.js`). Static and scrollable under reduced motion. |
| Service switch | 0.45s fade-up of the selected panel | Click or key on a service tab | `.panel` `swap` keyframes (opacity/transform). |

## Hero signal map

Part of the single hero sequence: three echo rings expand from the core (6s loop), and a dot travels to each service node in turn (10s loop) while the node flashes. Transform and opacity only. Under reduced motion the dots and flashes are hidden and the rings rest as static circles. Hovering or focusing a dock link lights its node (`initSignal` in `sections.js`).
